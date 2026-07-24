/**
 * useMultiplayer.ts
 * Hook React que orquestra o multiplayer no GameFiNow.
 *
 * Uso:
 *   const { onlinePlayers, onlineCount, chatMessages, sendChat, isConnected } = useMultiplayer({
 *     playerId,
 *     playerPos,
 *     onAppearanceChange,
 *   });
 *
 * - Registra o jogador no Supabase ao montar
 * - Publica posição a cada mudança (throttle 100ms)
 * - Assina o canal do mapa atual
 * - Re-assina automaticamente ao trocar de mapa
 * - Remove presença ao desmontar (tab fechada)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Player } from "../types";
import {
  MULTIPLAYER_ENABLED,
  OnlinePlayer,
  ChatMessage,
  upsertPlayer,
  publishPosition,
  subscribeToMap,
  unsubscribeFromCurrentMap,
  removePlayerFromPresence,
  sendChatMessage,
  fetchRecentChat,
  getOnlineCount,
  updatePlayerAppearance,
} from "../services/multiplayerService";

interface UseMultiplayerOptions {
  playerId: string;
  playerPos: Player;
}

interface UseMultiplayerResult {
  onlinePlayers: OnlinePlayer[];
  onlineCount: number;
  chatMessages: ChatMessage[];
  sendChat: (message: string) => Promise<void>;
  isConnected: boolean;
  isMultiplayerEnabled: boolean;
}

export function useMultiplayer({
  playerId,
  playerPos,
}: UseMultiplayerOptions): UseMultiplayerResult {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const prevMapId = useRef<string>("");
  const prevPlayerId = useRef<string>("");
  const appearanceUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Registro inicial do jogador ──────────────────────────────────────────
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED || !playerId) return;

    upsertPlayer(playerId, playerPos).then(() => {
      setIsConnected(true);
    });

    // Cleanup ao fechar a aba
    const handleUnload = () => {
      removePlayerFromPresence(playerId);
      unsubscribeFromCurrentMap();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      removePlayerFromPresence(playerId);
      unsubscribeFromCurrentMap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // ─── Subscrição ao mapa atual ─────────────────────────────────────────────
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED || !playerId) return;

    const mapId = playerPos.mapId || "center";

    // Só re-assina se o mapa mudou
    if (mapId === prevMapId.current && playerId === prevPlayerId.current) return;

    prevMapId.current = mapId;
    prevPlayerId.current = playerId;

    // Carrega histórico de chat do mapa
    fetchRecentChat(mapId).then(setChatMessages);

    // Busca contagem de online
    getOnlineCount().then(setOnlineCount);

    // Assina canal Realtime do mapa com dados completos do player (Fase 3.1)
    subscribeToMap(
      mapId,
      playerId,
      (players) => {
        setOnlinePlayers(players);
        // Fase 2.1: Deriva a contagem dos dados já recebidos (+1 para incluir o próprio jogador)
        // Evita centenas de requests HTTP extras por minuto ao Supabase
        setOnlineCount(players.length + 1);
      },
      (msg) => {
        setChatMessages((prev) => {
          // Evita duplicatas
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          // Mantém apenas as últimas 50 mensagens
          return next.slice(-50);
        });
      },
      playerPos // Fase 3.1: dados completos para o track() de presença
    );
  }, [playerId, playerPos.mapId]);

  // ─── Publicação de posição ────────────────────────────────────────────────
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED || !playerId) return;
    
    // Publish immediately on pos change
    publishPosition(playerPos, playerId);

    // Heartbeat silencioso a cada 10s: atualiza apenas updated_at no banco
    // SEM re-transmitir via Broadcast (não polui o canal com eventos falsos de movimento)
    const heartbeatTimer = setInterval(async () => {
      if (!MULTIPLAYER_ENABLED || !playerId || !playerPos.mapId) return;
      try {
        const { supabase } = await import("../services/supabaseClient");
        if (supabase) {
          await supabase
            .from("players_presence")
            .update({ updated_at: new Date().toISOString() })
            .eq("player_id", playerId);
        }
      } catch {
        // silently ignore heartbeat failures
      }
    }, 10_000);

    return () => clearInterval(heartbeatTimer);
  }, [playerPos, playerId]);

  // ─── Atualização de aparência (debounce 2s para não spam) ─────────────────
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED || !playerId) return;
    if (appearanceUpdateTimer.current) clearTimeout(appearanceUpdateTimer.current);
    appearanceUpdateTimer.current = setTimeout(() => {
      updatePlayerAppearance(playerId, playerPos);
    }, 2000);
    return () => {
      if (appearanceUpdateTimer.current) clearTimeout(appearanceUpdateTimer.current);
    };
  }, [
    playerId,
    playerPos.name,
    playerPos.headColor,
    playerPos.torsoColor,
    playerPos.legsColor,
    playerPos.shoesColor,
    playerPos.skinColor,
    playerPos.headType,
    playerPos.torsoType,
    playerPos.faceType,
    playerPos.accessoryType,
    playerPos.activeOutfit,
    playerPos.gender,
  ]);

  // ─── Envio de chat ────────────────────────────────────────────────────────
  const sendChat = useCallback(
    async (message: string) => {
      if (!playerId || !playerPos.mapId) return;
      await sendChatMessage(
        playerPos.mapId || "center",
        playerId,
        playerPos.name || "Anonymo",
        message
      );
    },
    [playerId, playerPos.mapId, playerPos.name]
  );

  return {
    onlinePlayers,
    onlineCount,
    chatMessages,
    sendChat,
    isConnected,
    isMultiplayerEnabled: MULTIPLAYER_ENABLED,
  };
}
