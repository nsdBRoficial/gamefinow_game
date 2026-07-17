import React from "react";
import { Player } from "../types";

interface MapModalProps {
  showMapModal: boolean;
  setShowMapModal: (show: boolean) => void;
  playerPos: Player;
}

export function MapModal({ showMapModal, setShowMapModal, playerPos }: MapModalProps) {
  if (!showMapModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto select-none animate-fade-in">
      <div className="bg-[#ebd9c0] border-4 border-[#5c3e21] p-5 rounded-2xl shadow-[4px_6px_0px_#27190c] max-w-lg w-full text-[#3e2714] relative flex flex-col gap-4 font-sans border-double">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#8b5c30]/40 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg uppercase tracking-wide text-[#5c3e21]">Mapa de Stellar</h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Sistema de Navegação</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMapModal(false)}
            className="w-8 h-8 rounded-full bg-[#f3e6d3] border-2 border-[#5c3e21] flex items-center justify-center text-[#5c3e21] font-black hover:bg-[#5c3e21] hover:text-white transition-colors shadow-[2px_2px_0px_#27190c] active:translate-y-0.5 active:shadow-none"
          >
            ×
          </button>
        </div>

        {/* Map Layout Diagram */}
        <div className="bg-[#f3e6d3] border-2 border-black/20 rounded-xl p-4 flex flex-col items-center gap-4 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          
          {/* 1. NORTH WORLD */}
          <div className="flex flex-col items-center">
            <div className={`w-36 px-2.5 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
              playerPos.mapId === "north" 
                ? "bg-blue-100 border-blue-600 ring-2 ring-blue-400 ring-offset-1 ring-offset-[#dfcca7]" 
                : "bg-[#f5ebd3] border-[#5c3e21]/60"
            }`}>
              {playerPos.mapId === "north" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
              <div className="text-[10px] font-extrabold text-blue-800">Cidadela Onramp</div>
              <div className="text-[8px] text-slate-600 font-medium">Montanhas [Norte]</div>
            </div>
            {/* Vertical Connection */}
            <div className="h-4 w-0.5 bg-dashed border-l-2 border-[#5c3e21]/40"></div>
          </div>

          {/* 2. MIDDLE ROW (West - Center - East) */}
          <div className="flex items-center justify-center">
            {/* WEST WORLD */}
            <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
              playerPos.mapId === "west" 
                ? "bg-purple-100 border-purple-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-[#dfcca7]" 
                : "bg-[#f5ebd3] border-[#5c3e21]/60"
            }`}>
              {playerPos.mapId === "west" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
              <div className="text-[10px] font-extrabold text-purple-800">Plataforma Soroban</div>
              <div className="text-[8px] text-slate-600 font-medium">Cypherpunk [Oeste]</div>
            </div>

            {/* Horizontal Connector Left */}
            <div className="w-2 sm:w-4 h-0.5 border-t-2 border-dashed border-[#5c3e21]/40"></div>

            {/* CENTER WORLD */}
            <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
              (!playerPos.mapId || playerPos.mapId === "center") 
                ? "bg-emerald-100 border-emerald-600 ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#dfcca7]" 
                : "bg-[#f5ebd3] border-[#5c3e21]/60"
            }`}>
              {(!playerPos.mapId || playerPos.mapId === "center") && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
              <div className="text-[10px] font-extrabold text-emerald-800">Praça Central</div>
              <div className="text-[8px] text-slate-600 font-medium">Ponto Inicial [Centro]</div>
            </div>

            {/* Horizontal Connector Right */}
            <div className="w-2 sm:w-4 h-0.5 border-t-2 border-dashed border-[#5c3e21]/40"></div>

            {/* EAST WORLD */}
            <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
              playerPos.mapId === "east" 
                ? "bg-amber-100 border-amber-600 ring-2 ring-amber-400 ring-offset-1 ring-offset-[#dfcca7]" 
                : "bg-[#f5ebd3] border-[#5c3e21]/60"
            }`}>
              {playerPos.mapId === "east" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
              <div className="text-[10px] font-extrabold text-amber-800">Templo Stellar</div>
              <div className="text-[8px] text-slate-600 font-medium">Cavernas [Leste]</div>
            </div>
          </div>

          {/* 3. SOUTH WORLD */}
          <div className="flex flex-col items-center">
            {/* Vertical Connection */}
            <div className="h-4 w-0.5 bg-dashed border-l-2 border-[#5c3e21]/40"></div>
            <div className={`w-36 px-2.5 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
              playerPos.mapId === "south" 
                ? "bg-yellow-100 border-yellow-600 ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#dfcca7]" 
                : "bg-[#f5ebd3] border-[#5c3e21]/60"
            }`}>
              {playerPos.mapId === "south" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
              <div className="text-[10px] font-extrabold text-yellow-800">Santuário Holder</div>
              <div className="text-[8px] text-slate-600 font-medium">Floresta [Sul]</div>
            </div>
          </div>

        </div>

        {/* Informational Details / Instructions */}
        <div className="bg-[#fcf8f2] p-3 rounded-lg border border-[#8b5c30]/20 text-[9.5px] leading-relaxed flex flex-col gap-1.5 font-mono">
          <div className="font-bold uppercase text-[#5c3e21] border-b border-[#8b5c30]/20 pb-0.5 mb-0.5">ℹ️ Portais de Viagem Livre:</div>
          <div className="text-emerald-700 font-bold text-center py-0.5 bg-emerald-50 rounded border border-emerald-200">
            ✨ TODOS OS PORTAIS ESTÃO 100% LIBERADOS E ABERTOS! ✨
          </div>
          <div className="text-slate-600 text-[9px] leading-normal">
            As rotas para o Leste, Norte, Oeste e Sul estão totalmente desbloqueadas para livre ida e volta. Cada bioma funciona de forma isolada, sendo uma área fechada com apenas o portal de retorno ligando de volta à Praça Central.
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-slate-500 font-semibold font-mono uppercase tracking-wider">
          Dica: Pressione <span className="bg-[#5c3e21]/15 text-[#3e2714] px-1 py-0.5 rounded border border-black/10 font-bold">[ M ]</span> para fechar
        </div>

      </div>
    </div>
  );
}
