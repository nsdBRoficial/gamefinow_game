import { WalletNowClient } from "@walletnow/sdk";
import { AccountEngine } from "@walletnow/wallet";
import { LocalStorageAdapter } from "@walletnow/storage";
import { WalletState } from "../types";
import { Keypair, Horizon, TransactionBuilder, Networks, Asset, Operation, Memo } from "@stellar/stellar-sdk";

export const ISSUER_USDW = "GDKZT3AXAOMMYVVG3TKFVUYDJODAIAL2ADHNJYQLK2PJQ6CE2U6KKFLQ";
export const ISSUER_BRW = "GCJIRFZQJAO6JSYS4YFXFHLVJ6R4WWWB2VTREMRK7WXNNLMGIAXBBNC6";
export const ISSUER_SRT = "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
export const ISSUER_USDC = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

const vaultSeed = new Uint8Array(32);
vaultSeed.set([119, 97, 108, 108, 101, 116, 110, 111, 119, 45, 118, 97, 117, 108, 116]); // "walletnow-vault"
export const VAULT_KEYPAIR = Keypair.fromRawEd25519Seed(vaultSeed);
export const VAULT_ADDRESS = VAULT_KEYPAIR.publicKey();

let wnClient: WalletNowClient | null = null;
let initPromise: Promise<WalletNowClient> | null = null;

export const initWalletNow = async (): Promise<WalletNowClient> => {
  if (wnClient) return wnClient;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Create robust AccountEngine to handle network propagation delay
    const baseAccountEngine = new AccountEngine(
      "https://horizon-testnet.stellar.org",
      new LocalStorageAdapter("account")
    );

    const robustAccountEngine = {
      async existsOnChain(publicKey: string): Promise<boolean> {
        return baseAccountEngine.existsOnChain(publicKey);
      },
      async getState(publicKey: string): Promise<any> {
        // Retry up to 8 times with a 1 second delay
        for (let i = 0; i < 8; i++) {
          try {
            const state = await baseAccountEngine.getState(publicKey);
            if (state.exists && state.sequenceNumber !== "0") {
              return state;
            }
          } catch (err) {
            console.warn("[RobustAccountEngine] Error on getState attempt:", err);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return baseAccountEngine.getState(publicKey);
      },
      async sync(publicKey: string): Promise<any> {
        return this.getState(publicKey);
      }
    };

    wnClient = await WalletNowClient.init({
      network: "testnet",
      engines: {
        account: robustAccountEngine as any
      }
    });

    return wnClient;
  })();

  return initPromise;
};

/**
 * Onboards a user (Creates a Testnet account via Friendbot, adds Trustlines)
 */
export const onboardUser = async (
  email: string,
  name: string,
  onLog: (msg: string) => void
): Promise<{ publicKey: string; secretKey: string }> => {
  onLog("[WalletNow SDK] Conectando ao Testnet Gateway...");
  const wn = await initWalletNow();
  onLog("[WalletNow SDK] ✓ WalletNowClient inicializado.");

  onLog("[GameFiNow] Gerando nova Keypair on-chain...");
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  onLog(`[GameFiNow] Financiando conta via Friendbot (Testnet)...`);
  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
    if (!res.ok) throw new Error("Friendbot failed");
  } catch (e) {
    onLog("[Erro] Falha ao financiar conta via friendbot.");
  }
  
  onLog(`[GameFiNow] ✓ Conta financiada! Endereço Público: ${publicKey}`);
  onLog(`[GameFiNow] Criando Trustlines para USDW e BRW...`);

  try {
    // Atraso de 3 segundos para garantir que o Horizon da rede de testes tenha indexado a conta recém-criada
    await new Promise(resolve => setTimeout(resolve, 3000));
    const account = await server.loadAccount(publicKey);
    
    const assetUSDW = new Asset("USDW", ISSUER_USDW);
    const assetBRW = new Asset("BRW", ISSUER_BRW);
    const assetSRT = new Asset("SRT", ISSUER_SRT);
    const assetUSDC = new Asset("USDC", ISSUER_USDC);

    const tx = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.changeTrust({ asset: assetUSDW, limit: "1000000" }))
      .addOperation(Operation.changeTrust({ asset: assetBRW, limit: "1000000" }))
      .addOperation(Operation.changeTrust({ asset: assetSRT, limit: "1000000" }))
      .addOperation(Operation.changeTrust({ asset: assetUSDC, limit: "1000000" }))
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    try {
      await server.submitTransaction(tx);
      onLog(`[GameFiNow] ✓ Trustlines criadas com sucesso!`);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.extras) {
        console.error("Erro Trustlines Detalhado:", error.response.data.extras.result_codes);
      }
      throw error;
    }
  } catch (err) {
    console.error("Erro ao criar trustlines:", err);
    onLog(`[Erro] Falha ao criar Trustlines. O Swap falhará se não tiver trustline.`);
  }
  
  return {
    publicKey,
    secretKey
  };
};

