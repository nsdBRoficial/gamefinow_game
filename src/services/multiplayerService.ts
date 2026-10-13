/**
 * -----------------------------------------------------------------------------
 * ⚔️ SERVIÇO DE MULTIPLAYER REALTIME (SOCKET.IO) & SINCRONIZAÇÃO DE PLAYERS
 * -----------------------------------------------------------------------------
 * Responsabilidades:
 *  - Conectar ao Backend Relayer via WebSocket (Socket.io) com suporte a JWT.
 *  - Transmitir posição (x, y), mapa atual (`mapId`), customização de skin/outfit,
 *    flag de GM (`isGM`) e atributos de combate RPG (`level`, `hp`, `attack`, `defense`, `speed`).
 *  - Gerenciar salas por mapa (`map:<mapId>`) e transmissões de chat no MMO.
 *  - Persistir perfil e estado do jogador na tabela `players` do Supabase.
 * -----------------------------------------------------------------------------
 */

import { supabase, MULTIPLAYER_ENABLED } from "./supabaseClient";
import { Player } from "../types";
import { createClient } from "@supabase/supabase-js";
import { io, Socket } from "socket.io-client";

export { MULTIPLAYER_ENABLED };

export interface OnlinePlayer {
  player_id: string;
  name: string;
  map_id: string;
  x: number;
  y: number;
  dir: "up" | "down" | "left" | "right";
  is_moving: boolean;
  updated_at: string;
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
  active_title: string | null;
  name_style: string | null;
  bubbleText?: string;
  bubbleTimer?: number;
  isGM?: boolean;
  level?: number;
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  xp_current?: number;
  xp_signature?: string;
}

export interface ChatMessage {
  id: string;
  player_id: string;
  player_name: string;
  map_id: string;
  message: string;
  created_at: string;
}

// ─── Estado interno ───────────────────────────────────────────────

let authSupabase = supabase;
let currentPlayerId: string | null = null;
let currentMapId: string | null = null;
let lastPublishedX = -1;
let lastPublishedY = -1;
let lastPublishedMapId = "";

const mapLivePlayers = new Map<string, OnlinePlayer>();
let socket: Socket | null = null;
export const getSocket = () => socket;

let lastJoinMapData: any = null;

