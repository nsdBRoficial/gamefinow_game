import React from "react";
import { useGameStore } from "../store/gameStore";

export const BattleHUD: React.FC = () => {
  const isBattleModeActive = useGameStore((s) => s.isBattleModeActive);
  const playerPos = useGameStore((s) => s.playerPos);

  if (!isBattleModeActive) return null;

  // Placeholder para status reais. Quando implementarmos a lógica de stats, isso virá de playerPos
  const hp = playerPos.hp ?? 100;
  const maxHp = playerPos.maxHp ?? 100;
  const mp = playerPos.mp ?? 50;
  const maxMp = playerPos.maxMp ?? 50;

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* HP Bar - Left Side */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="text-green-400 font-black font-mono text-xs mb-1 drop-shadow-md border-black" style={{ textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" }}>HP</div>
        <div className="w-6 h-64 md:w-8 md:h-80 bg-black/60 border-2 border-[#2b2b2b] rounded-sm p-0.5 flex flex-col-reverse shadow-[2px_2px_0_#000]">
          <div 
            className="w-full bg-gradient-to-t from-green-700 to-green-400 transition-all duration-300 rounded-sm"
            style={{ height: `${hpPercent}%` }}
          />
        </div>
        <div className="text-green-300 font-bold font-mono text-[10px] mt-1 bg-black/60 px-1 rounded" style={{ textShadow: "1px 1px 0 #000" }}>{hp}/{maxHp}</div>
      </div>

      {/* MP Bar - Right Side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="text-blue-400 font-black font-mono text-xs mb-1 drop-shadow-md" style={{ textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" }}>MP</div>
        <div className="w-6 h-64 md:w-8 md:h-80 bg-black/60 border-2 border-[#2b2b2b] rounded-sm p-0.5 flex flex-col-reverse shadow-[2px_2px_0_#000]">
          <div 
            className="w-full bg-gradient-to-t from-blue-700 to-blue-400 transition-all duration-300 rounded-sm"
            style={{ height: `${mpPercent}%` }}
          />
        </div>
        <div className="text-blue-300 font-bold font-mono text-[10px] mt-1 bg-black/60 px-1 rounded" style={{ textShadow: "1px 1px 0 #000" }}>{mp}/{maxMp}</div>
      </div>
    </div>
  );
};
