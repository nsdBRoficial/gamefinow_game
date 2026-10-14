/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * pvpEngine.ts — Motor Matemático de Combate PVP (v1.5pvp)
 *
 * Módulo determinístico puro (sem React/Socket/DOM).
 * Contém toda a lógica e fórmulas matemáticas oficiais de:
 *  - Distância euclidiana e checagem de alcance (Attack Ranges)
 *  - Cálculo de dano físico e mágico balanceados por classe
 *  - Aplicação de buffs ofensivos e defensivos (até 80% de redução / invulnerabilidade)
 *  - RNG Roll (85%-115%) e Critical Hit Roll (5% base + AGI/100)
 *  - Teto de dano anti-cheat no servidor (maxReasonableDamage = level * 80)
 *
 * Executado pelo Backend (server.ts) como fonte autoritativa de verdade
 * e espelhado pelo Cliente para predição visual otimista e feedback imediato.
 */

import { ActiveBuff, PlayerClassId } from "../types";
import { ATTACK_RANGE, PvpPlayer } from "./pvpTypes";

// ── Constantes de balanceamento ───────────────────────────────────────────────

/** Dano mínimo garantido (evita 0 de dano) */
const MIN_DAMAGE = 1;

/** Multiplicador de acerto crítico */
const CRIT_MULTIPLIER = 2.0;

/** Classe → tipo de ataque físico (define o range) */
const CLASS_PHYSICAL_ATTACK_TYPE: Record<PlayerClassId | "default", keyof typeof ATTACK_RANGE> = {
  warrior:          "physical_melee",
  network_guardian: "physical_melee",
  cosmic_ranger:    "physical_ranger",
  soroban_mage:     "physical_melee", // Mage corpo a corpo é fraco — incentiva usar magia
  default:          "physical_melee",
};

// ── Cálculo de distância ──────────────────────────────────────────────────────

/**
 * Distância euclidiana entre dois jogadores na arena.
 */
export function getDistance(a: PvpPlayer, b: PvpPlayer): number {
  return Math.sqrt(
    Math.pow(a.arenaX - b.arenaX, 2) +
    Math.pow(a.arenaY - b.arenaY, 2)
  );
}

/**
 * Verifica se o atacante está dentro do range permitido para o tipo de ataque.
 *
 * @param attacker - Jogador atacante
 * @param target - Jogador alvo
 * @param attackType - Tipo de ataque (chave de ATTACK_RANGE)
 * @returns true se dentro do range, false se fora
 */
export function isInRange(
  attacker: PvpPlayer,
  target: PvpPlayer,
  attackType: keyof typeof ATTACK_RANGE
): boolean {
  const maxRange = ATTACK_RANGE[attackType];
  const dist = getDistance(attacker, target);
  return dist <= maxRange;
}

/**
 * Determina o tipo de ataque físico com base na classe do atacante.
 */
export function getPhysicalAttackType(playerClass?: PlayerClassId): keyof typeof ATTACK_RANGE {
  if (!playerClass) return "physical_melee";
  return CLASS_PHYSICAL_ATTACK_TYPE[playerClass] ?? "physical_melee";
}

// ── RNG e Crítico ─────────────────────────────────────────────────────────────

/**
 * Gera o multiplicador de variação aleatória do dano (85%–115%).
 * Mesmo sistema usado no PvE (DOC_EVOLUCAO_E_DROPS.md).
 */
export function getDamageRoll(): number {
  return 0.85 + Math.random() * 0.3;
}

/**
 * Verifica se o ataque é crítico.
 * Chance = 5% base + (AGI / 100)%
 *
 * @param agiBonus - Bônus de agilidade do atacante (de buffs ou classe)
 */
export function isCriticalHit(agiBonus: number = 0): boolean {
  const critChance = 0.05 + agiBonus / 100;
  return Math.random() < critChance;
}

// ── Modificadores de Buff ─────────────────────────────────────────────────────

/**
 * Calcula o modificador de dano ofensivo proveniente de buffs ativos.
 * Considera strBonus para dano físico e intBonus para dano mágico.
 *
 * @param buffs - Lista de buffs ativos do atacante
 * @param type - Tipo de dano ('physical' | 'magic')
 * @returns Multiplicador total de buffs ofensivos (1.0 = sem buff)
 */
export function getOffensiveBuffMultiplier(
  buffs: ActiveBuff[],
  type: "physical" | "magic"
): number {
  let bonus = 0;
  const now = Date.now();
  for (const buff of buffs) {
    if (buff.expiresAt <= now) continue;
    if (type === "physical") {
      bonus += buff.statModifiers.strBonus ?? 0;
    } else {
      bonus += buff.statModifiers.intBonus ?? 0;
    }
  }
  return 1 + bonus / 100;
}

/**
 * Calcula o multiplicador de redução de dano dos buffs defensivos do alvo.
 *
 * @param buffs - Buffs ativos do alvo
 * @returns Fator de redução (ex: 0.7 = toma 30% menos dano)
 */