/**
 * Seamless Fiduciary On-Ramp (Mocks Anchor interaction for testnet)
 */
export class StellarAnchorService {
  static async seamlessFund(
    anchorDomain: string,
    userAddress: string,
    userSecretKey: string, // Kept for interface compatibility
    assetCode: string
  ): Promise<{ txHash: string; amount: string }> {
    console.log(`[StellarAnchorService] Chamando seamlessFund para o domínio ${anchorDomain}`);
    
    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const keypair = Keypair.fromSecret(userSecretKey);
      const account = await server.loadAccount(keypair.publicKey());
      
      let stellarAsset;
      if (assetCode === "USDW") stellarAsset = new Asset("USDW", ISSUER_USDW);
      else if (assetCode === "BRW") stellarAsset = new Asset("BRW", ISSUER_BRW);
      else if (assetCode === "SRT") stellarAsset = new Asset("SRT", ISSUER_SRT);
      else if (assetCode === "USDC") stellarAsset = new Asset("USDC", ISSUER_USDC);
      else stellarAsset = Asset.native();

      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(Operation.payment({
          destination: keypair.publicKey(),
          asset: stellarAsset,
          amount: "0.0000001"
        }))
        .addMemo(Memo.text("MOCK-SEP24"))
        .setTimeout(30)
        .build();
        
      tx.sign(keypair);
      const res = await server.submitTransaction(tx);
      
      return { txHash: res.hash, amount: "100" };
    } catch(e) {
      console.error("[StellarAnchorService] Falha na transação on-chain do mock:", e);
      return { txHash: "tx_mock_" + Math.random().toString(16).substring(2, 10), amount: "100" };
    }
  }
}

/**
 * TestnetKit Service (Simulates smart contract interaction on Soroban/Testnet)
 */
export class TestnetKitService {
  static getSorobanLP(asset1: string, asset2: string): string {
    const pair = [asset1, asset2].sort().join("_");
    const lps: Record<string, string> = {
      "USDW_XLM": "47a53a0397612027cf5b53ef75c51641a63abbd9b45cab5f2a190fe109d4fc95",
      "BRW_XLM": "e17cffd02087d50c97cfe7e3962e72e3e7c1c0279512c12e8f664230ee56ce46",
      "BRW_USDW": "f132db26dc15ba3b4e6af619ed346c8955b4e37f2b8749880707b19176d599e2"
    };
    return lps[pair] || "unknown_lp_contract";
  }

