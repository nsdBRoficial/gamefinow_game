import express from "express";
import cors from "cors";
import { Keypair, Horizon, Networks, TransactionBuilder, Operation, Asset, Transaction } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const VAULT_SEED = process.env.VAULT_SEED || "walletnow-vault"; // Fallback para desenvolvimento local apenas

let VAULT_KEYPAIR: Keypair;
try {
  VAULT_KEYPAIR = Keypair.fromSecret(VAULT_SEED);
} catch (e) {
  console.log("Inicializando com seed fallback local.");
  const encoder = new TextEncoder();
  const seedBytes = new Uint8Array(32);
  const textBytes = encoder.encode(VAULT_SEED);
  seedBytes.set(textBytes.slice(0, 32));
  VAULT_KEYPAIR = Keypair.fromRawEd25519Seed(Buffer.from(seedBytes));
}

// Inicializa a conexão com o Stellar Horizon Testnet
const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org");

const ISSUER_USDW = "GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ";
const ISSUER_BRW = "GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "super-secret-jwt-token-with-at-least-32-characters";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

function getAsset(code: string) {
  if (code === "XLM") return Asset.native();
  if (code === "USDW") return new Asset("USDW", ISSUER_USDW);
  if (code === "BRW") return new Asset("BRW", ISSUER_BRW);
  return Asset.native();
}

// ─── Endpoint de Autenticação Supabase (Achado 4) ──────────────────────────
app.post("/api/auth/token", (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: "Missing publicKey" });

  try {
    // Valida se a chave é válida na curva Ed25519 do Stellar
    Keypair.fromPublicKey(publicKey);

    // Emite um JWT para o Supabase com o payload exigido (papel: authenticated)
    const token = jwt.sign(
      {
        aud: "authenticated",
        role: "authenticated",
        sub: crypto.randomUUID(),       // GoTrue EXIGE que o sub seja um UUID válido
        app_metadata: { stellar_address: publicKey }, // A RLS vai ler daqui!
        email: `${publicKey.substring(0, 10)}@gamefinow.local` 
      },
      SUPABASE_JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(400).json({ error: "Invalid public key" });
  }
});

// ─── Endpoints do Relayer (Validação e Fee) ──────────────────────────────────

const GAMEFI_TREASURY_PUBLIC_KEY = process.env.VITE_GAMEFI_TREASURY_PUBLIC_KEY || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
const GAMEFI_FEE_PERCENTAGE = 0.005;

const ESTIMATED_XLM_RATES: Record<string, number> = {
  XLM: 1.0, USDW: 8.0, USDC: 8.0, BRW: 1.5, SRT: 0.5, GAMEFI: 2.0
};

function estimateFeeInXlm(assetCode: string, amount: number): number {
  const rateInXlm = ESTIMATED_XLM_RATES[assetCode.toUpperCase()] || 1.0;
  const feeInXlm = (amount * rateInXlm) * GAMEFI_FEE_PERCENTAGE;
  return Number(Math.max(feeInXlm, 0.01).toFixed(7));
}

app.post("/api/relayer/submit", async (req, res) => {
  const { signedXdr } = req.body;
  if (!signedXdr) return res.status(400).json({ error: "Missing signedXdr" });

  try {
    const tx = new Transaction(signedXdr, Networks.TESTNET);
    let requiresFee = false;
    let requiredFeeAmount = 0;
    let paidFeeAmount = 0;
    
    // Parse operations to find if there's a stake/swap and check if fee was paid
    for (const op of tx.operations) {
      if (op.type === "payment") {
        if (op.destination === VAULT_KEYPAIR.publicKey()) {
          requiresFee = true;
          requiredFeeAmount += estimateFeeInXlm(op.asset.isNative() ? "XLM" : op.asset.code, parseFloat(op.amount));
        } else if (op.destination === GAMEFI_TREASURY_PUBLIC_KEY && op.asset.isNative()) {
          paidFeeAmount += parseFloat(op.amount);
        }
      } else if (op.type === "pathPaymentStrictSend") {
        requiresFee = true;
        requiredFeeAmount += estimateFeeInXlm(op.sendAsset.isNative() ? "XLM" : op.sendAsset.code, parseFloat(op.sendAmount));
      }
    }

    // Verify Fee
    if (requiresFee) {
      // Allow a small floating point margin (0.0001)
      if (paidFeeAmount < (requiredFeeAmount - 0.0001)) {
        console.warn(`[Relayer] Blocked TX. Required fee: ${requiredFeeAmount}, Paid: ${paidFeeAmount}`);
        return res.status(400).json({ error: `Taxa do GameFi não paga corretamente. Necessário: ${requiredFeeAmount} XLM` });
      }
    }

    console.log("[Relayer] TX Validada e Aprovada! Submetendo...");
    const response = await horizonServer.submitTransaction(tx);
    return res.json({ txHash: response.hash });
  } catch (error: any) {
    console.error("[Relayer] Erro ao submeter TX:", error?.response?.data || error);
    return res.status(500).json({ error: "Falha na simulação/submissão da transação." });
  }
});

// ─── Endpoints do Vault ──────────────────────────────────────────────────
app.post("/api/vault/withdraw", async (req, res) => {
  const { walletAddress, asset, amount } = req.body;

  if (!walletAddress || !asset || !amount) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    console.log(`[Backend Vault] Iniciando saque de ${amount} ${asset} para ${walletAddress}`);
    
    // Verifica a existência do Vault
    const vaultAddress = VAULT_KEYPAIR.publicKey();
    const vaultAcc = await horizonServer.loadAccount(vaultAddress);
    const assetObj = getAsset(asset);

    const tx = new TransactionBuilder(vaultAcc, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        Operation.payment({
          destination: walletAddress,
          asset: assetObj,
          amount: parseFloat(amount).toFixed(7)
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(VAULT_KEYPAIR);
    
    console.log("[Backend Vault] Submetendo transação...");
    const response = await horizonServer.submitTransaction(tx);
    
    console.log(`[Backend Vault] Sucesso: ${response.hash}`);
    return res.json({ txHash: response.hash });

  } catch (error: any) {
    console.error("[Backend Vault] Erro no saque:", error?.response?.data || error);
    return res.status(500).json({ error: "Erro ao realizar o saque do vault" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GameFiNow Backend Relayer rodando na porta ${PORT}`);
  console.log(`🔒 Vault Public Key: ${VAULT_KEYPAIR.publicKey()}`);
  
  // ─── Sistema Anti-Pause (Keep-Alive) ──────────────────────────────────
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log(`⏱️  Supabase Keep-Alive ativado para pingar a cada 10 minutos.`);
    setInterval(async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/players?limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        console.log(`[Keep-Alive] Ping no Supabase: Status ${response.status}`);
      } catch (err) {
        console.warn(`[Keep-Alive] Erro no ping do Supabase:`, err);
      }
    }, 10 * 60 * 1000); // 10 minutos
  } else {
    console.warn("⚠️ VITE_SUPABASE_URL não encontrada no .env. O Anti-Pause não será iniciado.");
  }
});
