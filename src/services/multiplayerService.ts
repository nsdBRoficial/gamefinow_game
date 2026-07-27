/**
 * multiplayerService.ts
 * Serviço principal de multiplayer do GameFiNow.
 *
 * Responsabilidades:
 *  - Registrar/atualizar o jogador local no Supabase (players + players_presence)
 *  - Publicar posição do jogador (throttle 100ms)
 *  - Assinar canal Realtime do mapa atual e receber posições de outros jogadores
 *  - Gerenciar chat por mapa (envio + recebimento)
 *  - Cleanup: desconectar ao sair do mapa ou fechar a aba
 *
 * Princípio de Single Responsibility: este serviço não contém lógica de UI.
 * Os dados são entregues via callbacks para que o React os consuma.
 */

import { supabase, MULTIPLAYER_ENABLED } from "./supabaseClient";
import { Player } from "../types";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

// Re-exporta para que hooks possam importar apenas deste módulo
export { MULTIPLAYER_ENABLED };


// ─── Tipos públicos ─────────────────────────────────────────────────────────

export interface OnlinePlayer {
  player_id: string;
  name: string;
  map_id: string;
  x: number;
  y: number;
  dir: "up" | "down" | "left" | "right";
  is_moving: boolean;
  updated_at: string;
  // Customização
  head_color: string;
  torso_color: string;
  legs_color: string;
  shoes_color: string;
  skin_color: string;
  head_type: string;
  torso_type: string;
  shoes_type: string;
  face_type: string;
  accessory_type: string;
  gender: string;
  active_outfit: string | null;
  // Campos opcionais de apresentação
  bubbleText?: string;
  bubbleTimer?: number;
}

export interface ChatMessage {
  id: string;
  player_id: string;
  player_name: string;
  map_id: string;
  message: string;
  created_at: string;
}

// ─── Estado interno do serviço ───────────────────────────────────────────────

let authSupabase = supabase;
let currentPlayerId: string | null = null;
let currentMapId: string | null = null;
let presenceChannel: RealtimeChannel | null = null;
let chatChannel: RealtimeChannel | null = null;
let positionThrottleTimer: ReturnType<typeof setTimeout> | null = null;
let lastPublishedX = -1;
let lastPublishedY = -1;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

const POSITION_THROTTLE_MS = parseInt(
  import.meta.env.VITE_POSITION_THROTTLE_MS || "5000"
);
const PLAYER_TIMEOUT_MS = 30_000;
const MAX_PLAYERS_PER_MAP = parseInt(
  import.meta.env.VITE_MAX_PLAYERS_PER_MAP || "50"
);

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Gera ou recupera um ID de sessão único para este jogador.
 * Usa o publicKey da Stellar se disponível; caso contrário, gera um ID único por aba de navegador (sessionStorage).
 */
