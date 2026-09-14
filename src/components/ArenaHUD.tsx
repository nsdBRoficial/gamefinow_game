/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ArenaHUD.tsx — HUD da Arena PVP, idêntico ao BattleHUD do jogo normal
 *
 * Layout igual ao BattleHUD:
 * - Action bar no bottom-center (magias + poções + barra de MP)
 * - GCD indicator acima da action bar
 * - Equipamentos no canto inferior esquerdo
 *
 * Elementos exclusivos da Arena:
 * - Timer + vivos: topo-centro
 * - Lista de oponentes: topo-esquerdo
 * - Botão de saída: topo-direito (com confirmação)
 * - Overlay de resultado (VITÓRIA / ELIMINADO)
 */

import React, { useEffect, useState } from "react";
import { useGameStore, SPELL_GCD_MS, POTION_SELF_CD_MS } from "../store/gameStore";
import { PvpSession, PvpMatchEndPayload } from "../pvp/pvpTypes";
import { getSocket } from "../services/multiplayerService";
import { getSpellsForClass } from "../spellsData";
import { EQUIPMENT_CATALOG } from "../equipmentData";
import { Trophy, Skull, Timer, Swords } from "lucide-react";

interface ArenaHUDProps {
  session: PvpSession;
  playerId: string;
  onMatchEnd: (result: PvpMatchEndPayload) => void;
  onLeave?: () => void;
}

