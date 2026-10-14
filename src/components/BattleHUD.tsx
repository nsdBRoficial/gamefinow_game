/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BattleHUD.tsx — Interface de Combate em Tempo Real & Target HUD (v1.5pvp)
 *
 * Responsabilidades:
 * 1. TargetHUD: Renderiza o alvo travado no topo da tela (Player Rival ou Monstro PvE),
 *    mostrando retrato contextual (⚔️ para players, 👾 para mobs), nível, guilda e HP em tempo real.
 * 2. Action Bar: Slots de habilidades de classe (1, 2, 3) com custo de MP e timers de GCD.
 * 3. Consumíveis Rápidos: Poções de Vida (4) e Mana (5) com rastreamento de estoque e cooldowns.
 * 4. Barra de GCD: Indicador visual superior animado a 30fps para leitura imediata do barramento global.
 * 5. Equipamentos Rápidos: Mostra armas e escudos equipados e seus respectivos bônus de ATK/DEF.
 */

import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { SPELL_GCD_MS, POTION_GCD_MS, POTION_SELF_CD_MS } from "../store/gameStore";
import { EQUIPMENT_CATALOG } from "../equipmentData";
import { getSpellsForClass } from "../spellsData";

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
  const castSpell = useGameStore((s) => s.castSpell);
  const usePotion = useGameStore((s) => s.usePotion);
  const inventory = useGameStore((s) => s.inventory);
  const globalCooldownEnd = useGameStore((s) => s.globalCooldownEnd ?? 0);
  const potionCooldownEnd = useGameStore((s) => s.potionCooldownEnd ?? 0);
  const targetInfo = useGameStore((s) => s.targetInfo);
  const setLockedTarget = useGameStore((s) => s.setLockedTarget);

  const spells = getSpellsForClass(playerPos?.playerClass);

  // Ativa o loop de animação apenas quando há cooldown ativo
  const hasActiveCooldown = Date.now() < globalCooldownEnd || Date.now() < potionCooldownEnd;
  useAnimationFrame(hasActiveCooldown);

  // Lida com atalhos de teclado 1, 2, 3 para as magias e 4, 5 para itens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita disparar atalhos se estiver digitando no chat
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "1" && spells[0]) castSpell(spells[0]);
      if (e.key === "2" && spells[1]) castSpell(spells[1]);
      if (e.key === "3" && spells[2]) castSpell(spells[2]);
      if (e.key === "4") usePotion("health");
      if (e.key === "5") usePotion("mana");
      if (e.key === "Escape") setLockedTarget(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [castSpell, usePotion, spells, setLockedTarget]);

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

      {/* Top Section — TargetHUD com retrato, nome, level e barra de HP do alvo */}
      <div className="relative w-full flex-grow">
        {targetInfo && isBattleModeActive && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-slate-950/95 border-2 border-red-500/80 rounded-2xl px-3.5 py-1.5 shadow-[0_0_20px_rgba(220,38,38,0.5)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 z-40 select-none">
            <div className="w-10 h-10 rounded-xl bg-red-950/90 border border-red-500/60 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
              {targetInfo.isPlayer ? "⚔️" : "👾"}
            </div>
            <div className="flex flex-col min-w-[130px] sm:min-w-[170px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono font-black text-xs text-white truncate max-w-[120px]">
                  {targetInfo.guildTag ? `[${targetInfo.guildTag}] ` : ""}{targetInfo.name}
                </span>
                <span className="font-mono font-bold text-[9px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50">
                  Lv.{targetInfo.level}
                </span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (targetInfo.hp / Math.max(1, targetInfo.maxHp)) * 100))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {Math.max(0, targetInfo.hp)} / {targetInfo.maxHp}
                </span>
              </div>
            </div>
            <button
              onClick={() => setLockedTarget(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              title="Cancelar Alvo (ESC)"
            >
              ✕
            </button>
          </div>
        )}

        {/* Widget de Equipamentos Ativos - Canto Inferior Esquerdo (acima do bottom bar) */}
        <div className="absolute bottom-20 left-4 pointer-events-auto flex flex-col gap-2">
          {/* Mão Direita (Arma) */}
          {(() => {
            const eq = playerPos?.equippedItems?.rightHand;
            if (!eq) return null;
            const item = EQUIPMENT_CATALOG.find(i => i.id === eq);
            if (!item) return null;
            return (
              <div className="flex items-center gap-2 bg-slate-900/90 border-2 border-amber-500/50 p-1.5 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur">
                <span className="text-xl">{item.icon}</span>
                <div className="flex flex-col pr-1">
                  <span className="text-[9px] font-black uppercase text-amber-400">{(item.atkBonus * 100).toFixed(0)}% ATK</span>
                </div>
              </div>
            );
          })()}

          {/* Mão Esquerda (Escudo) */}
          {(() => {
            const eq = playerPos?.equippedItems?.leftHand;
            if (!eq) return null;
            const item = EQUIPMENT_CATALOG.find(i => i.id === eq);
            if (!item) return null;
            return (
              <div className="flex items-center gap-2 bg-slate-900/90 border-2 border-blue-500/50 p-1.5 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.2)] backdrop-blur">
                <span className="text-xl">{item.icon}</span>
                <div className="flex flex-col pr-1">
                  <span className="text-[9px] font-black uppercase text-blue-400">{(item.defBonus * 100).toFixed(0)}% DEF</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Bottom Section — Magic Action Bar */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex gap-4 items-end bg-black/60 p-3 rounded-2xl border-2 border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">

          {/* Habilidades Dinâmicas da Classe */}
          {spells.slice(0, 3).map((sp, index) => {
            const slotNum = index + 1;
            const isHeal = sp.type === "heal";
            const isHoly = sp.element === "holy";
            const isFire = sp.element === "fire";
            const isLightning = sp.element === "lightning";

            const gradientClass = isHeal || isHoly
              ? "from-emerald-600 to-teal-900 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
              : isFire
              ? "from-red-600 to-amber-900 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
              : isLightning
              ? "from-indigo-600 to-purple-900 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]"
              : "from-amber-600 to-orange-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]";

            return (
              <button
                key={sp.id}
                onClick={() => castSpell(sp)}
                disabled={isGCDActive || mp < sp.mpCost}
                className={`group relative w-14 h-14 bg-gradient-to-br ${gradientClass} border-2 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed ${
                  mp < sp.mpCost ? "opacity-50 grayscale" : ""
                }`}
                title={`${sp.name} (${sp.description} | Custo: ${sp.mpCost} MP | CD: ${(sp.gcdMs / 1000).toFixed(1)}s)`}
              >
                <CooldownOverlay remaining={gcdRemaining} />
                <span className={`text-2xl drop-shadow-md ${isGCDActive ? "opacity-40" : ""}`}>{sp.icon}</span>
                <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">
                  {slotNum}
                </span>
                <span className="absolute -bottom-2 bg-black/80 text-cyan-300 text-[10px] font-mono px-1.5 rounded border border-cyan-800/50">
                  {sp.mpCost} MP
                </span>
              </button>
            );
          })}

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