export function getOrCreatePlayerId(stellarPublicKey?: string): string {
  if (stellarPublicKey && stellarPublicKey.length > 10) {
    return stellarPublicKey;
  }

  // Usa sessionStorage em vez de localStorage para que cada guia/aba do navegador tenha um ID único de jogador
  let stored = sessionStorage.getItem("gfn_player_session_id");
  if (stored) return stored;

  const uuid = `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  sessionStorage.setItem("gfn_player_session_id", uuid);
  return uuid;
}

function isPlayerActive(player: OnlinePlayer): boolean {
  return (
    Date.now() - new Date(player.updated_at).getTime() < PLAYER_TIMEOUT_MS
  );
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Registra ou atualiza o perfil completo do jogador no banco.
 * Chamado uma vez após o login.
 */
export async function upsertPlayer(
  playerId: string,
  player: Player
): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !supabase) return;
  currentPlayerId = playerId;

  try {
    // ─── Autenticação JWT (RLS) ──────────────────────────────────────
    try {
      const authRes = await fetch("http://localhost:3001/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: playerId })
      });
      if (authRes.ok) {
        const { token } = await authRes.json();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        
        authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        if (supabase) {
          supabase.realtime.setAuth(token);
        }
        
        console.log("[Multiplayer] Autenticado com sucesso via JWT Customizado.");
      }
    } catch (authE) {
      console.warn("[Multiplayer] Servidor backend indisponível para gerar token JWT. Fallback para anon:", authE);
    }

    const { error } = await authSupabase!.from("players").upsert(
      {
        id: playerId,
        stellar_address: playerId,
        name: player.name || "Anonymo",
        last_seen: new Date().toISOString(),
        gender: player.gender || "male",
        head_color: player.headColor,
        torso_color: player.torsoColor,
        legs_color: player.legsColor,
        shoes_color: player.shoesColor,
        skin_color: player.skinColor,
        head_type: player.headType,
        torso_type: player.torsoType,
        shoes_type: player.shoesType,
        face_type: player.faceType,
        accessory_type: player.accessoryType,
        active_outfit: player.activeOutfit || null,
        owned_outfits: player.ownedOutfits || [],
        active_title: player.activeTitle || null,
        unlocked_titles: player.unlockedTitles || [],
        name_style: player.nameStyle || "plain",
      },
      { onConflict: "id" }
    );

    if (error) console.error("[Multiplayer] Erro ao registrar jogador:", error);
    else console.log("[Multiplayer] Jogador registrado:", playerId);
  } catch (err) {
    console.error("[Multiplayer] Falha ao conectar ao Supabase:", err);
  }
}

/**
 * Publica a posição do jogador local com throttle + Broadcast instantâneo via WebSocket.
 */
export function publishPosition(player: Player, playerId: string, forceUpdate: boolean = false): void {
  if (!MULTIPLAYER_ENABLED || !supabase || !playerId) return;

  // Transmite via WebSocket Broadcast instantaneamente (latência de milissegundos)
  if (presenceChannel && !forceUpdate) {
    presenceChannel.send({
      type: "broadcast",
      event: "player_move",
      payload: {
        player_id: playerId,
        name: player.name || "Anonymo",
        map_id: player.mapId || "center",
        x: player.x,
        y: player.y,
        dir: player.dir,
        is_moving: player.isMoving,
        updated_at: new Date().toISOString(),
        head_color: player.headColor,
        torso_color: player.torsoColor,
        legs_color: player.legsColor,
        shoes_color: player.shoesColor,
        skin_color: player.skinColor,
        head_type: player.headType,
        torso_type: player.torsoType,
        shoes_type: player.shoesType,
        face_type: player.faceType,
        accessory_type: player.accessoryType,
        gender: player.gender || "male",
        active_outfit: player.activeOutfit || null,
      },
    });
  }

  // Se a posição no banco não mudou significativamente, evita salvar no banco a cada micro-movimento
  if (!forceUpdate && Math.round(player.x) === lastPublishedX && Math.round(player.y) === lastPublishedY) return;

  if (positionThrottleTimer) return;

  positionThrottleTimer = setTimeout(async () => {
    positionThrottleTimer = null;
    if (!supabase) return;

    lastPublishedX = Math.round(player.x);
    lastPublishedY = Math.round(player.y);

    try {
      await authSupabase!.from("players_presence").upsert(
        {
          player_id: playerId,
          map_id: player.mapId || "center",
          x: Math.round(player.x),
          y: Math.round(player.y),
          dir: player.dir,
          is_moving: player.isMoving,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id" }
      );
    } catch (err) {
      console.warn("[Multiplayer] Falha ao persistir posição:", err);
    }
  }, POSITION_THROTTLE_MS);
}

/**
 * Busca todos os jogadores ativos em um determinado mapa.
 */
async function fetchPlayersInMap(mapId: string): Promise<OnlinePlayer[]> {
  if (!authSupabase) return [];

  try {
    const { data, error } = await authSupabase
      .from("players_presence_with_info")
      .select("*")
      .eq("map_id", mapId)
      .limit(MAX_PLAYERS_PER_MAP);

    if (error) {
      console.warn("[Multiplayer] Erro ao buscar jogadores:", error);
      return [];
    }

    const active = (data || []).filter(isPlayerActive) as OnlinePlayer[];
    return active.filter((p) => p.player_id !== currentPlayerId);
  } catch (err) {
    console.warn("[Multiplayer] Falha ao buscar jogadores:", err);
    return [];
  }
}

// Map local em memória para atualizar jogadores em tempo real sem latência
const mapLivePlayers = new Map<string, OnlinePlayer>();

/**
 * Assina o canal Realtime do mapa atual usando Presença + Broadcast via WebSockets.
 * 
 * @param mapId - ID do mapa a ser assinado
 * @param playerId - ID único do jogador
 * @param onPlayersUpdate - Callback chamado quando a lista de jogadores muda
 * @param onChatMessage - Callback opcional para mensagens de chat
 * @param playerData - Dados completos do player para o track() de presença (Fase 3.1)
 */
export function subscribeToMap(
  mapId: string,
  playerId: string,
  onPlayersUpdate: (players: OnlinePlayer[]) => void,
  onChatMessage?: (msg: ChatMessage) => void,
  playerData?: Player
): void {
  if (!MULTIPLAYER_ENABLED || !supabase) return;

  // Fase 3.2: Grace Period — guarda referência do canal anterior
  // O canal novo é criado e conectado ANTES de desconectar o antigo.
  // Isso elimina o flash de ausência que outros jogadores veem durante teleports.
  const previousPresenceChannel = presenceChannel;
  const previousChatChannel = chatChannel;

  currentMapId = mapId;
  currentPlayerId = playerId;
  mapLivePlayers.clear();

  console.log(`[Multiplayer] Conectando ao mapa: ${mapId} como ${playerId}`);

  presenceChannel = supabase
    .channel(`map-room-${mapId}`, {
      config: {
        presence: { key: playerId },
        broadcast: { ack: false, self: false },
      },
    })
    // Escuta evento de transmissão instantânea de movimento (Broadcast WebSocket)
    .on("broadcast", { event: "player_move" }, (payload: { payload: OnlinePlayer }) => {
      const p = payload.payload;
      if (p && p.player_id !== playerId && p.map_id === mapId) {
        mapLivePlayers.set(p.player_id, p);
        onPlayersUpdate(Array.from(mapLivePlayers.values()));
      }
    })
    // Escuta presença nativa Supabase Realtime
    .on("presence", { event: "sync" }, () => {
      const state = presenceChannel?.presenceState<OnlinePlayer>();
      if (state) {
        Object.keys(state).forEach((key) => {
          if (key !== playerId && state[key].length > 0) {
            mapLivePlayers.set(key, state[key][0]);
          }
        });
        onPlayersUpdate(Array.from(mapLivePlayers.values()));
      }
    })
    // Escuta mudanças de banco de dados como fallback
    .on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "players_presence",
        filter: `map_id=eq.${mapId}`,
      },
      () => {
        fetchPlayersInMap(mapId).then((players) => {
          players.forEach((p) => mapLivePlayers.set(p.player_id, p));
          onPlayersUpdate(Array.from(mapLivePlayers.values()));
        });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Multiplayer] ✅ Conectado com sucesso ao canal Realtime do mapa ${mapId}`);

        // Fase 3.2: Grace Period — remove o canal ANTERIOR somente após o novo estar pronto
        if (previousPresenceChannel && previousPresenceChannel !== presenceChannel) {
          supabase!.removeChannel(previousPresenceChannel);
        }
        if (previousChatChannel) {
          supabase!.removeChannel(previousChatChannel);
        }
        if (cleanupTimer) {
          clearInterval(cleanupTimer);
          cleanupTimer = null;
        }

        // Fase 3.1: track() com dados completos do player (não apenas player_id + map_id)
        const trackPayload: Record<string, any> = {
          player_id: playerId,
          map_id: mapId,
        };
        if (playerData) {
          trackPayload.name = playerData.name || "Anonymo";
          trackPayload.x = playerData.x;
          trackPayload.y = playerData.y;
          trackPayload.dir = playerData.dir;
          trackPayload.is_moving = playerData.isMoving;
          trackPayload.head_color = playerData.headColor;
          trackPayload.torso_color = playerData.torsoColor;
          trackPayload.legs_color = playerData.legsColor;
          trackPayload.shoes_color = playerData.shoesColor;
          trackPayload.skin_color = playerData.skinColor;
          trackPayload.head_type = playerData.headType;
          trackPayload.torso_type = playerData.torsoType;
          trackPayload.shoes_type = playerData.shoesType;
          trackPayload.face_type = playerData.faceType;
          trackPayload.accessory_type = playerData.accessoryType;
          trackPayload.gender = playerData.gender || "male";
          trackPayload.active_outfit = playerData.activeOutfit || null;
          trackPayload.updated_at = new Date().toISOString();
        }
        presenceChannel?.track(trackPayload);

        fetchPlayersInMap(mapId).then((players) => {
          players.forEach((p) => mapLivePlayers.set(p.player_id, p));
          onPlayersUpdate(Array.from(mapLivePlayers.values()));

          // Reinicia o cleanup timer após subscribe confirmado
          cleanupTimer = setInterval(() => {
            fetchPlayersInMap(mapId).then(onPlayersUpdate);
          }, 60_000);
        });
      }
    });

  // Canal de chat (somente se callback fornecido)
  if (onChatMessage) {
    chatChannel = supabase
      .channel(`chat-map-${mapId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `map_id=eq.${mapId}`,
        },
        (payload: any) => {
          onChatMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();
  }

}

/**
 * Desinscreve do mapa atual (limpa canais Realtime).
 */
export function unsubscribeFromCurrentMap(): void {
  if (!supabase) return;

  if (presenceChannel) {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  if (chatChannel) {
    supabase.removeChannel(chatChannel);
    chatChannel = null;
  }
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Remove o jogador do mapa ao desconectar.
 */
export async function removePlayerFromPresence(playerId: string): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !authSupabase || !playerId) return;
  try {
    await authSupabase
      .from("players_presence")
      .delete()
      .eq("player_id", currentPlayerId);
  } catch (err) {
    console.warn("[Multiplayer] Erro ao remover jogador:", err);
  }
}

/**
 * Envia mensagem de chat para o mapa atual.
 */
export async function sendChatMessage(
  mapId: string,
  playerId: string,
  playerName: string,
  message: string
): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !authSupabase) return;

  const trimmed = message.trim().slice(0, 200);
  if (!trimmed) return;

  const messageData = {
    player_id: playerId,
    player_name: playerName,
    map_id: mapId,
    message: trimmed,
    created_at: new Date().toISOString(),
  };

  try {
    await authSupabase!.from("chat_messages").insert([messageData]);
  } catch (err) {
    console.warn("[Multiplayer] Falha ao enviar chat:", err);
  }
}

/**
 * Busca as últimas mensagens de chat de um mapa (histórico inicial).
 */
export async function fetchRecentChat(
  mapId: string,
  limit = 20
): Promise<ChatMessage[]> {
  if (!authSupabase) return [];

  try {
    const { data, error } = await authSupabase
      .from("chat_messages")
      .select("*")
      .eq("map_id", mapId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return ((data || []) as ChatMessage[]).reverse();
  } catch {
    return [];
  }
}

/**
 * Atualiza dados de customização do personagem sem alterar a posição.
 */
export async function updatePlayerAppearance(
  playerId: string,
  player: Player
): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !supabase || !playerId) return;

  try {
    await supabase
      .from("players")
      .update({
        name: player.name,
        head_color: player.headColor,
        torso_color: player.torsoColor,
        legs_color: player.legsColor,
        shoes_color: player.shoesColor,
        skin_color: player.skinColor,
        head_type: player.headType,
        torso_type: player.torsoType,
        shoes_type: player.shoesType,
        face_type: player.faceType,
        accessory_type: player.accessoryType,
        active_outfit: player.activeOutfit || null,
        owned_outfits: player.ownedOutfits || [],
        gender: player.gender || "male",
        last_seen: new Date().toISOString(),
      })
      .eq("id", playerId);
  } catch (err) {
    console.warn("[Multiplayer] Erro ao atualizar aparência:", err);
  }
}

/**
 * Retorna o número de jogadores online em um determinado mapa.
 */
export async function getOnlineCount(mapId?: string): Promise<number> {
  if (!MULTIPLAYER_ENABLED || !supabase) return 0;

  try {
    let query = supabase
      .from("players_presence")
      .select("player_id", { count: "exact", head: true });

    if (mapId) {
      query = query.eq("map_id", mapId);
    }

    const { count } = await query;
    return count || 0;
  } catch {
    return 0;
  }
}