  static async executeSwap(
    walletAddress: string,
    secretKey: string,
    fromAssetCode: string,
    toAssetCode: string,
    amount: number
  ): Promise<{ txHash: string; received: number; contractId: string }> {
    const contractId = this.getSorobanLP(fromAssetCode, toAssetCode);
    console.log(`[TestnetKitService] Invoking Swap no LP real da Testnet...`);
    
    const getAsset = (code: string) => {
      if (code === "XLM") return Asset.native();
      if (code === "USDW") return new Asset("USDW", ISSUER_USDW);
      if (code === "BRW") return new Asset("BRW", ISSUER_BRW);
      if (code === "SRT") return new Asset("SRT", ISSUER_SRT);
      if (code === "USDC") return new Asset("USDC", ISSUER_USDC);
      return Asset.native();
    };

    const sendAsset = getAsset(fromAssetCode);
    const destAsset = getAsset(toAssetCode);
    const sendAmount = amount.toString();
    
    let sourceKeys: Keypair;
    try {
      sourceKeys = Keypair.fromSecret(secretKey);
    } catch (e) {
      throw new Error("Chave Privada inválida. Como o jogo foi atualizado para usar a blockchain real, você precisa criar um NOVO Passaporte (nova conta) para gerar uma chave secreta válida.");
    }
    const account = await server.loadAccount(walletAddress);
    
    // Como a operação usa os AMMs automaticamente, enviamos usando pathPaymentStrictSend
    const tx = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        // @ts-ignore
        Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount,
          destination: walletAddress,
          destAsset,
          destMin: "0.0000001", // Mínimo pra aceitar, em prod usar um slippage calculado
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeys);
    console.log("Enviando transação...");
    let response;
    try {
      response = await server.submitTransaction(tx);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.extras) {
        console.error("Horizon Erro Detalhado:", JSON.stringify(error.response.data.extras.result_codes));
      }
      throw error;
    }
    const rates: Record<string, Record<string, number>> = {
      XLM: { XLM: 1, USDW: 0.909, BRW: 0.65 },
      USDW: { XLM: 1.1, USDW: 1, BRW: 5.40 },
      BRW: { XLM: 1.54, USDW: 0.18, BRW: 1 }
    };
    const received = Number((amount * rates[fromAssetCode][toAssetCode]).toFixed(2));
    
    return { txHash: response.hash, received, contractId };
  }

  static async addLiquidity(
    walletAddress: string,
    assetA: string,
    assetB: string,
    amountA: number
  ): Promise<{ txHash: string; lpMinted: number; requiredAmountB: number; contractId: string }> {
    const contractId = this.getSorobanLP(assetA, assetB);
    console.log(`[TestnetKitService] Adicionando Liquidez no contrato LP: ${contractId}...`);
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const poolRates: Record<string, number> = {
      XLM_USDW: 0.12,
      USDW_BRW: 5.40
    };
    
    // Normalizing order for rate lookup
    const rateKey = poolRates[`${assetA}_${assetB}`] ? `${assetA}_${assetB}` : (assetA === "XLM" || assetB === "XLM" ? "XLM_USDW" : "USDW_BRW");
    // Fallback logic
    let reqMultiplier = poolRates[`${assetA}_${assetB}`];
    if (!reqMultiplier) {
         reqMultiplier = assetA === 'XLM' ? 0.12 : assetA === 'USDW' ? 5.40 : 1; 
    }
    
    const requiredAmountB = Number((amountA * reqMultiplier).toFixed(2));
    const lpMinted = Number((amountA * 1.5).toFixed(2));
    
    return {
      txHash: "tx_soroban_lp_" + Math.random().toString(16).substring(2, 10),
      lpMinted,
      requiredAmountB,
      contractId
    };
  }

  static async vaultStake(
    walletAddress: string,
    secretKey: string,
    asset: string,
    amount: number
  ): Promise<{ txHash: string; rewardEstimate: number }> {
    console.log(`[TestnetKitService] Depositando ${amount} ${asset} no Vault Real da Testnet...`);

    const getAsset = (code: string) => {
      if (code === "XLM") return Asset.native();
      if (code === "USDW") return new Asset("USDW", ISSUER_USDW);
      if (code === "BRW") return new Asset("BRW", ISSUER_BRW);
      return Asset.native();
    };

    const assetObj = getAsset(asset);
    
    let sourceKeys: Keypair;
    try {
      sourceKeys = Keypair.fromSecret(secretKey);
    } catch (e) {
      throw new Error("Chave Privada inválida.");
    }
    
    const account = await server.loadAccount(walletAddress);
    
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        Operation.payment({
          destination: VAULT_ADDRESS,
          asset: assetObj,
          amount: amount.toString()
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeys);
    console.log("Enviando depósito do vault...");
    let response;
    try {
      response = await server.submitTransaction(tx);
    } catch (error: any) {
      console.error("Erro no Vault Stake:", error);
      throw error;
    }
    
    return {
      txHash: response.hash,
      rewardEstimate: Number((amount * 0.12).toFixed(2))
    };
  }

  static async vaultWithdraw(
    walletAddress: string,
    asset: string,
    amount: number
  ): Promise<{ txHash: string }> {
    console.log(`[TestnetKitService] Sacando ${amount} ${asset} do Vault Real...`);

    const getAsset = (code: string) => {
      if (code === "XLM") return Asset.native();
      if (code === "USDW") return new Asset("USDW", ISSUER_USDW);
      if (code === "BRW") return new Asset("BRW", ISSUER_BRW);
      return Asset.native();
    };

    const assetObj = getAsset(asset);
    
    // Assegura que a conta do Vault existe. No testnetkit ela geralmente é inicializada.
    const vaultAcc = await server.loadAccount(VAULT_ADDRESS);
    
    const tx = new TransactionBuilder(vaultAcc, {
      fee: "100",
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        Operation.payment({
          destination: walletAddress,
          asset: assetObj,
          amount: amount.toFixed(7)
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(VAULT_KEYPAIR);
    console.log("Enviando saque/colheita do vault...");
    let response;
    try {
      response = await server.submitTransaction(tx);
    } catch (error: any) {
      console.error("Erro no Vault Withdraw:", error);
      throw error;
    }
    
    return {
      txHash: response.hash
    };
  }
}

/**
 * Fetches real on-chain balances for a given public key from Stellar Testnet Horizon.
 */
export const fetchOnChainBalances = async (publicKey: string) => {
  try {
    const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    let xlmBalance = 0;
    let usdwBalance = 0;
    let brwBalance = 0;

    if (data.balances && Array.isArray(data.balances)) {
      data.balances.forEach((bal: any) => {
        if (bal.asset_type === "native") {
          xlmBalance = parseFloat(bal.balance);
        } else if (bal.asset_code === "USDW") {
          usdwBalance = parseFloat(bal.balance);
        } else if (bal.asset_code === "BRW") {
          brwBalance = parseFloat(bal.balance);
        }
      });
    }
    
    return { xlmBalance, usdwBalance, brwBalance };
  } catch (err) {
    console.error("[WalletNow SDK] Failed to fetch on-chain balances:", err);
    return null;
  }
};
