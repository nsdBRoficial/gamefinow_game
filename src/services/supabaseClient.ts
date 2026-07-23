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
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey);

// Cliente pode ser null se as variáveis de ambiente não estiverem configuradas
let _supabase: SupabaseClient | null = null;

if (MULTIPLAYER_ENABLED && supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  });
}

export const supabase = _supabase;

export default supabase;
