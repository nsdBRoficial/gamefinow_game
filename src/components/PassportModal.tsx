import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { GameState, Player, Quest } from "../types";

interface PassportModalProps {
  showPassport: boolean;
  setShowPassport: (show: boolean) => void;
  playerPos: Player;
  gameState: GameState;
  getFormattedName: () => string;
  playSynthSound: (type: string) => void;
  completedCount: number;
  playerTitle: string;
  currentRegion: string;
  attrStr: number;
  attrInt: number;
  attrAgi: number;
  attrRes: number;
  attrFaith: number;
  currentActiveQuest?: Quest;
}

export function PassportModal({
  showPassport,
  setShowPassport,
  playerPos,
  gameState,
  getFormattedName,
  playSynthSound,
  completedCount,
  playerTitle,
  currentRegion,
  attrStr,
  attrInt,
  attrAgi,
  attrRes,
  attrFaith,
  currentActiveQuest,
}: PassportModalProps) {
  const [passportTab, setPassportTab] = useState<"attributes" | "credentials">("attributes");
  const [passportSecVisible, setPassportSecVisible] = useState(false);

  if (!showPassport) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbf5eb] border-[3px] border-black p-4 rounded-xl shadow-[6px_6px_0px_#000] max-w-sm w-full font-mono text-black">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
          <span className="text-[10px] sm:text-xs font-black uppercase text-[#8b5a2b] flex items-center gap-1">🛡️ ID DO VIAJANTE & FICHA RPG</span>
          <button 
            onClick={() => setShowPassport(false)}
            className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded border border-black flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-y-0.5"
          >
            X
          </button>
        </div>

        {/* Tabs selector */}
        <div className="grid grid-cols-2 gap-1 mb-3">
          <button
            onClick={() => {
              setPassportTab("attributes");
              playSynthSound("beep");
            }}
            className={`py-1 text-[9px] sm:text-[10px] font-bold border-2 border-black rounded transition shadow-[1px_1.5px_0_#000] active:translate-y-0.5 ${
              passportTab === "attributes" ? "bg-amber-400 text-black" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            🛡️ Atributos & RPG
          </button>
          <button
            onClick={() => {
              setPassportTab("credentials");
              playSynthSound("beep");
            }}
            className={`py-1 text-[9px] sm:text-[10px] font-bold border-2 border-black rounded transition shadow-[1px_1.5px_0_#000] active:translate-y-0.5 ${
              passportTab === "credentials" ? "bg-cyan-400 text-black" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            🔑 Credenciais Stellar
          </button>
        </div>
        
        {/* Content Body */}
        <div className="space-y-3 text-xs text-left">
          {passportTab === "attributes" ? (
            <div className="space-y-2.5">
              {/* Character snapshot card */}
              <div className="bg-[#ebd9c0]/40 p-2.5 border-2 border-dashed border-[#8b5a2b]/50 rounded-lg flex gap-3 items-center">
                {/* Live avatar visualization */}
                <div className="w-12 h-12 rounded border border-black/15 bg-white flex flex-col items-center justify-center relative shrink-0">
                  {/* Skin & head preview */}
                  <div 
                    className="w-6 h-6 rounded-md border border-black/20"
                    style={{ backgroundColor: playerPos.skinColor }}
                  >
                    {/* Face simulation */}
                    <div className="text-center text-[10px] leading-tight select-none mt-0.5">
                      {playerPos.faceType === "smile" ? "🙂" : playerPos.faceType === "glasses" ? "😎" : "😐"}
                    </div>
                  </div>
                  {/* Torso block */}
                  <div 
                    className="w-7 h-2.5 border-x border-b border-black/20 -mt-0.5"
                    style={{ backgroundColor: playerPos.torsoColor }}
                  />
                  {/* Shoes color */}
                  <div 
                    className="w-6 h-1 border-b border-black/20 -mt-0.5"
                    style={{ backgroundColor: playerPos.shoesColor }}
                  />
                </div>
                
                {/* Name and class info */}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-tight leading-none block ${
                    playerTitle === "Herói Lendário de Stellar" || (gameState.quests.hold.status === "completed" && !playerTitle)
                      ? "text-[#39ff14] drop-shadow-[0_0_3px_rgba(57,255,20,0.5)]"
                      : playerTitle === "Alquimista do Soroban" || (gameState.quests.soroban.status === "completed" && !playerTitle)
                      ? "text-purple-600 drop-shadow-[0_0_3px_rgba(147,51,234,0.4)]"
                      : playerTitle === "Operador On-Ramp" || (gameState.quests.onramp.status === "completed" && !playerTitle)
                      ? "text-amber-600 drop-shadow-[0_0_3px_rgba(217,119,6,0.4)]"
                      : playerTitle === "Iniciado de Stellar" || (gameState.quests.wallet.status === "completed" && !playerTitle)
                      ? "text-cyan-600 drop-shadow-[0_0_3px_rgba(8,145,178,0.4)]"
                      : "text-slate-800"
                  }`}>
                    {getFormattedName()}
                  </span>
                  <span className="text-[8.5px] font-bold text-amber-800 leading-none block uppercase">
                    Lvl {completedCount + 1} | {playerTitle}
                  </span>
                  <span className="text-[7.5px] text-slate-500 font-semibold block leading-tight truncate">
                    📍 {currentRegion}
                  </span>
                </div>
              </div>

              {/* RPG Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                  <span className="text-slate-500">💪 Força (STR):</span>
                  <span className="font-extrabold text-red-700">{attrStr}</span>
                </div>
                <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                  <span className="text-slate-500">🔮 Inteligência (INT):</span>
                  <span className="font-extrabold text-blue-700">{attrInt}</span>
                </div>
                <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                  <span className="text-slate-500">⚡ Agilidade (AGI):</span>
                  <span className="font-extrabold text-amber-700">{attrAgi}</span>
                </div>
                <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                  <span className="text-slate-500">🛡️ Resistência (RES):</span>
                  <span className="font-extrabold text-emerald-700">{attrRes}</span>
                </div>
              </div>

              {/* Stellar Faith and Power stats */}
              <div className="bg-white border border-black/15 p-2 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-700">
                  <span>✨ Sincronia Stellar (Fé):</span>
                  <span className="text-cyan-700 font-extrabold">{attrFaith} Pts</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded border border-black/5 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300" 
                    style={{ width: `${Math.min(attrFaith, 100)}%` }}
                  />
                </div>
              </div>

              {/* Current Objective banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-md">
                <span className="text-[7px] text-emerald-800 block font-bold uppercase tracking-wider leading-none">Objetivo de Missão</span>
                <span className="text-[9.5px] font-bold text-emerald-950 block leading-tight mt-0.5">
                  {currentActiveQuest?.title}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-[8px] text-slate-500 block uppercase font-bold">Endereço Público (Stellar Account ID)</span>
                {gameState.wallet.hasWallet ? (
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[9px] bg-white border border-black/15 px-2 py-1.5 rounded flex-1 select-all break-all overflow-hidden font-bold leading-tight">
                      {gameState.wallet.publicKey}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gameState.wallet.publicKey);
                        playSynthSound("coin");
                        alert("Endereço público copiado!");
                      }}
                      className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-2 text-[9px] font-black shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                    >
                      Copiar
                    </button>
                  </div>
                ) : (
                  <span className="text-red-600 font-black uppercase text-[8.5px] animate-pulse block mt-1">[ SEM CARTEIRA ATIVA! Fale com o Frank ]</span>
                )}
              </div>
              
              {gameState.wallet.hasWallet && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Chave Privada Secreta (Seed)</span>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[8.5px] bg-red-50 text-red-900 border border-red-200 px-2 py-1.5 rounded flex-1 select-all break-all overflow-hidden font-bold leading-tight flex items-center min-w-0">
                      <span className="truncate flex-1">
                        {passportSecVisible ? gameState.wallet.secretKey : "S" + "•".repeat(55)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPassportSecVisible(!passportSecVisible);
                        playSynthSound("beep");
                      }}
                      className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-1.5 flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                      title={passportSecVisible ? "Ocultar Chave" : "Mostrar Chave"}
                    >
                      {passportSecVisible ? <EyeOff className="h-3 w-3 text-slate-600" /> : <Eye className="h-3 w-3 text-slate-600" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gameState.wallet.secretKey);
                        playSynthSound("coin");
                        alert("Chave secreta copiada!");
                      }}
                      className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-2 text-[9px] font-black shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {gameState.wallet.hasWallet && (
                <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-2 mt-2 bg-white/40 p-2 rounded">
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-bold">Nome do Perfil</span>
                    <span className="text-[9.5px] text-slate-900 font-extrabold leading-tight block mt-0.5">{gameState.wallet.name || "Sem Nome"}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-bold">E-mail SDK</span>
                    <span className="text-[9.5px] text-slate-900 font-extrabold leading-tight block mt-0.5 truncate" title={gameState.wallet.email}>{gameState.wallet.email || "Sem E-mail"}</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-[7.5px] text-slate-500 block uppercase font-bold">Senha PIN</span>
                    <span className="text-[10.5px] font-mono font-extrabold text-orange-800 tracking-wider leading-none block mt-0.5">🔑 {gameState.wallet.pin || "------"}</span>
                  </div>
                </div>
              )}
              
              <div className="bg-[#ebd9c0]/50 p-2 rounded border border-black/10 text-[8px] text-[#543b2a] leading-relaxed font-semibold mt-2">
                ⚠️ Essa carteira é gerada e mantida localmente para fins educacionais de simulação da rede Stellar. Nunca deposite dinheiro real neste par de chaves de testes.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
