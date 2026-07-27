import { Keypair, Horizon, TransactionBuilder, Networks, Asset, Operation } from "@stellar/stellar-sdk";
import dotenv from "dotenv";

dotenv.config();

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

async function testRelayer() {
  const sourceKeys = Keypair.random();
  console.log("Gerando conta (Friendbot)...");
  await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(sourceKeys.publicKey())}`);
  
  const account = await server.loadAccount(sourceKeys.publicKey());
  const VAULT_ADDRESS = "GBTR4BH2TMOEELCVYBAZ46TKGFGGQGUJK5LI3C32XYGIM475MFRSMVLO";

  console.log("Construindo transação SEM a taxa do GameFi...");
  const txWithoutFee = new TransactionBuilder(account, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(
      Operation.payment({
        destination: VAULT_ADDRESS,
        asset: Asset.native(),
        amount: "10"
      })
    )
    .setTimeout(30)
    .build();

  txWithoutFee.sign(sourceKeys);

  console.log("Enviando TX maliciosa para o Relayer...");
  const res1 = await fetch("http://localhost:3001/api/relayer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXdr: txWithoutFee.toXDR() })
  });
  console.log("Resultado TX Sem Taxa:", res1.status, await res1.text());

  const account2 = await server.loadAccount(sourceKeys.publicKey());
  console.log("Construindo transação COM a taxa do GameFi...");
  const GAMEFI_TREASURY_PUBLIC_KEY = process.env.VITE_GAMEFI_TREASURY_PUBLIC_KEY || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
  const txWithFee = new TransactionBuilder(account2, { fee: "200", networkPassphrase: Networks.TESTNET })
    .addOperation(
      Operation.payment({
        destination: VAULT_ADDRESS,
        asset: Asset.native(),
        amount: "10"
      })
    )
    .addOperation(
      Operation.payment({
        destination: GAMEFI_TREASURY_PUBLIC_KEY,
        asset: Asset.native(),
        amount: "0.05" // 0.5% of 10
      })
    )
    .setTimeout(30)
    .build();
    
  txWithFee.sign(sourceKeys);

  console.log("Enviando TX honesta para o Relayer...");
  const res2 = await fetch("http://localhost:3001/api/relayer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXdr: txWithFee.toXDR() })
  });
  console.log("Resultado TX Com Taxa:", res2.status, await res2.text());
}

testRelayer();
