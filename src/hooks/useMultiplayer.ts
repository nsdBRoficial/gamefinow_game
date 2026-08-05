/**
 * useMultiplayer.ts
 * Hook React que orquestra o multiplayer no GameFiNow.
 *
 * Uso:
 *   const { onlinePlayers, onlineCount, chatMessages, sendChat, isConnected } = useMultiplayer({
 *     playerId,
 *     playerPos,
 *     setPlayerPos,
 *   });
 *
 * - Registra o jogador no Supabase ao montar
 * - Publica posição a cada mudança (throttle 100ms)
 * - Assina o canal do mapa atual
 * - Re-assina automaticamente ao trocar de mapa
 * - Remove presença ao desmontar (tab fechada)
 * - Filtra palavrões (PT/EN/ES) antes de enviar chat
 * - Exibe balão de mensagem acima do personagem (local e remoto) por 5s
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
import { processChatMessage } from "../utils/profanityFilter";

interface UseMultiplayerOptions {
  playerId: string;
  playerPos: Player;
  setPlayerPos: (updater: Partial<Player> | ((prev: Player) => Partial<Player>)) => void;
  gameState?: any;
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
  setPlayerPos,
  gameState,
}: UseMultiplayerOptions): UseMultiplayerResult {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const prevMapId = useRef<string>("");
  const prevPlayerId = useRef<string>("");
  const appearanceUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timers para limpar o bubbleText dos outros jogadores
  const bubbleTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Registro inicial do jogador ──────────────────────────────────────────
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED || !playerId) return;

    upsertPlayer(playerId, playerPos, gameState).then(() => {
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

    // Assina canal Realtime do mapa com dados completos do player
    subscribeToMap(
      mapId,
      playerId,
      (players) => {
        setOnlinePlayers(players);
        // Deriva a contagem dos dados já recebidos (+1 para incluir o próprio jogador)
        setOnlineCount(players.length + 1);
      },
      (msg) => {
        // Atualiza histórico de mensagens
        setChatMessages((prev) => {
          // Evita duplicatas
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          // Mantém apenas as últimas 50 mensagens
          return next.slice(-50);
        });

        // ── Balloon: setar bubbleText no OnlinePlayer correspondente ──────────
        // Isso garante que o balão aparece em tempo real no canvas para todos
        if (msg.player_id !== playerId) {
          const filteredMsg = processChatMessage(msg.message);
          setOnlinePlayers((prev) =>
            prev.map((p) =>
              p.player_id === msg.player_id
                ? { ...p, bubbleText: filteredMsg }
                : p
            )
          );

          // Limpa bubbleText do outro player após 5s
          const existingTimer = bubbleTimers.current.get(msg.player_id);
          if (existingTimer) clearTimeout(existingTimer);
          const timer = setTimeout(() => {
            setOnlinePlayers((prev) =>
              prev.map((p) =>
                p.player_id === msg.player_id ? { ...p, bubbleText: undefined } : p
              )
            );
            bubbleTimers.current.delete(msg.player_id);
          }, 5000);
          bubbleTimers.current.set(msg.player_id, timer);
        }
      },
      playerPos
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

  // ─── Envio de chat + Balloon local ───────────────────────────────────────
  const sendChat = useCallback(
    async (message: string) => {
      if (!playerId || !playerPos.mapId) return;

      // Aplica filtro de palavrões e limita a 80 chars
      const cleanMsg = processChatMessage(message);
      if (!cleanMsg.trim()) return;

      // Envia pelo socket
      await sendChatMessage(
        playerPos.mapId || "center",
        playerId,
        playerPos.name || "Anonymo",
        cleanMsg
      );

      // ── Balloon: jogador local vê seu próprio balão imediatamente ──────────
      setPlayerPos({ bubbleText: cleanMsg, bubbleTimer: Date.now() + 5000 });
      // Limpa após 5 segundos
      setTimeout(() => {
        setPlayerPos((prev) => ({ ...prev, bubbleText: undefined, bubbleTimer: undefined }));
      }, 5000);
    },
    [playerId, playerPos.mapId, playerPos.name, setPlayerPos]
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
