/**
 * multiplayerService.ts
 * Serviço principal de multiplayer do GameFiNow (Refatorado para WebSockets - Socket.io).
 *
 * Responsabilidades:
 *  - Conectar ao Backend Relayer via WebSocket (Socket.io)
 *  - Registrar o jogador local no Supabase (para persistência de perfil)
 *  - Emitir e receber posições, customização e títulos em tempo real
 *  - Gerenciar chat por mapa
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

const mapLivePlayers = new Map<string, OnlinePlayer>();
let socket: Socket | null = null;

if (MULTIPLAYER_ENABLED) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  socket = io(backendUrl);
  socket.on("connect", () => {
    console.log("[Multiplayer] Conectado ao WebSocket:", socket?.id);
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

export function getOrCreatePlayerId(stellarPublicKey?: string): string {
  if (stellarPublicKey && stellarPublicKey.length > 10) {
    return stellarPublicKey;
  }
  let stored = sessionStorage.getItem("gfn_player_session_id");
  if (stored) return stored;
  const uuid = `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  sessionStorage.setItem("gfn_player_session_id", uuid);
  return uuid;
}

// ─── API pública ─────────────────────────────────────────────────────────────

export async function upsertPlayer(playerId: string, player: Player): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !supabase) return;
  currentPlayerId = playerId;

  try {
    const authRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/auth/token`, {
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
    name_style: player.nameStyle || "plain"
  };
}

export function publishPosition(player: Player, playerId: string, forceUpdate: boolean = false): void {
  if (!MULTIPLAYER_ENABLED || !socket || !playerId) return;

  if (!forceUpdate && Math.round(player.x) === lastPublishedX && Math.round(player.y) === lastPublishedY) return;

  lastPublishedX = Math.round(player.x);
  lastPublishedY = Math.round(player.y);

  const payload = buildPlayerPayload(playerId, player);
  socket.emit("player_move", { mapId: player.mapId || "center", payload });
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
  mapLivePlayers.clear();

  let playerPayload = null;
  if (playerData) {
    playerPayload = buildPlayerPayload(playerId, playerData);
  }

  socket.emit("join_map", { mapId, playerId, playerPayload });

  socket.off("player_move");
  socket.on("player_move", (payload: OnlinePlayer) => {
    if (payload.player_id !== playerId && payload.map_id === mapId) {
      mapLivePlayers.set(payload.player_id, payload);
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

export function unsubscribeFromCurrentMap(): void {
  // Limpar os listeners não é estritamente necessário no SPA mas ajuda a prevenir memory leaks
  if (socket) {
    socket.off("player_move");
    socket.off("chat_message");
  }
}

export async function removePlayerFromPresence(playerId: string): Promise<void> {
  // No WebSockets, ao desconectar ele já some da tela.
  // Podemos opcionalmente limpar a base se quisermos, mas não afeta a fluidez.
  if (socket) socket.disconnect();
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

export async function updatePlayerAppearance(playerId: string, player: Player): Promise<void> {
  if (!MULTIPLAYER_ENABLED || !playerId) return;
  publishPosition(player, playerId, true); // Força broadcast da nova aparência via Socket
  upsertPlayer(playerId, player); // Salva no DB
}

export async function getOnlineCount(mapId?: string): Promise<number> {
  // Com websockets puros precisaríamos pegar do servidor, mas podemos retornar a aproximação pelo map local.
  return mapLivePlayers.size + 1; // Eu + Outros
}