// ── Hook de timer de partida ──────────────────────────────────────────────────
const useArenaTimers = (session: PvpSession) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  if (session.status === "waiting") return "AGUARDANDO OPONENTES";
  if (session.status === "pre_battle" && session.preBattleUntil) {
    const s = Math.max(0, Math.ceil((session.preBattleUntil - now) / 1000));
    return `COMEÇA EM 0:${String(s).padStart(2, "0")}`;
  }
  if (session.status === "in_progress" && session.endsAt) {
    const s = Math.max(0, Math.ceil((session.endsAt - now) / 1000));
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `MATANÇA ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return "FINALIZADO";
};

// ── Hook cooldown (30fps) ─────────────────────────────────────────────────────
const useAnimationFrame = (active: boolean) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let lastTime = 0;
    const loop = (t: number) => {
      if (t - lastTime >= 33) { lastTime = t; setTick((n) => n + 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
};

export const ArenaHUD: React.FC<ArenaHUDProps> = ({ session, playerId, onMatchEnd, onLeave }) => {
  const playerPos = useGameStore((s) => s.playerPos);
  const castSpell = useGameStore((s) => s.castSpell);
  const usePotion = useGameStore((s) => s.usePotion);
  const inventory = useGameStore((s) => s.inventory) ?? [];
  const globalCooldownEnd = useGameStore((s) => s.globalCooldownEnd ?? 0);
  const potionCooldownEnd = useGameStore((s) => s.potionCooldownEnd ?? 0);

  const [matchResult, setMatchResult] = useState<{
    type: "victory" | "eliminated";
    winnerName?: string;
  } | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  const spells = getSpellsForClass(playerPos.playerClass);
  const meInSession = session.players.find((p) => p.playerId === playerId);
  const opponents = session.players.filter((p) => p.playerId !== playerId && !p.isEliminated);

  const matchTime = useArenaTimers(session);

  const now = Date.now();
  const hasActiveCooldown = now < globalCooldownEnd || now < potionCooldownEnd;
  useAnimationFrame(hasActiveCooldown || session.status === "in_progress");

  // Escuta eventos de fim de partida apenas pelo match_end (time over)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleMatchEnd = (data: PvpMatchEndPayload) => {
      setMatchResult({ type: data.winnerId === playerId ? "victory" : "eliminated", winnerName: data.winnerName });
      onMatchEnd(data);
    };
    socket.on("arena_match_end", handleMatchEnd);
    return () => {
      socket.off("arena_match_end", handleMatchEnd);
    };
  }, [playerId, onMatchEnd]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const hp = meInSession?.hp ?? playerPos.hp ?? 100;
  const maxHp = meInSession?.maxHp ?? playerPos.maxHp ?? 100;
  const mp = playerPos.mp ?? 50;
  const maxMp = playerPos.maxMp ?? 50;
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

  const healthPotionsCount = inventory.filter((i) => i.id === "health_potion").reduce((a, c) => a + c.quantity, 0);
  const manaPotionsCount = inventory.filter((i) => i.id === "mana_potion").reduce((a, c) => a + c.quantity, 0);

  const gcdRemaining = Math.max(0, globalCooldownEnd - now);
  const isGCDActive = gcdRemaining > 0;
  const potionSelfRemaining = Math.max(0, potionCooldownEnd - now);
  const potionCdRemaining = Math.max(gcdRemaining, potionSelfRemaining);
  const isPotionCDActive = potionCdRemaining > 0;

  const fmtCd = (ms: number) => ms > 0 ? `${(ms / 1000).toFixed(1)}s` : "";

  // ── Arena Combat Actions ──
  const getClosestTarget = () => {
    let closest = null;
    let minDist = Infinity;
    opponents.forEach((op) => {
      const dist = Math.sqrt(Math.pow(op.arenaX - (meInSession?.arenaX ?? 0), 2) + Math.pow(op.arenaY - (meInSession?.arenaY ?? 0), 2));
      if (dist < minDist) {
        minDist = dist;
        closest = op;
      }
    });
    return closest;
  };

  const doPhysicalAttack = () => {
    if (isGCDActive) return;
    const target = getClosestTarget();
    if (!target) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("arena_attack", {
        sessionId: session.sessionId,
        attackerId: playerId,
        targetId: target.playerId,
        playerClass: meInSession?.playerClass,
        timestamp: Date.now(),
      });
      useGameStore.setState({ globalCooldownEnd: Date.now() + 1000 });
      // Executa animação local
      if (spells[0]) castSpell(spells[0]);
    }
  };

  const doArenaSpell = (spell: any) => {
    if (isGCDActive || playerPos.mp! < spell.mpCost) return;
    let targetId = null;
    if (spell.type !== "heal") {
      const t = getClosestTarget();
      if (!t) return;
      targetId = t.playerId;
    }
    const socket = getSocket();
    if (socket) {
      socket.emit("arena_cast_spell", {
        sessionId: session.sessionId,
        attackerId: playerId,
        targetId,
        spellId: spell.id,
        spellPower: spell.basePower,
        element: spell.element,
      });
      useGameStore.setState({ globalCooldownEnd: Date.now() + spell.gcdMs });
      castSpell(spell);
    }
  };

  const doArenaPotion = (type: "health" | "mana") => {
    if (type === "health") {
      const socket = getSocket();
      socket?.emit("arena_cast_spell", {
        sessionId: session.sessionId, attackerId: playerId, targetId: null,
        spellId: "potion", spellPower: 40, element: "heal"
      });
    }
    usePotion(type);
  };

  // Hotkeys: 1,2,3 magias / 4,5 poções (Arena mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "1") doPhysicalAttack();
      if (e.key === "2" && spells[1]) doArenaSpell(spells[1]);
      if (e.key === "3" && spells[2]) doArenaSpell(spells[2]);
      if (e.key === "4") doArenaPotion("health");
      if (e.key === "5") doArenaPotion("mana");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spells, opponents, meInSession, session.sessionId, playerId, isGCDActive]);



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

      {/* ── GCD bar (acima da action bar, igual ao BattleHUD) ── */}
      {isGCDActive && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-none"
            style={{ width: `${(gcdRemaining / Math.max(SPELL_GCD_MS.lightning, 1)) * 100}%` }}
          />
        </div>
      )}

      {/* ── Top Section ── */}
      <div className="relative w-full flex-grow">

        {/* Timer + Placar Central (topo-centro) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-800/40 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            <Timer size={14} className="text-amber-400" />
            <span className="text-white font-mono font-bold text-sm tracking-widest">{matchTime}</span>
          </div>
        </div>

        {/* Placar de Kills/Deaths (Topo-esquerdo) */}
        <div className="absolute top-0 left-0 pointer-events-none flex flex-col gap-1 w-48">
          <div className="bg-slate-950/90 border border-slate-700/50 rounded-lg p-2 shadow-lg backdrop-blur-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-800 flex items-center gap-1">
              <Swords size={12} /> Placar
            </div>
            <div className="flex flex-col gap-1 max-h-32 overflow-hidden">
              {[...session.players].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths).slice(0, 5).map(p => (
                <div key={p.playerId} className={`flex justify-between items-center text-[11px] font-mono ${p.playerId === playerId ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                  <span className="truncate max-w-[80px]">{p.name}</span>
                  <span className="text-slate-500">{p.kills}K / {p.deaths}D</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão de saída (topo-direito) */}
        {onLeave && !matchResult && (
          <div className="absolute top-0 right-0 pointer-events-auto flex items-center gap-2">
            {leaveConfirm ? (
              <>
                <span className="text-xs text-red-300 font-mono bg-black/80 px-2 py-1.5 rounded border border-red-900/50">Confirmar saída?</span>
                <button
                  onClick={() => onLeave()}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-600 border border-red-500 text-white text-xs font-bold font-mono rounded-lg cursor-pointer transition active:scale-95 shadow-lg"
                >✓ Sair</button>
                <button
                  onClick={() => setLeaveConfirm(false)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-mono rounded-lg cursor-pointer transition active:scale-95"
                >✕</button>
              </>
            ) : (
              <button
                onClick={() => setLeaveConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 hover:bg-red-950/80 border border-slate-700/50 hover:border-red-700/60 text-slate-400 hover:text-red-300 text-xs font-mono font-bold rounded-lg cursor-pointer transition-all shadow-lg active:scale-95 backdrop-blur-sm"
                title="Sair da batalha (Escape)"
              >
                🚪 Sair
              </button>
            )}
          </div>
        )}

        {/* Status aguardando (dentro da batalha) */}
        {session.status === "waiting" && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 bg-slate-950/95 border-2 border-amber-500/80 px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] text-center animate-pulse">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-sm uppercase tracking-wider">
              <span>⏳</span> Free-For-All
            </div>
            <p className="text-slate-300 text-xs font-sans max-w-xs">
              Aguardando ao menos mais um jogador. A partida iniciará quando houver oponentes! ({session.players.length}/8)
            </p>
            <button
              onClick={() => onLeave?.()}
              className="mt-1 px-3 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 rounded text-[11px] font-mono font-bold transition cursor-pointer"
            >
              ✕ Sair da Arena
            </button>
          </div>
        )}

        {/* Overlay Respawn (Quando morto no meio da partida) */}
        {meInSession?.isEliminated && !matchResult && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <Skull size={48} className="text-red-600 mb-4 animate-pulse" />
            <h2 className="text-3xl font-black text-red-500 font-mono tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              ELIMINADO
            </h2>
            <p className="text-slate-400 font-mono mt-2 animate-pulse">
              Ressuscitando na arena em breve...
            </p>
          </div>
        )}

        {/* Mini lista de oponentes (canto esquerdo) — igual ao BattleHUD com equipamentos */}
        <div className="absolute bottom-20 left-4 pointer-events-auto flex flex-col gap-2">
          {/* Mão Direita (Arma) */}
          {(() => {
            const eq = playerPos?.equippedItems?.rightHand;
            if (!eq) return null;
            const item = EQUIPMENT_CATALOG.find((i) => i.id === eq);
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
            const item = EQUIPMENT_CATALOG.find((i) => i.id === eq);
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

          {/* Oponentes vivos */}
          {opponents.slice(0, 4).map((opp) => {
            const oppHpPct = Math.max(0, Math.min(100, (opp.hp / opp.maxHp) * 100));
            const hpColor = oppHpPct > 50 ? "#22c55e" : oppHpPct > 25 ? "#f59e0b" : "#ef4444";
            return (
              <div key={opp.playerId} className="flex items-center gap-2 bg-slate-900/90 border border-red-800/40 px-2 py-1.5 rounded-lg backdrop-blur" style={{ minWidth: 120 }}>
                <div className="w-5 h-5 rounded-full bg-red-800/50 flex items-center justify-center text-[10px]">⚔️</div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-300 text-[10px] font-bold truncate">{opp.name}</div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${oppHpPct}%`, backgroundColor: hpColor }} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{opp.hp}/{opp.maxHp}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Section — Action Bar (idêntica ao BattleHUD) ── */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex gap-4 items-end bg-black/60 p-3 rounded-2xl border-2 border-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-sm">

          {/* Habilidades da Classe (slots 1, 2, 3) */}
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
                onClick={() => slotNum === 1 ? doPhysicalAttack() : doArenaSpell(sp)}
                disabled={isGCDActive || mp < sp.mpCost}
                className={`group relative w-14 h-14 bg-gradient-to-br ${gradientClass} border-2 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed ${mp < sp.mpCost ? "opacity-50 grayscale" : ""}`}
                title={`${sp.name} (${sp.description} | Custo: ${sp.mpCost} MP | CD: ${(sp.gcdMs / 1000).toFixed(1)}s)`}
              >
                <CooldownOverlay remaining={gcdRemaining} />
                <span className={`text-2xl drop-shadow-md ${isGCDActive ? "opacity-40" : ""}`}>{sp.icon}</span>
                <span className="absolute -top-3 -left-3 w-6 h-6 bg-slate-900 text-white text-xs font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">{slotNum}</span>
                <span className="absolute -bottom-2 bg-black/80 text-cyan-300 text-[10px] font-mono px-1.5 rounded border border-cyan-800/50">{sp.mpCost} MP</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-12 bg-slate-700 mx-1" />

          {/* Poção HP (slot 4) */}
          <button
            onClick={() => doArenaPotion("health")}
            disabled={isPotionCDActive || healthPotionsCount <= 0}
            className={`group relative w-12 h-12 bg-slate-900 border-2 ${
              healthPotionsCount > 0 && !isPotionCDActive
                ? "border-green-500 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                : "border-slate-700 opacity-50 grayscale"
            } rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed`}
            title={`Poção de Cura (40% HP | CD: ${POTION_SELF_CD_MS / 1000}s | Tecla 4)`}
          >
            {isPotionCDActive && healthPotionsCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/75 z-10 pointer-events-none">
                <span className="text-white text-[10px] font-black">{fmtCd(potionCdRemaining)}</span>
              </div>
            )}
            <span className="text-xl">🧪</span>
            <span className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-slate-900 text-white text-[10px] font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">4</span>
            <span className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-600 shadow-md">x{healthPotionsCount}</span>
          </button>

          {/* Poção MP (slot 5) */}
          <button
            onClick={() => doArenaPotion("mana")}
            disabled={isPotionCDActive || manaPotionsCount <= 0}
            className={`group relative w-12 h-12 bg-slate-900 border-2 ${
              manaPotionsCount > 0 && !isPotionCDActive
                ? "border-blue-500 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                : "border-slate-700 opacity-50 grayscale"
            } rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed`}
            title={`Poção de Mana (50% MP | CD: ${POTION_SELF_CD_MS / 1000}s | Tecla 5)`}
          >
            {isPotionCDActive && manaPotionsCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/75 z-10 pointer-events-none">
                <span className="text-white text-[10px] font-black">{fmtCd(potionCdRemaining)}</span>
              </div>
            )}
            <span className="text-xl">💧</span>
            <span className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-slate-900 text-white text-[10px] font-black rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-800">5</span>
            <span className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-600 shadow-md">x{manaPotionsCount}</span>
          </button>

          {/* Barra de MP vertical (igual ao BattleHUD) */}
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

      {/* ── Overlay de Resultado da Partida ── */}
      {matchResult && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto z-30">
          <div
            className="text-center px-10 py-8 rounded-2xl border-2 shadow-2xl"
            style={{
              background: matchResult.type === "victory"
                ? "linear-gradient(160deg, #0f0f0a 0%, #1a1500 100%)"
                : "linear-gradient(160deg, #0f0f0f 0%, #0a0000 100%)",
              borderColor: matchResult.type === "victory" ? "#f59e0b" : "#7f1d1d",
              boxShadow: matchResult.type === "victory"
                ? "0 0 60px rgba(245,158,11,0.4)"
                : "0 0 60px rgba(220,38,38,0.4)",
            }}
          >
            {matchResult.type === "victory" ? (
              <>
                <Trophy size={48} className="text-amber-400 mx-auto mb-3 animate-bounce" />
                <h2 className="text-3xl font-black text-amber-400 mb-2" style={{ textShadow: "0 0 20px rgba(245,158,11,0.8)" }}>VITÓRIA!</h2>
                <p className="text-amber-200/80 text-sm mb-4">Você é o último de pé!</p>
                <div className="flex gap-4 justify-center">
                  <div className="text-center"><div className="text-2xl font-black text-yellow-400">+150</div><div className="text-xs text-slate-400">XP</div></div>
                  <div className="text-center"><div className="text-2xl font-black text-amber-400">+0.5</div><div className="text-xs text-slate-400">GAMEFI</div></div>
                </div>
              </>
            ) : (
              <>
                <Skull size={48} className="text-red-500 mx-auto mb-3" />
                <h2 className="text-3xl font-black text-red-400 mb-2" style={{ textShadow: "0 0 20px rgba(220,38,38,0.8)" }}>ELIMINADO!</h2>
                <div className="text-center"><div className="text-2xl font-black text-green-400">+30</div><div className="text-xs text-slate-400">XP (participação)</div></div>
              </>
            )}
            <p className="text-slate-500 text-xs mt-4 animate-pulse">Retornando ao mapa em 5s...</p>
          </div>
        </div>
      )}
    </div>
  );
};