export function getDefensiveBuffFactor(buffs: ActiveBuff[]): number {
  let reduction = 0;
  const now = Date.now();
  for (const buff of buffs) {
    if (buff.expiresAt <= now) continue;
    if (buff.statModifiers.invulnerable) return 0; // Invulnerável = 0 dano
    reduction += buff.statModifiers.damageReduction ?? 0;
  }
  // Redução máxima de 80% para não tornar o tank imortal
  return Math.max(0.2, 1 - reduction);
}

// ── Cálculo de Dano Físico ────────────────────────────────────────────────────

/**
 * Calcula o dano físico de um ataque PVP.
 *
 * Fórmula (igual PvE, de DOC_ESTRATEGIA_BATALHAS.md):
 *   DanoBase = max(1, ATK × (1 + STR/100) - DEF_alvo/2)
 *   DanoFinal = DanoBase × roll × critMult × buffOff × buffDef
 *
 * @param attacker - Atacante
 * @param target - Alvo
 * @returns { damage, isCrit }
 */
export function calcPvpPhysicalDamage(
  attacker: PvpPlayer,
  target: PvpPlayer
): { damage: number; isCrit: boolean } {
  // STR bônus: soma statModifiers dos buffs ativos
  const strBonus = attacker.activeBuffs
    .filter(b => b.expiresAt > Date.now())
    .reduce((acc, b) => acc + (b.statModifiers.strBonus ?? 0), 0);

  const agiBonus = attacker.activeBuffs
    .filter(b => b.expiresAt > Date.now())
    .reduce((acc, b) => acc + (b.statModifiers.agiBonus ?? 0), 0);

  const baseAtk = attacker.attack * (1 + strBonus / 100);
  const baseDamage = Math.max(MIN_DAMAGE, baseAtk - target.defense / 2);

  const roll = getDamageRoll();
  const crit = isCriticalHit(agiBonus);
  const critMult = crit ? CRIT_MULTIPLIER : 1.0;
  const offMult = getOffensiveBuffMultiplier(attacker.activeBuffs, "physical");
  const defFactor = getDefensiveBuffFactor(target.activeBuffs);

  const finalDamage = Math.max(MIN_DAMAGE, Math.floor(
    baseDamage * roll * critMult * offMult * defFactor
  ));

  return { damage: finalDamage, isCrit: crit };
}

// ── Cálculo de Dano Mágico ────────────────────────────────────────────────────

/**
 * Calcula o dano de uma magia em combate PVP.
 *
 * Fórmula (de DOC_ESTRATEGIA_BATALHAS.md):
 *   DanoMagico = BasePower × (1 + INT/80) × roll × critMult × buffOff × buffDef
 *
 * @param attacker - Atacante
 * @param spellBasePower - Poder base da magia (ClassSpell.basePower)
 * @param target - Alvo
 * @returns { damage, isCrit }
 */
export function calcPvpMagicDamage(
  attacker: PvpPlayer,
  spellBasePower: number,
  target: PvpPlayer
): { damage: number; isCrit: boolean } {
  const intBonus = attacker.activeBuffs
    .filter(b => b.expiresAt > Date.now())
    .reduce((acc, b) => acc + (b.statModifiers.intBonus ?? 0), 0);

  const agiBonus = attacker.activeBuffs
    .filter(b => b.expiresAt > Date.now())
    .reduce((acc, b) => acc + (b.statModifiers.agiBonus ?? 0), 0);

  // INT do atacante: attack como proxy de INT para mages (simplificado)
  const intValue = attacker.attack + intBonus;
  const baseDamage = spellBasePower * (1 + intValue / 80);

  const roll = getDamageRoll();
  const crit = isCriticalHit(agiBonus);
  const critMult = crit ? CRIT_MULTIPLIER : 1.0;
  const offMult = getOffensiveBuffMultiplier(attacker.activeBuffs, "magic");
  const defFactor = getDefensiveBuffFactor(target.activeBuffs);

  const finalDamage = Math.max(MIN_DAMAGE, Math.floor(
    baseDamage * roll * critMult * offMult * defFactor
  ));

  return { damage: finalDamage, isCrit: crit };
}

// ── Intervalo de Auto-Ataque ──────────────────────────────────────────────────

/**
 * Calcula o intervalo em ms entre auto-ataques físicos.
 * Fórmula: max(400, 1500 - (AGI × 10))
 *
 * @param speed - Atributo de velocidade/agilidade do jogador
 * @param speedBuffMultiplier - Multiplicador de velocidade dos buffs
 */
export function getAttackInterval(
  speed: number,
  speedBuffMultiplier: number = 1.0
): number {
  const baseInterval = Math.max(400, 1500 - speed * 10);
  return Math.max(400, baseInterval / speedBuffMultiplier);
}

// ── Validação de Dano Máximo (Anti-Cheat) ────────────────────────────────────

/**
 * Valida se um dano recebido é razoável para o nível do atacante.
 * Rejeita valores impossíveis que possam vir de clientes adulterados.
 *
 * @param damage - Dano a validar
 * @param attackerLevel - Nível do atacante
 * @returns true se válido, false se suspeito
 */
export function isValidDamageAmount(damage: number, attackerLevel: number): boolean {
  const maxReasonableDamage = attackerLevel * 80; // Nível × 80 = teto máximo
  return damage > 0 && damage <= maxReasonableDamage;
}
