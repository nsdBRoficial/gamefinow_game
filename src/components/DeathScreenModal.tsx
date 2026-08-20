/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Skull, HeartPulse, RefreshCw } from "lucide-react";
import { useGameStore } from "../store/gameStore";

const DEATH_PUNCHLINES = [
  "💀 O Slime te devolveu direto para o bloco gênesis!",
  "⚡ Suas taxas de gás acabaram e você virou poeira de blockchain!",
  "🧙‍♂️ O contrato inteligente da sua armadura deu REVERT!",
  "📉 Sua barra de vida sofreu uma liquidação forçada no mercado!",
  "🛡️ Os validadores da rede rejeitaram sua esquiva!",
  "🍕 Nem uma pizza de 10.000 Bitcoins recuperaria esse dano!",
  "💥 Game Over! Mas heróis Web3 sempre voltam mais fortes."
];

interface DeathScreenModalProps {
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
}

export const DeathScreenModal: React.FC<DeathScreenModalProps> = ({ playSynthSound }) => {
  const isDead = useGameStore((s) => s.isDead);
  const lastDeathInfo = useGameStore((s) => s.lastDeathInfo);
  const playerPos = useGameStore((s) => s.playerPos);
  const respawnPlayer = useGameStore((s) => s.respawnPlayer);

  const [countdown, setCountdown] = useState(5);
  const [punchline, setPunchline] = useState("");

  useEffect(() => {
    if (isDead) {
      // Escolhe uma frase aleatória divertida
      const randomLine = DEATH_PUNCHLINES[Math.floor(Math.random() * DEATH_PUNCHLINES.length)];
      setPunchline(randomLine);
      setCountdown(5);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            respawnPlayer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isDead, respawnPlayer]);

  if (!isDead) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300 font-mono select-none">
      <div className="bg-slate-950/95 border-4 border-red-600/80 rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] relative overflow-hidden flex flex-col items-center gap-4">
        
        {/* Glow de fundo */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ícone Animado de Morte Arcade */}
        <div className="relative">
          <div className="w-20 h-20 bg-red-950/80 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-bounce">
            <Skull className="w-10 h-10 text-red-400" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-black animate-pulse">
            KO!
          </div>
        </div>

        {/* Título Principal */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-red-500 tracking-wider drop-shadow-[0_2px_10px_rgba(220,38,38,0.8)]">
            VOCÊ FOI DERROTADO!
          </h1>
          <p className="text-xs text-slate-400">
            {lastDeathInfo?.killerName 
              ? `Abatido por ${lastDeathInfo.killerName} (${lastDeathInfo.damage ? `-${lastDeathInfo.damage} Dmg` : 'Dano Fatal'})`
              : "As forças da ilha foram implacáveis..."}
          </p>
        </div>

        {/* Frase Cômica */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl w-full text-amber-300 text-xs font-semibold italic shadow-inner">
          "{punchline}"
        </div>

        {/* Painel de Reanimação & Contagem Regressiva */}
        <div className="w-full bg-slate-900 border border-red-950/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-4 h-4" /> Restaurando Alma na Fonte
            </span>
            <span className="text-amber-400 font-mono text-sm">{countdown}s</span>
          </div>

          {/* Barra de Progresso do Respawn */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 
            Você receberá <strong>3s de Escudo Protetor</strong> ao renascer!
          </p>
        </div>

        {/* Botão de Respawn Manual Rápido */}
        <button
          onClick={() => {
            playSynthSound("unlock");
            respawnPlayer();
          }}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4 animate-spin" /> Renascer Agora na Fonte Central
        </button>

      </div>
    </div>
  );
};
