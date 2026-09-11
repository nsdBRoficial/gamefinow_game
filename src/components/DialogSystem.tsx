import React from "react";
import { GameState } from "../types";

interface DialogSystemProps {
  activeDialog: GameState["activeDialog"];
  isNearTerminal: string | null;
  handleAdvanceDialog: () => void;
  handleTriggerModal: () => void;
}

import { useTranslation } from "react-i18next";

export function DialogSystem({
  activeDialog,
  isNearTerminal,
  handleAdvanceDialog,
  handleTriggerModal,
}: DialogSystemProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* AUTHENTIC DIALOG SPEECH BUBBLE OVERLAY */}
      {activeDialog && (
        <div 
          onClick={handleAdvanceDialog}
          className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 bg-[#faf9f5] text-black border-[3.5px] border-black rounded-[16px] shadow-[4px_5px_0px_rgba(0,0,0,1)] p-5 md:p-6 flex items-start gap-4 md:gap-5 cursor-pointer select-none z-30 animate-in slide-in-from-bottom duration-150"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#ece9df] border-3 border-black rounded-xl flex items-center justify-center text-3xl md:text-4xl shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
            {activeDialog.npcId === "guide" ? "🤵" :
             activeDialog.npcId === "keymaster" ? "💎" :
             activeDialog.npcId === "portmaster" ? "👑" :
             activeDialog.npcId === "scholar" ? "🔮" : "🧙‍♂️"}
          </div>
          <div className="flex-1 space-y-1.5 text-left">
            <div className="bg-[#ffbf00] border-2 border-black rounded-md px-2 py-0.5 font-black text-[10px] md:text-xs uppercase font-mono tracking-wider text-black inline-block shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              {activeDialog.npcName}
            </div>
            <p className="text-sm sm:text-base md:text-lg font-bold leading-relaxed text-slate-900">
              "{activeDialog.text[activeDialog.currentStep]}"
            </p>
            <div className="flex justify-between items-center pt-2 text-[9px] md:text-xs text-slate-600 font-mono border-t border-dashed border-black/20">
              <span>{t('ui.pressSpace')}</span>
              <span className="bg-[#ece9df] px-1.5 py-0.5 rounded border border-black/15 text-black font-bold">
                {activeDialog.currentStep + 1} / {activeDialog.text.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* WEb3 TERMINAL PROXIMITY DIALOG ACTION TRIGGER */}
      {isNearTerminal && !activeDialog && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 w-72 max-w-[90%] bg-white border-3 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000] flex flex-col gap-1.5 animate-bounce text-center">
          <div className="font-mono">
            <span className="text-[7.5px] text-[#ffbf00] font-black uppercase block tracking-wider leading-none">
              {isNearTerminal === "arena" ? "⚔️ ARENA PVP DISPONÍVEL" : t('ui.terminalAvailable')}
            </span>
            <span className="text-black font-black text-xs uppercase leading-tight">
              {isNearTerminal === "arena"
                ? "LOBBY DE BATALHA GLADIATÓRIA"
                : `${t('ui.connectTerminal')} ${isNearTerminal === "atf" ? "ATM" : isNearTerminal?.toUpperCase()}`}
            </span>
          </div>
          <button
            id="btn-open-terminal"
            onClick={handleTriggerModal}
            className={`w-full py-1.5 rounded text-white border-2 border-black shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.2),inset_2px_2px_0px_rgba(255,255,255,0.4),0_2.5px_0px_#000] active:translate-y-0.5 active:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2),0_1px_0px_#000] font-black text-[10px] tracking-wider cursor-pointer transition ${
              isNearTerminal === "arena" ? "bg-red-600 hover:bg-red-500" : "bg-[#5db81d]"
            }`}
          >
            {isNearTerminal === "arena" ? "⚔️ Entrar na Arena PvP" : `💻 ${t('ui.connectWeb3Device')}`}
          </button>
        </div>
      )}
    </>
  );
}
