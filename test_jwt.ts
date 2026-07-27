import { Keypair } from "@stellar/stellar-sdk";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

async function testAuth() {
  const kp = Keypair.random();
  const publicKey = kp.publicKey();

  console.log("1. Gerando token no backend para:", publicKey);
  const authRes = await fetch("http://localhost:3001/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey })
  });
  
  if (!authRes.ok) {
    console.error("Erro ao gerar token", await authRes.text());
    return;
  }
  
  const { token } = await authRes.json();
  console.log("Token gerado com sucesso:", token.substring(0, 30) + "...");

  console.log("2. Criando cliente Supabase customizado...");
  const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  console.log("3. Testando escrita na tabela players (deve passar por ser o próprio usuário)...");
  const { error: insertErr } = await authSupabase.from("players").upsert({
    id: publicKey,
    stellar_address: publicKey,
    name: "TestPlayer",
    last_seen: new Date().toISOString()
  });

  if (insertErr) {
    console.error("Erro ao escrever no banco (RLS bloqueou?):", insertErr);
  } else {
    console.log("Escrita realizada com SUCESSO! RLS e JWT configurados perfeitamente.");
  }
}

testAuth();
