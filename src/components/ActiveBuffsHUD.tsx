/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";

export const ActiveBuffsHUD: React.FC = () => {
  const activeBuffs = useGameStore((s) => s.activeBuffs);
  const cleanExpiredBuffs = useGameStore((s) => s.cleanExpiredBuffs);
  const [now, setNow] = useState(() => Date.now());

  const hasActiveBuffs = Array.isArray(activeBuffs) && activeBuffs.length > 0;

  // Timer seguro: atualiza a cada 500ms apenas se houver buffs ativos
  useEffect(() => {
    if (!hasActiveBuffs) return;

    const interval = setInterval(() => {
      setNow(Date.now());
      // Limpa os buffs expirados na store de forma desacoplada
      cleanExpiredBuffs();
    }, 500);

    return () => clearInterval(interval);
  }, [hasActiveBuffs, cleanExpiredBuffs]);

  if (!hasActiveBuffs) return null;

  const validBuffs = activeBuffs.filter((b) => b.expiresAt > now);
  if (validBuffs.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-30 flex flex-col gap-2 items-end pointer-events-auto font-mono select-none">
      {validBuffs.map((buff) => {
        const remainingMs = Math.max(0, buff.expiresAt - now);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const progress = Math.min(100, Math.max(0, (remainingMs / buff.durationMs) * 100));

        return (
          <div
            key={buff.id}
            className="flex items-center gap-2 bg-slate-950/85 backdrop-blur border border-amber-500/40 px-2.5 py-1.5 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-in slide-in-from-right duration-200"
            title={`${buff.name} (${remainingSec}s restantes)`}
          >
            <div className="relative w-7 h-7 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-md">
              <span className="text-sm">{buff.icon}</span>
              {/* Anel de progresso SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <path
                  className="text-amber-400"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                  strokeDashoffset={100 - progress}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-slate-200 leading-tight">{buff.name}</span>
              <span className="text-[9px] text-amber-400 font-extrabold">{remainingSec}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
