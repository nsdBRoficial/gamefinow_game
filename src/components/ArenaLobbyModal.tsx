/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ArenaLobbyModal.tsx — Modal de entrada na Arena PVP
 *
 * Exibido quando o jogador pressiona Espaço próximo à Arena.
 * Permite selecionar o modo de batalha (FFA ativo, demais com SOON)
 * e confirmar a entrada na sessão PVP.
 */

import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { Swords, Shield, Users, Lock, X, Zap, Trophy, Clock } from "lucide-react";

interface BattleMode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  players: string;
}

const BATTLE_MODES: BattleMode[] = [
  {
    id: "ffa",
    label: "Free For All",
    icon: <Zap size={22} />,
    description: "Todos contra todos! O último de pé vence.",
    available: true,
    players: "2–8 jogadores",
  },
  {
    id: "1v1",
    label: "1 vs 1",
    icon: <Swords size={22} />,
    description: "Duelo individual. Pura habilidade.",
    available: false,
    players: "2 jogadores",
  },
  {
    id: "2v2",
    label: "2 vs 2",
    icon: <Users size={22} />,
    description: "Times de dois. Coordenação é essencial.",
    available: false,
    players: "4 jogadores",
  },
  {
    id: "3v3",
    label: "3 vs 3",
    icon: <Shield size={22} />,
    description: "A batalha em equipe começa aqui.",
    available: false,
    players: "6 jogadores",
  },
  {
    id: "4v4",
    label: "4 vs 4",
    icon: <Trophy size={22} />,
    description: "A maior batalha em equipe da Arena.",
    available: false,
    players: "8 jogadores",
  },
];

interface ArenaLobbyModalProps {
  onClose: () => void;
  onJoin: () => void;
}

export const ArenaLobbyModal: React.FC<ArenaLobbyModalProps> = ({ onClose, onJoin }) => {
  const [selectedMode, setSelectedMode] = useState("ffa");
  const [isJoining, setIsJoining] = useState(false);
  const playerPos = useGameStore((s) => s.playerPos);
  const level = useGameStore((s) => s.level) ?? 1;

  const handleJoin = async () => {
    setIsJoining(true);
    // Pequeno delay para efeito visual antes do teleporte
    await new Promise((r) => setTimeout(r, 600));
    onJoin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #0f0f1a 0%, #1a0a0a 50%, #0f0f1a 100%)",
          border: "2px solid #7f1d1d",
          boxShadow: "0 0 40px rgba(220,38,38,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Faixa superior com efeito de fogo */}
        <div
          className="relative h-2 w-full"
          style={{
            background: "linear-gradient(90deg, transparent, #dc2626, #f97316, #dc2626, transparent)",
          }}
        />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-red-400/70 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-900/30"
          >
            <X size={20} />
          </button>

          {/* Ícone e título */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-4xl">⚔️</span>
            <div>
              <h2
                className="text-3xl font-black tracking-widest uppercase"
                style={{
                  fontFamily: "'Press Start 2P', 'Courier New', monospace",
                  color: "#dc2626",
                  textShadow: "0 0 20px rgba(220,38,38,0.8), 2px 2px 0 #7f1d1d",
                  letterSpacing: "0.15em",
                  fontSize: "1.5rem",
                }}
              >
                ARENA
              </h2>
              <p className="text-red-400/60 text-xs font-mono uppercase tracking-widest">
                CAMPO DE BATALHA
              </p>
            </div>
            <span className="text-4xl">⚔️</span>
          </div>

          {/* Stats do jogador */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-600/30">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-slate-300 text-xs font-bold">Nível {level}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-900/40 px-3 py-1 rounded-full border border-red-800/30">
              <span className="text-red-400 text-xs">❤️</span>
              <span className="text-slate-300 text-xs font-bold">{playerPos.hp}/{playerPos.maxHp} HP</span>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-700/30 flex items-start gap-2">
          <Clock size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-200/80 text-xs leading-relaxed">
            Ao entrar, você <strong>não pode abandonar</strong> a batalha. HP é restaurado ao sair.
          </p>
        </div>

        {/* Seleção de modos */}
        <div className="px-6 pb-2">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
            Selecionar Modo
          </p>
          <div className="space-y-2">
            {BATTLE_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => mode.available && setSelectedMode(mode.id)}
                disabled={!mode.available}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                  mode.available
                    ? selectedMode === mode.id
                      ? "bg-red-900/50 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                      : "bg-slate-800/40 border-slate-600/30 hover:border-red-700/50 hover:bg-red-900/20 cursor-pointer"
                    : "bg-slate-900/30 border-slate-800/30 cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                {/* Ícone do modo */}
                <div
                  className={[
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    mode.available
                      ? selectedMode === mode.id
                        ? "bg-red-600/40 text-red-300"
                        : "bg-slate-700/50 text-slate-400"
                      : "bg-slate-800/50 text-slate-600",
                  ].join(" ")}
                >
                  {mode.icon}
                </div>

                {/* Info do modo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "font-bold text-sm",
                        mode.available
                          ? selectedMode === mode.id
                            ? "text-red-300"
                            : "text-slate-200"
                          : "text-slate-500",
                      ].join(" ")}
                    >
                      {mode.label}
                    </span>
                    {!mode.available && (
                      <span className="flex items-center gap-1 bg-slate-700/60 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600/30">
                        <Lock size={9} />
                        SOON
                      </span>
                    )}
                    {mode.available && selectedMode === mode.id && (
                      <span className="flex items-center gap-1 bg-green-900/40 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-700/30">
                        ✓ SELECIONADO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">{mode.players}</span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-slate-500 text-xs truncate">{mode.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recompensas */}
        <div className="mx-6 mt-4 mb-4 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-600/20">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
            Recompensas
          </p>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400">🏆</span>
              <span className="text-slate-300 text-xs">Vitória: <strong className="text-yellow-400">+150 XP</strong> + <strong className="text-amber-400">0.5 GAMEFI</strong></span>
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">⚡</span>
              <span className="text-slate-400 text-xs">Participação: <strong className="text-slate-300">+30 XP</strong></span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-600/40 text-slate-400 text-sm font-bold hover:bg-slate-800/40 hover:text-slate-300 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className={[
              "flex-2 flex-grow-[2] py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
              isJoining
                ? "bg-red-800/50 text-red-300/50 cursor-wait"
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] active:scale-95",
            ].join(" ")}
          >
            {isJoining ? (
              <>
                <div className="w-4 h-4 border-2 border-red-300/50 border-t-red-300 rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <Swords size={16} />
                ENTRAR NA ARENA
              </>
            )}
          </button>
        </div>

        {/* Faixa inferior */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, transparent, #dc2626, #f97316, #dc2626, transparent)",
          }}
        />
      </div>
    </div>
  );
};
