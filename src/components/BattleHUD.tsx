import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { SPELL_GCD_MS, POTION_GCD_MS, POTION_SELF_CD_MS } from "../store/gameStore";

// ── Hook utilitário: atualiza o componente a 30fps para exibir o timer regressivo ──
const useAnimationFrame = (active: boolean) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let lastTime = 0;
    const loop = (t: number) => {
      // Atualiza a ~30fps (a cada ~33ms) para não sobrecarregar
      if (t - lastTime >= 33) {
        lastTime = t;
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
};

export const BattleHUD: React.FC = () => {
  const isBattleModeActive = useGameStore((s) => s.isBattleModeActive);
  const playerPos = useGameStore((s) => s.playerPos);
  const castMagic = useGameStore((s) => s.castMagic);
  const usePotion = useGameStore((s) => s.usePotion);
  const inventory = useGameStore((s) => s.inventory);
  const globalCooldownEnd = useGameStore((s) => s.globalCooldownEnd ?? 0);
  const potionCooldownEnd = useGameStore((s) => s.potionCooldownEnd ?? 0);

  // Ativa o loop de animação apenas quando há cooldown ativo
  const hasActiveCooldown = Date.now() < globalCooldownEnd || Date.now() < potionCooldownEnd;
  useAnimationFrame(hasActiveCooldown);

  // Lida com atalhos de teclado 1, 2, 3 para as magias e 4, 5 para itens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita disparar atalhos se estiver digitando no chat
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "1") castMagic("heal");
      if (e.key === "2") castMagic("fire");
      if (e.key === "3") castMagic("lightning");
      if (e.key === "4") usePotion("health");
      if (e.key === "5") usePotion("mana");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [castMagic, usePotion]);

  if (!isBattleModeActive) return null;

  const hp = playerPos?.hp ?? 100;
  const maxHp = playerPos?.maxHp ?? 100;
  const mp = playerPos?.mp ?? 50;
  const maxMp = playerPos?.maxMp ?? 50;

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

  const healthPotionsCount = (inventory || []).filter(i => i.id === "health_potion").reduce((acc, curr) => acc + curr.quantity, 0);
  const manaPotionsCount   = (inventory || []).filter(i => i.id === "mana_potion").reduce((acc, curr) => acc + curr.quantity, 0);

  const now = Date.now();

  // ── Cálculo de cooldowns restantes (ms) ──────────────────────────────────────
  // GCD bloqueia tudo; exibe o tempo regressivo em segundos
  const gcdRemaining = Math.max(0, globalCooldownEnd - now);
  const isGCDActive  = gcdRemaining > 0;

  // Tempo restante individual de cada magia (= GCD restante, pois GCD é compartilhado)
  // O overlay mostra o CD restante do GCD (que reflete o CD da última magia lançada)
  const healCdRemaining      = isGCDActive ? gcdRemaining : 0;
  const fireCdRemaining      = isGCDActive ? gcdRemaining : 0;
  const lightningCdRemaining = isGCDActive ? gcdRemaining : 0;

  // Poção: bloqueada pelo GCD OU pelo cooldown próprio de 5s
  const potionGCDRemaining  = Math.max(0, globalCooldownEnd - now);
  const potionSelfRemaining = Math.max(0, potionCooldownEnd - now);
  const potionCdRemaining   = Math.max(potionGCDRemaining, potionSelfRemaining);
  const isPotionCDActive    = potionCdRemaining > 0;

  // ── Helper: formata o timer regressivo (ex: "1.4s") ──────────────────────────
  const fmtCd = (ms: number) => ms > 0 ? `${(ms / 1000).toFixed(1)}s` : "";

  // ── Helper: overlay de cooldown sobre o botão ────────────────────────────────
  const CooldownOverlay = ({ remaining }: { remaining: number }) => {
    if (remaining <= 0) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70 z-10 pointer-events-none">
        <span className="text-white text-xs font-black drop-shadow-md">{fmtCd(remaining)}</span>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">

      {/* Indicador de GCD ativo — barra fina no topo da action bar */}
      {isGCDActive && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-none"
            style={{ width: `${(gcdRemaining / Math.max(SPELL_GCD_MS.lightning, 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Top Section — vazio (barras de HP/MP são desenhadas no Canvas) */}
      <div className="relative w-full flex-grow" />

      {/* Bottom Section — Magic Action Bar */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex gap-4 items-end bg-black/60 p-3 rounded-2xl border-2 border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">

          {/* Skill 1: Heal */}
          <button
            onClick={() => castMagic("heal")}
            disabled={healCdRemaining > 0}
            className="group relative w-14 h-14 bg-gradient-to-br from-green-600 to-green-900 border-2 border-green-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] cursor-pointer disabled:cursor-not-allowed"
            title={`Curar (Recupera 20% HP | Custo: 10 MP | CD: ${SPELL_GCD_MS.heal / 1000}s)`}
          >
            <CooldownOverlay remaining={healCdRemaining} />
            <span className={`text-2xl drop-shadow-md ${healCdRemaining > 0 ? "opacity-40" : ""}`}>💖</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">1</span>
            <span className="absolute -bottom-2 bg-black/80 text-green-300 text-[10px] font-mono px-1.5 rounded border border-green-800/50">10 MP</span>
          </button>

          {/* Skill 2: Fire */}
          <button
            onClick={() => castMagic("fire")}
            disabled={fireCdRemaining > 0}
            className="group relative w-14 h-14 bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] cursor-pointer disabled:cursor-not-allowed"
            title={`Bola de Fogo (Médio Alcance | Custo: 15 MP | CD: ${SPELL_GCD_MS.fire / 1000}s)`}
          >
            <CooldownOverlay remaining={fireCdRemaining} />
            <span className={`text-2xl drop-shadow-md ${fireCdRemaining > 0 ? "opacity-40" : ""}`}>🔥</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">2</span>
            <span className="absolute -bottom-2 bg-black/80 text-red-300 text-[10px] font-mono px-1.5 rounded border border-red-800/50">15 MP</span>
          </button>

          {/* Skill 3: Lightning */}
          <button
            onClick={() => castMagic("lightning")}
            disabled={lightningCdRemaining > 0}
            className="group relative w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-900 border-2 border-purple-400 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer disabled:cursor-not-allowed"
            title={`Raio (Alcance Longo/Médio | Custo: 25 MP | CD: ${SPELL_GCD_MS.lightning / 1000}s)`}
          >
            <CooldownOverlay remaining={lightningCdRemaining} />
            <span className={`text-2xl drop-shadow-md ${lightningCdRemaining > 0 ? "opacity-40" : ""}`}>⚡</span>
            <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">3</span>
            <span className="absolute -bottom-2 bg-black/80 text-purple-300 text-[10px] font-mono px-1.5 rounded border border-purple-800/50">25 MP</span>
          </button>

          {/* Divider */}
          <div className="w-px h-12 bg-slate-700 mx-1" />

          {/* Item 4: Health Potion */}
          <button
            onClick={() => usePotion("health")}
            disabled={isPotionCDActive || healthPotionsCount <= 0}
            className={`group relative w-12 h-12 bg-slate-900 border-2 ${
              healthPotionsCount > 0 && !isPotionCDActive
                ? "border-green-500 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                : "border-slate-700 opacity-50 grayscale"
            } rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed`}
            title={`Poção de Cura (Recupera 40% HP | CD: ${POTION_SELF_CD_MS / 1000}s | Tecla 4)`}
          >
            {/* Overlay de cooldown de poção (mostra CD maior entre GCD e self-cd) */}
            {isPotionCDActive && healthPotionsCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/75 z-10 pointer-events-none">
                <span className="text-white text-[10px] font-black">{fmtCd(potionCdRemaining)}</span>
              </div>
            )}
            <span className="text-xl">🧪</span>
            <span className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-slate-900 text-white text-[10px] font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">4</span>
            <span className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-600 shadow-md">
              x{healthPotionsCount}
            </span>
          </button>

          {/* Item 5: Mana Potion */}
          <button
            onClick={() => usePotion("mana")}
            disabled={isPotionCDActive || manaPotionsCount <= 0}
            className={`group relative w-12 h-12 bg-slate-900 border-2 ${
              manaPotionsCount > 0 && !isPotionCDActive
                ? "border-blue-500 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                : "border-slate-700 opacity-50 grayscale"
            } rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed`}
            title={`Poção de Mana (Recupera 50% MP | CD: ${POTION_SELF_CD_MS / 1000}s | Tecla 5)`}
          >
            {isPotionCDActive && manaPotionsCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/75 z-10 pointer-events-none">
                <span className="text-white text-[10px] font-black">{fmtCd(potionCdRemaining)}</span>
              </div>
            )}
            <span className="text-xl">💧</span>
            <span className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-slate-900 text-white text-[10px] font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">5</span>
            <span className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-600 shadow-md">
              x{manaPotionsCount}
            </span>
          </button>

          {/* MP Indicator */}
          <div className="flex flex-col justify-end ml-2 h-full pb-1">
            <div className="text-[10px] font-black text-blue-400 text-center mb-0.5 tracking-widest">MP</div>
            <div className="w-2.5 h-12 bg-black/80 border border-blue-900 rounded-full flex items-end overflow-hidden p-px">
              <div
                className="w-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ height: `${mpPercent}%`, boxShadow: "0 0 8px rgba(59,130,246,0.8)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