if (MULTIPLAYER_ENABLED) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  socket = io(backendUrl);
  socket.on("connect", () => {
    console.log("[Multiplayer] Conectado ao WebSocket:", socket?.id);
    lastPublishedX = -1;
    lastPublishedY = -1;
    lastPublishedMapId = "";
    if (lastJoinMapData) {
      console.log("[Multiplayer] Reenviando join_map após reconexão...");
      socket?.emit("join_map", lastJoinMapData);
    }
  });
  
  socket.on("disconnect", () => {
    console.log("[Multiplayer] Desconectado do WebSocket.");
    mapLivePlayers.clear(); // Evita fantasmas
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

let inMemoryPlayerId: string | null = null;

export function getOrCreatePlayerId(stellarPublicKey?: string): string {
  if (stellarPublicKey && stellarPublicKey.length > 10) {
    return stellarPublicKey;
  }
  if (inMemoryPlayerId) return inMemoryPlayerId;

  try {
    if (typeof window !== "undefined") {
      // Cada aba ou janela ganha seu próprio identificador isolado
      if (!window.name || !window.name.startsWith("gfn_tab_")) {
        window.name = `gfn_tab_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
      }
      const tabKey = `gfn_player_session_${window.name}`;
      let stored = sessionStorage.getItem(tabKey);
      if (stored) {
        inMemoryPlayerId = stored;
        return stored;
      }
      const uuid = `anon_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(tabKey, uuid);
      inMemoryPlayerId = uuid;
      return uuid;
    }
  } catch {
    // fallback caso window/sessionStorage não esteja disponível
  }

  inMemoryPlayerId = `anon_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
  return inMemoryPlayerId;
}

// ─── API pública ─────────────────────────────────────────────────────────────

import { encryptAES, decryptAES } from "../utils/cryptoUtils";

export async function upsertPlayer(playerId: string, player: Player, gameState?: any): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !supabase) return;
  currentPlayerId = playerId;

  try {
    console.log("[Multiplayer] Requesting token for publicKey:", playerId);
    const authRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: playerId })
    });
    if (!authRes.ok) {
      console.error("[Multiplayer] /api/auth/token returned:", authRes.status, await authRes.text());
    }
    
    if (authRes.ok) {
      const { token } = await authRes.json();
      if (token && token !== (window as any)._lastAuthToken) {
        (window as any)._lastAuthToken = token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }
        });
      }
    }

    await authSupabase!.from("players").upsert(
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
        ...(gameState !== undefined ? {
          xp_current: gameState?.xp_current || 0,
          level: gameState?.level || 1,
          xp_signature: encryptAES(String(gameState?.xp_current || 0), playerId.substring(0, 10)),
        } : {})
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("[Multiplayer] Falha no upsert de player:", err);
  }
}

function buildPlayerPayload(playerId: string, player: Player): OnlinePlayer {
  return {
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
    active_title: player.activeTitle || null,
    name_style: player.nameStyle || "plain",
    isGM: player.isGM || false,
    level: player.level,
    hp: player.hp,
    maxHp: player.maxHp,
    attack: player.attack,
    defense: player.defense,
    speed: player.speed
  };
}

export function publishPosition(player: Player, playerId: string, forceUpdate: boolean = false): void {
  if (!MULTIPLAYER_ENABLED || !socket || !playerId) return;

  const currentMap = player.mapId || "center";
  const roundedX = Math.round(player.x);
  const roundedY = Math.round(player.y);

  if (!forceUpdate && currentMap === lastPublishedMapId && roundedX === lastPublishedX && roundedY === lastPublishedY) return;

  lastPublishedX = roundedX;
  lastPublishedY = roundedY;
  lastPublishedMapId = currentMap;

  const payload = buildPlayerPayload(playerId, player);
  if (lastJoinMapData) {
    lastJoinMapData.playerPayload = payload;
  }
  socket.emit("player_move", { mapId: currentMap, payload });
}

export function subscribeToMap(
  mapId: string,
  playerId: string,
  onPlayersUpdate: (players: OnlinePlayer[]) => void,
  onChatMessage?: (msg: ChatMessage) => void,
  playerData?: Player
): void {
  if (!MULTIPLAYER_ENABLED || !socket) return;

  currentMapId = mapId;
  currentPlayerId = playerId;
  lastPublishedMapId = ""; // força envio de nova coordenada no novo mapa
  lastPublishedX = -1;
  lastPublishedY = -1;
  mapLivePlayers.clear();

  let playerPayload = null;
  if (playerData) {
    playerPayload = buildPlayerPayload(playerId, playerData);
  }

  const adminToken = localStorage.getItem("admin_token");
  lastJoinMapData = { mapId, playerId, playerPayload, adminToken };
  console.log("[Multiplayer] Emitindo JOIN MAP:", { mapId, playerId });
  socket.emit("join_map", lastJoinMapData);

  socket.off("player_move");
  socket.on("player_move", (payload: OnlinePlayer) => {
    if (payload && payload.player_id && payload.player_id !== playerId) {
      const pMapId = payload.map_id || mapId;
      if (pMapId === mapId) {
        mapLivePlayers.set(payload.player_id, { ...payload, map_id: pMapId });
        onPlayersUpdate(Array.from(mapLivePlayers.values()));
      }
    }
  });

  socket.off("sync_players");
  socket.on("sync_players", (players: OnlinePlayer[]) => {
    if (Array.isArray(players)) {
      players.forEach((p) => {
        if (p && p.player_id && p.player_id !== playerId) {
          const pMapId = p.map_id || mapId;
          if (pMapId === mapId) {
            mapLivePlayers.set(p.player_id, { ...p, map_id: pMapId });
          }
        }
      });
      onPlayersUpdate(Array.from(mapLivePlayers.values()));
    }
  });

  socket.off("player_leave");
  socket.on("player_leave", (data: { playerId: string }) => {
    if (data && data.playerId) {
      mapLivePlayers.delete(data.playerId);
      onPlayersUpdate(Array.from(mapLivePlayers.values()));
    }
  });

  if (onChatMessage) {
    socket.off("chat_message");
    socket.on("chat_message", (payload: ChatMessage) => {
      onChatMessage(payload);
    });
  }
}

export function subscribeToGlobalEvents(
  onAnnounce: (data: { msg: string, from: string }) => void,
  onKick: (data: { reason: string }) => void,
  onForceTeleport: (data: { mapId: string }) => void
) {
  if (!socket) return;
  
  socket.off("announce");
  socket.on("announce", onAnnounce);
  
  socket.off("kick_user");
  socket.on("kick_user", (data) => {
    console.error("[Multiplayer] RECEBIDO EVENTO kick_user DO SERVIDOR!", data);
    onKick(data);
  });
  
  socket.off("force_teleport");
  socket.on("force_teleport", onForceTeleport);
}

export function unsubscribeFromCurrentMap(): void {
  // Limpar os listeners não é estritamente necessário no SPA mas ajuda a prevenir memory leaks
  if (socket) {
    socket.off("player_move");
    socket.off("sync_players");
    socket.off("player_leave");
    socket.off("chat_message");
  }
}

export async function removePlayerFromPresence(playerId: string): Promise<void> {
  // No WebSockets, ao fechar a aba o navegador já encerra a conexão.
  // Chamar disconnect() aqui quebra o React Strict Mode (que dá unmount e mount super rápido), 
  // fazendo o socket morrer e não receber o evento de kick_user.
  // if (socket) socket.disconnect();
}

export async function sendChatMessage(
  mapId: string,
  playerId: string,
  playerName: string,
  message: string
): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !socket) return;
  const trimmed = message.trim().slice(0, 200);
  if (!trimmed) return;

  const messageData: ChatMessage = {
    id: Date.now().toString(),
    player_id: playerId,
    player_name: playerName,
    map_id: mapId,
    message: trimmed,
    created_at: new Date().toISOString(),
  };

  // Envia via socket
  socket.emit("chat_message", { mapId, payload: messageData });

  // Salva no banco para histórico
  try {
    await authSupabase!.from("chat_messages").insert([messageData]);
  } catch (err) {
    console.warn("[Multiplayer] Erro ao salvar chat no DB:", err);
  }
}

export async function fetchRecentChat(mapId: string, limit = 20): Promise<ChatMessage[]> {
  if (!authSupabase) return [];
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await authSupabase
      .from("chat_messages")
      .select("*")
      .eq("map_id", mapId)
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return ((data || []) as ChatMessage[]).reverse();
  } catch {
    return [];
  }
}

export async function updatePlayerAppearance(playerId: string, player: Player): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !playerId) return;
  publishPosition(player, playerId, true); // Força broadcast da nova aparência via Socket
  upsertPlayer(playerId, player); // Salva no DB
}

export async function getOnlineCount(mapId?: string): Promise<number> {
  // Com websockets puros precisaríamos pegar do servidor, mas podemos retornar a aproximação pelo map local.
  return mapLivePlayers.size + 1; // Eu + Outros
}

export async function fetchTopPlayers(limit = 5): Promise<OnlinePlayer[]> {
  if (!authSupabase) return [];
  try {
    const { data, error } = await authSupabase
      .from("players")
      .select("*")
      .order("xp_current", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.warn("[Multiplayer] Erro ao buscar leaderboard:", error);
      return [];
    }

    // Filtrar cheaters óbvios validando a assinatura de XP
    const validPlayers = (data as any[]).filter(p => {
      if (!p.xp_current) return true; // players without XP are valid
      if (!p.xp_signature) return true; // old players without signature
      
      const expectedSignature = encryptAES(String(p.xp_current), String(p.id).substring(0, 10));
      return p.xp_signature === expectedSignature;
    });

    return validPlayers as OnlinePlayer[];
  } catch (err) {
    console.error("[Multiplayer] Falha ao buscar top players:", err);
    return [];
  }
}
