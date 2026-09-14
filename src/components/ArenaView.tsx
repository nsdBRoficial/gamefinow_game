/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ArenaView.tsx — Visualização raiz do modo PVP Arena (Tela Cheia)
 *
 * Gerencia a subscrição dos eventos da arena via Socket.IO,
 * mantém o estado local da `PvpSession` e renderiza o
 * `ArenaCanvas` e o `ArenaHUD` em tela cheia (fixed inset-0 z-50).
 *
 * Mecânicas iguais ao jogo normal:
 * - WASD / Setas para mover
 * - 1, 2, 3 para magias (gerenciado pelo ArenaHUD)
 * - 4, 5 para poções (gerenciado pelo ArenaHUD)
 * - Escape para sair da batalha
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { PvpSession } from "../pvp/pvpTypes";
import { subscribeToArena, sendArenaMove, leaveArena, requestArenaJoin } from "../services/arenaService";
import { isArenaCollidable, generateArenaGrid, ARENA_COLS, ARENA_ROWS } from "../pvp/arenaMap";
import { ArenaCanvas } from "./ArenaCanvas";
import { ArenaHUD } from "./ArenaHUD";

// Grid pré-calculado para validação de colisão no cliente
const ARENA_GRID_CLIENT = generateArenaGrid();

export const ArenaView: React.FC<{ playerId: string }> = ({ playerId }) => {
  const [session, setSession] = useState<PvpSession | null>(null);
  const setGameState = useGameStore((s) => s.setGameState);
  const pvpSessionId = useGameStore((s) => s.pvpSessionId);
  const playerPos = useGameStore((s) => s.playerPos);

  // Controle de cooldown de movimento (throttle igual ao jogo principal)
  const lastMoveRef = useRef<number>(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Sair da arena (usável em qualquer estado)
  const handleLeave = useCallback(() => {
    const sid = session?.sessionId ?? pvpSessionId;
    if (sid) leaveArena(sid, playerId);
    setGameState({ isInArena: false, pvpSessionId: undefined });
  }, [session, pvpSessionId, playerId, setGameState]);

  // Gerencia a subscrição de eventos PVP
  useEffect(() => {
    const unsubscribe = subscribeToArena({
      onSync: (newSession) => {
        setSession(newSession);
        setGameState({ pvpSessionId: newSession.sessionId });
      },
      onEliminated: (_data) => {
        // ArenaHUD cuida da animação de eliminação
      },
      onMatchEnd: (_data) => {
        // Aguarda 5s (animação do HUD) e retorna ao mapa
        setTimeout(() => {
          handleLeave();
        }, 5000);
      },
      onOutOfRange: () => {
        console.warn("Alvo fora de alcance!");
      },
      onError: (msg) => {
        console.error("Erro na Arena:", msg);
      },
    });

    // Registra o jogador no backend
    requestArenaJoin(playerId, playerPos);

    return () => { unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // Loop principal de inputs e movimentação fluida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") {
        handleLeave();
        return;
      }
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let rafId: number;
    const gameLoop = () => {
      rafId = requestAnimationFrame(gameLoop);

      if (!session) return;
      const me = session.players.find((p) => p.playerId === playerId);
      if (!me || me.isEliminated) return;

      const now = Date.now();
      if (now - lastMoveRef.current < 120) return;

      let ax = me.arenaX;
      let ay = me.arenaY;
      let dir = me.dir;
      let moved = false;

      const keys = keysPressedRef.current;
      if (keys["w"] || keys["arrowup"])         { ay--; dir = "up";    moved = true; }
      else if (keys["s"] || keys["arrowdown"])  { ay++; dir = "down";  moved = true; }
      else if (keys["a"] || keys["arrowleft"])  { ax--; dir = "left";  moved = true; }
      else if (keys["d"] || keys["arrowright"]) { ax++; dir = "right"; moved = true; }

      if (moved) {
        if (ax < 0 || ax >= ARENA_COLS || ay < 0 || ay >= ARENA_ROWS) return;
        const targetTile = ARENA_GRID_CLIENT[ay]?.[ax];
        if (targetTile === undefined || isArenaCollidable(targetTile)) return;

        lastMoveRef.current = now;
        
        // Optimistic UI update: permite que o Canvas desenhe no próximo frame antes do servidor responder
        me.arenaX = ax;
        me.arenaY = ay;
        me.dir = dir;

        sendArenaMove(session.sessionId, playerId, ax, ay, dir);
      }
    };

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(rafId);
    };
  }, [session, playerId, handleLeave]);

  // ── Tela de sincronização (aguardando sessão) ──
  if (!session) {
    return (
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(127,29,29,0.2)_0%,_transparent_70%)]" />
        <div className="relative flex flex-col items-center gap-4 text-center p-8">
          <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <p className="text-red-400 font-mono font-bold uppercase tracking-[0.3em] text-base animate-pulse">
              ⚔️ Sincronizando Arena PVP...
            </p>
            <p className="text-slate-500 font-mono text-xs">
              Aguardando conexão com o servidor de batalha
            </p>
          </div>
          <button
            onClick={handleLeave}
            className="mt-2 px-5 py-2.5 bg-slate-900/90 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-white rounded-lg font-mono text-xs cursor-pointer transition-all duration-150 shadow-lg active:scale-95"
          >
            ✕ Cancelar / Voltar ao Mapa
          </button>
        </div>
      </div>
    );
  }

  // ── Tela principal da Arena (full-screen) ──
  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden">
      {/* Canvas ocupa toda a tela */}
      <ArenaCanvas
        session={session}
        playerId={playerId}
        onEliminated={() => {}}
      />

      {/* HUD sobreposto ao canvas */}
      <ArenaHUD
        session={session}
        playerId={playerId}
        onMatchEnd={() => {}}
        onLeave={handleLeave}
      />
    </div>
  );
};
