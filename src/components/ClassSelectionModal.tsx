/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Shield, Zap, Flame, Award, Lock, CheckCircle2, X } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { CLASSES_CATALOG, CLASS_CHANGE_COST_GAMEFI } from "../classesData";
import { CLASS_SPELLS } from "../spellsData";
import { PlayerClassId } from "../types";

interface ClassSelectionModalProps {
  playSynthSound: (type: "beep" | "success" | "coin" | "unlock") => void;
  completedCount: number;
}

export const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  playSynthSound,
  completedCount,
}) => {
  const activeModal = useGameStore((s) => s.activeModal);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const playerPos = useGameStore((s) => s.playerPos);
  const wallet = useGameStore((s) => s.wallet);
  const updateWallet = useGameStore((s) => s.updateWallet);
  const setPlayerClass = useGameStore((s) => s.setPlayerClass);

  const currentClassId = playerPos.playerClass;
  const [selectedClassId, setSelectedClassId] = useState<PlayerClassId>(currentClassId || "warrior");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (activeModal !== "class_selection") return null;

  const isUnlocked = completedCount >= 1;
  const isFirstChoice = !currentClassId;
  const gamefiBalance = wallet.gamefiBalance || 0;
  const canAfford = isFirstChoice || gamefiBalance >= CLASS_CHANGE_COST_GAMEFI;

  const selectedClass = CLASSES_CATALOG[selectedClassId];
  const spells = CLASS_SPELLS[selectedClassId] || [];

  const handleConfirmClass = () => {
    if (!isUnlocked) {
      setFeedbackMsg({ text: "Conclua sua primeira missão na ilha para desbloquear a consagração!", type: "error" });
      playSynthSound("beep");
      return;
    }

    if (selectedClassId === currentClassId) {
      setFeedbackMsg({ text: "Você já está consagrado com esta classe!", type: "error" });
      playSynthSound("beep");
      return;
    }

    if (!isFirstChoice) {
      if (gamefiBalance < CLASS_CHANGE_COST_GAMEFI) {
        setFeedbackMsg({
          text: `Saldo insuficiente! A troca de classe custa ${CLASS_CHANGE_COST_GAMEFI} GAMEFI tokens.`,
          type: "error",
        });
        playSynthSound("beep");
        return;
      }

      // Debita o custo de troca de classe
      updateWallet({ gamefiBalance: gamefiBalance - CLASS_CHANGE_COST_GAMEFI });
    }

    setPlayerClass(selectedClassId);
    playSynthSound("unlock");
    setFeedbackMsg({
      text: `Parabéns! Você foi consagrado como ${selectedClass.name}!`,
      type: "success",
    });

    setTimeout(() => {
      setActiveModal(null);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none animate-in fade-in">
      <div className="bg-[#1a1c23] border-4 border-cyan-500/80 rounded-2xl max-w-2xl w-full p-5 shadow-[0_0_40px_rgba(6,182,212,0.4)] text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛲</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-cyan-300 tracking-wider flex items-center gap-2">
                Consagração de Classes da Fonte
              </h2>
              <p className="text-[11px] text-slate-400">
                {isFirstChoice ? "Escolha seu destino inicial sagrado" : `Troca de classe: ${CLASS_CHANGE_COST_GAMEFI} GAMEFI tokens`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-black flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lock Warning se não tiver estrelas */}
        {!isUnlocked && (
          <div className="my-3 bg-amber-950/70 border border-amber-500/50 p-3 rounded-xl flex items-center gap-3 text-amber-300 text-xs font-bold">
            <Lock className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <span>🔒 Consagração Bloqueada!</span>
              <p className="text-[10px] text-slate-300 font-normal">
                Complete ao menos 1 missão (1 Estrela) para ativar os poderes místicos da Fonte.
              </p>
            </div>
          </div>
        )}

        {/* Grid de Seleção de Classes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          {(Object.keys(CLASSES_CATALOG) as PlayerClassId[]).map((cId) => {
            const cData = CLASSES_CATALOG[cId];
            const isSelected = selectedClassId === cId;
            const isCurrent = currentClassId === cId;

            return (
              <button
                key={cId}
                onClick={() => {
                  setSelectedClassId(cId);
                  playSynthSound("beep");
                }}
                className={`p-3 rounded-xl border-2 transition text-left flex flex-col items-center gap-1.5 cursor-pointer relative ${
                  isSelected
                    ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black">
                    ATUAL
                  </span>
                )}
                <span className="text-3xl">{cData.icon}</span>
                <span className={`text-xs font-black text-center leading-tight ${isSelected ? "text-cyan-200" : "text-slate-300"}`}>
                  {cData.name}
                </span>
                <span className="text-[9px] text-slate-400 text-center">{cData.role}</span>
              </button>
            );
          })}
        </div>

        {/* Detalhes da Classe Selecionada */}
        <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
              {selectedClass.icon} {selectedClass.name} — {selectedClass.role}
            </h3>
            <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-cyan-400 font-bold">
              Passiva: {selectedClass.passiveName}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedClass.description}
          </p>

          {/* Modificadores de Atributos */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="block text-slate-400">STR</span>
              <span className={`font-black ${selectedClass.strMod >= 1.2 ? "text-emerald-400" : selectedClass.strMod < 1.0 ? "text-red-400" : "text-slate-200"}`}>
                {((selectedClass.strMod - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="block text-slate-400">INT</span>
              <span className={`font-black ${selectedClass.intMod >= 1.2 ? "text-emerald-400" : selectedClass.intMod < 1.0 ? "text-red-400" : "text-slate-200"}`}>
                {((selectedClass.intMod - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="block text-slate-400">AGI</span>
              <span className={`font-black ${selectedClass.agiMod >= 1.2 ? "text-emerald-400" : selectedClass.agiMod < 1.0 ? "text-red-400" : "text-slate-200"}`}>
                {((selectedClass.agiMod - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="block text-slate-400">RES</span>
              <span className={`font-black ${selectedClass.resMod >= 1.2 ? "text-emerald-400" : selectedClass.resMod < 1.0 ? "text-red-400" : "text-slate-200"}`}>
                {((selectedClass.resMod - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="block text-slate-400">FAITH</span>
              <span className={`font-black ${selectedClass.faithMod >= 1.2 ? "text-emerald-400" : selectedClass.faithMod < 1.0 ? "text-red-400" : "text-slate-200"}`}>
                {((selectedClass.faithMod - 1) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Grimório de Magias da Classe */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">✨ Grimório de Habilidades da Classe</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {spells.map((sp) => (
                <div key={sp.id} className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">{sp.icon} {sp.name}</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-black border border-cyan-800">
                      [{sp.shortcutKey}]
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-tight">{sp.description}</p>
                  <div className="flex items-center justify-between text-[8.5px] text-slate-500 pt-0.5">
                    <span>💧 {sp.mpCost} MP</span>
                    <span>⏱️ {(sp.gcdMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`mt-2 text-xs font-bold p-2 rounded-lg text-center ${
            feedbackMsg.type === "success" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
          }`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Footer & Botão de Confirmação */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="text-xs">
            <span className="text-slate-400">Saldo: </span>
            <span className="text-amber-400 font-bold">{gamefiBalance} GAMEFI</span>
          </div>

          <button
            onClick={handleConfirmClass}
            disabled={!isUnlocked}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition flex items-center gap-2 cursor-pointer ${
              !isUnlocked
                ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isFirstChoice ? "Consagrar Herói" : `Trocar Classe (${CLASS_CHANGE_COST_GAMEFI} GAMEFI)`}
          </button>
        </div>

      </div>
    </div>
  );
};
