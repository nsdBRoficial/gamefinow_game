import React from "react";
import { useGameStore } from "../store/gameStore";

export const BattleHUD: React.FC = () => {
  const isBattleModeActive = useGameStore((s) => s.isBattleModeActive);
  const playerPos = useGameStore((s) => s.playerPos);
  const castMagic = useGameStore((s) => s.castMagic);

  // Lida com atalhos de teclado 1, 2, 3 para as magias
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") castMagic("heal");
      if (e.key === "2") castMagic("fire");
      if (e.key === "3") castMagic("lightning");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [castMagic]);

  if (!isBattleModeActive) return null;

  // Placeholder para status reais. Quando implementarmos a lógica de stats, isso virá de playerPos
  const hp = playerPos?.hp ?? 100;
  const maxHp = playerPos?.maxHp ?? 100;
  const mp = playerPos?.mp ?? 50;
  const maxMp = playerPos?.maxMp ?? 50;

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">
      
      {/* Top Section / Mid Section - HP/MP Bars Removidas (usando barras curvas no Canvas) */}
      <div className="relative w-full flex-grow">
      </div>

      {/* Bottom Section - Magic Action Bar */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex gap-4 items-end bg-black/60 p-3 rounded-2xl border-2 border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          
          {/* Skill 1: Heal */}
          <button 
            onClick={() => castMagic("heal")}
            className="group relative w-14 h-14 bg-gradient-to-br from-green-600 to-green-900 border-2 border-green-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] cursor-pointer"
            title="Curar (Recupera 20% HP | Custo: 10 MP)"
          >
            <span className="text-2xl drop-shadow-md">💖</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">1</span>
            <span className="absolute -bottom-2 bg-black/80 text-green-300 text-[10px] font-mono px-1.5 rounded border border-green-800/50">10 MP</span>
          </button>

          {/* Skill 2: Fire */}
          <button 
            onClick={() => castMagic("fire")}
            className="group relative w-14 h-14 bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] cursor-pointer"
            title="Bola de Fogo (Médio Alcance | Custo: 15 MP)"
          >
            <span className="text-2xl drop-shadow-md">🔥</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">2</span>
            <span className="absolute -bottom-2 bg-black/80 text-red-300 text-[10px] font-mono px-1.5 rounded border border-red-800/50">15 MP</span>
          </button>

          {/* Skill 3: Lightning */}
          <button 
            onClick={() => castMagic("lightning")}
            className="group relative w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-900 border-2 border-purple-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer"
            title="Raio (Alcance Longo/Médio | Custo: 25 MP)"
          >
            <span className="text-2xl drop-shadow-md">⚡</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">3</span>
            <span className="absolute -bottom-2 bg-black/80 text-purple-300 text-[10px] font-mono px-1.5 rounded border border-purple-800/50">25 MP</span>
          </button>

          {/* Mana MP Indicator Minimal */}
          <div className="flex flex-col justify-end ml-4 h-full pb-1">
            <div className="text-[10px] font-black text-blue-400 text-center mb-0.5 tracking-widest">MP</div>
            <div className="w-2.5 h-12 bg-black/80 border border-blue-900 rounded-full flex items-end overflow-hidden p-px">
              <div 
                className="w-full bg-blue-500 rounded-full transition-all duration-300" 
                style={{ height: `${mpPercent}%`, boxShadow: '0 0 8px rgba(59,130,246,0.8)' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
