/**
 * authService.ts
 * Serviço de autenticação centralizada do GameFiNow.
 * Responsável por:
 * 1. Fluxo de login com Google OAuth através do Supabase.
 * 2. Detecção automática de perfil existente ou provisionamento da carteira Stellar Ed25519 (onboardUser).
 * 3. Recuperação de conta em 1 clique via Google UID / E-mail.
 * 4. Vínculo atômico de conta anônima/convidado ao perfil Google.
 */

import { supabase, MULTIPLAYER_ENABLED } from "./supabaseClient";
import { onboardUser } from "./stellarServices";
import { Keypair } from "@stellar/stellar-sdk";

export interface GoogleUserProfile {
  id: string; // stellar_address ou id no banco
  stellar_address: string;
  name: string;
  google_uid?: string;
  email?: string;
  level?: number;
  xp_current?: number;
  gender?: "male" | "female";
  head_color?: string;
  torso_color?: string;
  legs_color?: string;
  shoes_color?: string;
  skin_color?: string;
  head_type?: string;
  torso_type?: string;
  shoes_type?: string;
  face_type?: string;
  accessory_type?: string;
  active_outfit?: string;
  owned_outfits?: string[];
  active_title?: string;
  unlocked_titles?: string[];
  name_style?: string;
}

export interface AuthActionResult {
  success: boolean;
  isNewUser?: boolean;
  profile?: GoogleUserProfile;
  secretKey?: string;
  error?: string;
}

class AuthService {
  /**
   * Inicia o fluxo de login com o Google via Supabase OAuth.
   * Redireciona o usuário para consentimento do Google mantendo a rota atual.
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!supabase) {
      return {
        error: new Error("Serviço de autenticação offline: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env"),
      };
    }

    const redirectTo = typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error: error ? new Error(error.message) : null };
  }

  /**
   * Obtém a sessão ativa do usuário atual no Supabase Auth.
   */
  async getCurrentSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Desconecta a sessão ativa do Supabase
   */
  async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  /**
   * Processa a sessão do Google após o redirect OAuth ou durante a inicialização.
   * - Se o perfil já existir no banco (por google_uid ou email), restaura todos os dados e o stellar_address.
   * - Se for o primeiro acesso, cria a carteira Stellar on-chain (Friendbot + Trustlines) e vincula ao Google.
   */
  async handleGoogleAuthSession(
    onProgress?: (message: string) => void
  ): Promise<AuthActionResult> {
    if (!supabase) {
      return { success: false, error: "Supabase client indisponível" };
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: userError?.message || "Nenhum usuário logado via Google" };
      }

      const googleUid = user.id;
      const email = user.email || "";
      const googleName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "Herói Solar";

      onProgress?.("Buscando dados de aventureiro associados à sua conta Google...");

      // 1. Verifica se já existe um jogador registrado com este google_uid ou email
      const { data: existingPlayer, error: searchError } = await supabase
        .from("players")
        .select("*")
        .or(`google_uid.eq.${googleUid},email.eq.${email}`)
        .maybeSingle();

      if (searchError) {
        console.warn("[AuthService] Erro ao buscar jogador existente:", searchError);
      }

      // CASO A: Jogador existente recuperado com sucesso
      if (existingPlayer) {
        onProgress?.(`Bem-vindo de volta, ${existingPlayer.name}! Restaurando seu progresso...`);
        
        // Se ainda não tinha google_uid gravado (ex: vinculado apenas por email anteriormente), atualiza
        if (!existingPlayer.google_uid && googleUid) {
          await supabase
            .from("players")
            .update({ google_uid: googleUid })
            .eq("id", existingPlayer.id);
        }

        return {
          success: true,
          isNewUser: false,
          profile: existingPlayer,
        };
      }

      // CASO B: Novo jogador! Provisionar chave Stellar Ed25519 nativa e criar Trustlines
      onProgress?.("Primeiro acesso detectado! Forjando sua carteira Stellar nativa...");

      let keypairGenerated = { publicKey: "", secretKey: "" };

      try {
        keypairGenerated = await onboardUser(
          email,
          googleName,
          (logMsg) => onProgress?.(logMsg)
        );
      } catch (onboardErr) {
        console.warn("[AuthService] Fallback de criação local de Keypair:", onboardErr);
        // Fallback resiliente: se Friendbot oscilar, gera par de chaves localmente
        const localKp = Keypair.random();
        keypairGenerated = {
          publicKey: localKp.publicKey(),
          secretKey: localKp.secret(),
        };
      }

      onProgress?.("Registrando herói na base do GameFiNow...");

      const newPlayerPayload: GoogleUserProfile = {
        id: keypairGenerated.publicKey,
        stellar_address: keypairGenerated.publicKey,
        name: googleName,
        google_uid: googleUid,
        email: email,
        gender: "male",
        head_color: "#3b82f6",
        torso_color: "#ef4444",
        legs_color: "#2563eb",
        shoes_color: "#1e293b",
        skin_color: "#ffdbac",
        head_type: "topete",
        torso_type: "classic",
        shoes_type: "sneakers",
        face_type: "smile",
        accessory_type: "backpack",
      };

      const { data: insertedPlayer, error: insertError } = await supabase
        .from("players")
        .insert([newPlayerPayload])
        .select()
        .single();

      if (insertError) {
        console.error("[AuthService] Erro ao registrar perfil novo:", insertError);
        // Continua com os dados gerados localmente para não bloquear o jogador
      }

      return {
        success: true,
        isNewUser: true,
        profile: insertedPlayer || newPlayerPayload,
        secretKey: keypairGenerated.secretKey,
      };
    } catch (err: any) {
      console.error("[AuthService] Erro no fluxo Google Auth:", err);
      return { success: false, error: err.message || "Erro inesperado durante login com Google" };
    }
  }

  /**
   * Permite que um jogador já conectado como Convidado vincule sua carteira Stellar atual à conta Google.
   */
  async linkCurrentWalletToGoogle(
    stellarAddress: string,
    playerName: string
  ): Promise<AuthActionResult> {
    if (!supabase) {
      return { success: false, error: "Supabase client indisponível" };
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: "Faça login com sua conta Google primeiro para vincular." };
      }

      const googleUid = user.id;
      const email = user.email || "";

      const { data, error } = await supabase
        .from("players")
        .upsert({
          id: stellarAddress,
          stellar_address: stellarAddress,
          name: playerName,
          google_uid: googleUid,
          email: email,
          last_seen: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        profile: data,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao vincular carteira ao Google" };
    }
  }
}

export const authService = new AuthService();
export default authService;
