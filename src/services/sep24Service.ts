import { TransactionBuilder, Networks, Keypair } from "@stellar/stellar-sdk";

export class SEP24Service {
  private static anchorDomain = "testanchor.stellar.org";
  private static tomlData: any = null;

  // 1. Fetch stellar.toml
  private static async getToml() {
    if (this.tomlData) return this.tomlData;
    
    // In a real app we'd parse the TOML, but here we just fetch it as text and extract what we need
    // Or we can just use the known URLs for the SDF test anchor to avoid importing a TOML parser
    this.tomlData = {
      WEB_AUTH_ENDPOINT: `https://${this.anchorDomain}/auth`,
      TRANSFER_SERVER_SEP0024: `https://${this.anchorDomain}/sep24`,
    };
    return this.tomlData;
  }

  // 2. Authenticate via SEP-10
  private static async authenticate(publicKey: string, secretKey: string): Promise<string> {
    const toml = await this.getToml();
    
    // Get challenge
    const challengeRes = await fetch(`${toml.WEB_AUTH_ENDPOINT}?account=${publicKey}`);
    const challengeData = await challengeRes.json();
    
    if (!challengeRes.ok) throw new Error("Falha ao obter desafio SEP-10: " + challengeData.error);

    const transaction = TransactionBuilder.fromXDR(challengeData.transaction, Networks.TESTNET);
    const keypair = Keypair.fromSecret(secretKey);
    
    transaction.sign(keypair);
    const signedXdr = transaction.toXDR();

    // Submit signed challenge
    const authRes = await fetch(toml.WEB_AUTH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: signedXdr })
    });
    
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error("Falha na autenticação SEP-10: " + authData.error);
    
    return authData.token;
  }

  public static async initiateDeposit(publicKey: string, secretKey: string, assetCode: string = "SRT", amount?: string) {
    console.log(`[SEP24] Iniciando depósito de ${assetCode} via SEP-24...`);
    const jwt = await this.authenticate(publicKey, secretKey);
    const toml = await this.getToml();

    // HIBRIDO: Se for ativo suportado pela âncora SDF (SRT/USDC), processa no servidor real.
    // Caso contrário (BRW/USDW/XLM), gera um mock in-game perfeito.
    if (assetCode !== "SRT" && assetCode !== "USDC") {
      const mockId = `mock-tx-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      // Cria a store global de status caso não exista
      if (!(window as any).mockSep24Status) {
        (window as any).mockSep24Status = {};
      }
      (window as any).mockSep24Status[mockId] = "incomplete";
      
      return {
        url: `game-internal:mock-kyc`,
        id: mockId,
        jwt: jwt
      };
    }

    const bodyData: any = {
      asset_code: assetCode,
      account: publicKey
    };
    if (amount) {
      bodyData.amount = amount;
    }

    // Call interactive deposit endpoint
    const depositRes = await fetch(`${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    const depositData = await depositRes.json();
    if (!depositRes.ok) throw new Error("Falha ao iniciar depósito SEP-24: " + depositData.error);

    return {
      url: depositData.url,
      id: depositData.id,
      jwt: jwt
    };
  }

  // 4. Poll transaction status
  public static async pollTransactionStatus(id: string, jwt: string): Promise<string> {
    // Interceptor Híbrido
    if (id.startsWith("mock-tx-")) {
      return (window as any).mockSep24Status?.[id] || "error";
    }

    const toml = await this.getToml();
    
    const res = await fetch(`${toml.TRANSFER_SERVER_SEP0024}/transaction?id=${id}`, {
      headers: {
        "Authorization": `Bearer ${jwt}`
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Falha ao consultar transação: " + data.error);
    
    return data.transaction.status; // e.g. "incomplete", "completed", "pending_user_transfer_start"
  }
}
