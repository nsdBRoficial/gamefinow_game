import { WalletNowClient } from "@walletnow/sdk";
import { AccountEngine } from "@walletnow/wallet";
import { LocalStorageAdapter } from "@walletnow/storage";
import { WalletState } from "../types";

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

  onLog("[WalletNow SDK] ✓ WalletNowClient inicializado. Registrando credenciais...");
  
  // Call SDK onboarding
  const userResult = await wn.onboarding.createUser({
    externalId: email,
    displayName: name,
    authMethod: "passkeys",
    sponsored: true,
    trustlines: ["BRW", "USDW"]
  });

  const userAddress = userResult.stellarAddress;
  onLog(`[WalletNow SDK] ✓ Usuário criado de forma patrocinada! Endereço Público: ${userAddress}`);
  
  // No frontend de produção, as chaves privadas nunca devem ser expostas. 
  // Retornamos um stub seguro para simular compatibilidade com o state antigo caso necessário.
  return {
    publicKey: userAddress,
    secretKey: "S_HIDDEN_FOR_SECURITY_" + Date.now() // Mock
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
    
    // Simulate anchoring delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const txHash = "tx_" + Math.random().toString(16).substring(2, 10) + "000000000000000000000";
    const amount = assetCode === "BRW" ? "250" : assetCode === "USDW" ? "50" : "100";

    return { txHash, amount };
  }
}

/**
 * TestnetKit Service (Simulates smart contract interaction on Soroban/Testnet)
 */
export class TestnetKitService {
  static async executeSwap(
    walletAddress: string,
    fromAsset: string,
    toAsset: string,
    amount: number
  ): Promise<{ txHash: string; received: number }> {
    console.log(`[TestnetKitService] Executando Swap de ${amount} ${fromAsset} para ${toAsset} via Soroban...`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Base rates mock (just for testing logic)
    const rates: Record<string, Record<string, number>> = {
      XLM: { XLM: 1, USDW: 0.12, BRW: 0.65 },
      USDW: { XLM: 8.33, USDW: 1, BRW: 5.40 },
      BRW: { XLM: 1.54, USDW: 0.18, BRW: 1 }
    };
    
    const received = Number((amount * rates[fromAsset][toAsset]).toFixed(2));
    const txHash = "tx_swap_" + Math.random().toString(16).substring(2, 10);
    
    return { txHash, received };
  }

  static async addLiquidity(
    walletAddress: string,
    assetA: string,
    assetB: string,
    amountA: number
  ): Promise<{ txHash: string; lpMinted: number; requiredAmountB: number }> {
    console.log(`[TestnetKitService] Adicionando Liquidez no Pool ${assetA}/${assetB}...`);
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const poolRates: Record<string, number> = {
      XLM_USDW: 0.12,
      USDW_BRW: 5.40
    };
    
    const rateKey = `${assetA}_${assetB}`;
    const requiredAmountB = Number((amountA * poolRates[rateKey]).toFixed(2));
    const lpMinted = Number((amountA * 1.5).toFixed(2));
    
    return {
      txHash: "tx_lp_" + Math.random().toString(16).substring(2, 10),
      lpMinted,
      requiredAmountB
    };
  }

  static async vaultStake(
    walletAddress: string,
    asset: string,
    amount: number
  ): Promise<{ txHash: string; rewardEstimate: number }> {
    console.log(`[TestnetKitService] Staking ${amount} ${asset} no Vault...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return {
      txHash: "tx_stake_" + Math.random().toString(16).substring(2, 10),
      rewardEstimate: Number((amount * 0.12).toFixed(2))
    };
  }
}
