/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ArenaScoreHUD.tsx — Componente de Placar de Combate PvP em Tempo Real (v1.5pvp)
 *
 * Exibido contextualmente na interface enquanto o jogador permanece no mapa "arena".
 * Fica posicionado logo abaixo da janela de chat/chatbox para visibilidade imediata.
 *
 * Métricas Monitoradas:
 * - Abates (Kills): Contagem cumulativa de vitórias em duelos na sessão atual.
 * - Mortes (Deaths): Quantidade de vezes em que o jogador foi derrotado na arena.
 * - Razão K/D (Kills / Deaths): Eficiência calculada dinamicamente com 1 casa decimal.
 * - Sequência Atual (Streak): Contador de eliminações consecutivas sem morrer.
 * - Maior Sequência (Highest Streak): Recorde da sessão, preservado mesmo após morrer.
 *
 * Reatividade:
 * - Conectado diretamente à store Zustand (`useGameStore`).
 * - Ao sair da arena, `resetArenaScore()` reinicializa todos os valores a zero de forma limpa.
 */

import React from "react";
import { useGameStore } from "../store/gameStore";
import { Swords, Skull, Trophy, Flame } from "lucide-react";

export const ArenaScoreHUD: React.FC = () => {
  // Lê o placar da store com fallback seguro para evitar undefined em renderizações rápidas
  const arenaScore = useGameStore((s) => s.arenaScore) || {
    kills: 0,
    deaths: 0,
    streak: 0,
    highestStreak: 0,
  };

  const { kills, deaths, streak, highestStreak } = arenaScore;
  
  // Cálculo de K/D com proteção contra divisão por zero
  const kdRatio = deaths === 0 ? kills.toFixed(1) : (kills / deaths).toFixed(1);

  return (
    <div
      className="w-56 md:w-60 bg-slate-950/90 backdrop-blur-md rounded-xl p-2.5 border-2 border-red-900/80 shadow-[0_4px_20px_rgba(220,38,38,0.35)] select-none pointer-events-auto transition-all animate-fadeIn"
      style={{
        boxShadow: "0 4px 20px rgba(220, 38, 38, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Header com badge de combate */}
      <div className="flex items-center justify-between border-b border-red-950/80 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-red-500 text-xs animate-pulse">⚔️</span>
          <span className="text-[11px] font-black uppercase tracking-wider text-red-400 font-mono">
            Placar Arena
          </span>
        </div>
        <span className="flex items-center gap-1 bg-red-950/80 text-red-300 text-[9px] font-black font-mono px-1.5 py-0.5 rounded border border-red-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
          PVP
        </span>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
        {/* Abates */}
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
            <Swords size={12} className="text-emerald-400" />
            Abates
          </span>
          <span className="text-emerald-300 font-black text-sm">{kills}</span>
        </div>

        {/* Mortes */}
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold">
            <Skull size={12} className="text-rose-400" />
            Mortes
          </span>
          <span className="text-rose-300 font-black text-sm">{deaths}</span>
        </div>

        {/* K/D Ratio */}
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
            <Trophy size={12} className="text-amber-400" />
            K/D
          </span>
          <span className="text-amber-300 font-black text-xs">{kdRatio}</span>
        </div>

        {/* Sequência (Streak) */}
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-orange-400 text-[10px] font-bold">
            <Flame size={12} className={streak >= 3 ? "text-orange-400 animate-bounce" : "text-orange-400"} />
            Streak
          </span>
          <span className={`font-black text-xs ${streak >= 3 ? "text-amber-400" : "text-slate-300"}`}>
            {streak}
            {highestStreak > streak && (
              <span className="text-[9px] text-slate-500 font-normal ml-0.5">({highestStreak})</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
