/**
 * supabaseClient.ts
 * Singleton do cliente Supabase para o GameFiNow.
 * Utiliza variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 * Se não configuradas, o multiplayer é desabilitado automaticamente (graceful degradation).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const MULTIPLAYER_ENABLED =
  Boolean(import.meta.env.VITE_MULTIPLAYER_ENABLED === "true") &&
  Boolean(supabaseUrl && supabaseUrl.startsWith("http")) &&
  Boolean(supabaseAnonKey && supabaseAnonKey.length > 20);

let _supabase: SupabaseClient | null = null;

if (MULTIPLAYER_ENABLED && supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 40, // Aumentado de 20 → 40 para broadcasts mais fluidos (Fase 2.3)
      },
    },
  });
  console.log(`[Supabase] ✅ Cliente MMO Conectado: ${supabaseUrl}`);
} else {
  console.warn(
    "[Supabase] ⚠️ Multiplayer Desativado: Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estao definidas no arquivo .env"
  );
}

export const supabase = _supabase;

export default supabase;

