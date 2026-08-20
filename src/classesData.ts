/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerClass, PlayerClassId } from "./types";

export const CLASS_CHANGE_COST_GAMEFI = 10;

export const CLASSES_CATALOG: Record<PlayerClassId, PlayerClass> = {
  warrior: {
    id: "warrior",
    name: "Guerreiro Estelar",
    icon: "⚔️",
    role: "Melee / Tanker Físico",
    description: "Mestre no combate corpo a corpo, armado com espadas pesadas e armadura impenetrável.",
    strMod: 1.6,   // +60% Força
    intMod: 0.8,   // -20% Inteligência
    agiMod: 1.1,   // +10% Agilidade
    resMod: 1.4,   // +40% Resistência
    faithMod: 1.0, // Base
    passiveName: "Pele de Aço",
    passiveDesc: "Reduz 15% de todo dano físico sofrido e ganha +25% de HP máximo base.",
  },
  soroban_mage: {
    id: "soroban_mage",
    name: "Alquimista Soroban",
    icon: "🧙‍♂️",
    role: "Caster / Dano Mágico em Área",
    description: "Canalizador dos contratos inteligentes de Soroban, conjurando magias arcanas devastadoras.",
    strMod: 0.8,   // -20% Força
    intMod: 1.8,   // +80% Inteligência
    agiMod: 1.1,   // +10% Agilidade
    resMod: 0.8,   // -20% Resistência
    faithMod: 1.3, // +30% Fé Stellar
    passiveName: "Sobrecarga Arcana",
    passiveDesc: "Acertos críticos com feitiços restauram 20% do MP e aumentam o dano mágico em +20%.",
  },
  cosmic_ranger: {
    id: "cosmic_ranger",
    name: "Caçador Cósmico",
    icon: "🏹",
    role: "Ranged DPS / Crítico e Evasão",
    description: "Atirador veloz que ataca à distância com alta taxa de acerto crítico e reflexos aprimorados.",
    strMod: 1.3,   // +30% Força
    intMod: 1.0,   // Base
    agiMod: 1.7,   // +70% Agilidade
    resMod: 0.9,   // -10% Resistência
    faithMod: 1.0, // Base
    passiveName: "Passo Ligeiro",
    passiveDesc: "+15% de velocidade de corrida no grid e +12% de chance de esquiva contra ataques inimigos.",
  },
  network_guardian: {
    id: "network_guardian",
    name: "Guardião da Rede",
    icon: "🛡️",
    role: "Paladino / Suporte e Regeneração",
    description: "Protetor devoto da segurança da rede Stellar, abençoado com grande poder de cura e defesa.",
    strMod: 1.2,   // +20% Força
    intMod: 1.1,   // +10% Inteligência
    agiMod: 0.9,   // -10% Agilidade
    resMod: 1.5,   // +50% Resistência
    faithMod: 1.6, // +60% Fé Stellar
    passiveName: "Aura Sagrada",
    passiveDesc: "Regenera +3 HP/s continuamente e dobra o efeito de todas as poções e magias de cura.",
  },
};

/**
 * Calcula os atributos finais do jogador aplicando os modificadores da classe e buffs ativos
 */
export function calculateEffectiveStats(
  baseCompletedQuests: number,
  playerClassId?: PlayerClassId,
  activeBuffs: import("./types").ActiveBuff[] = []
) {
  const baseStr = 12 + baseCompletedQuests * 3;
  const baseInt = 10 + baseCompletedQuests * 6;
  const baseAgi = 11 + baseCompletedQuests * 2;
  const baseRes = 10 + baseCompletedQuests * 4;
  const baseFaith = 20 + baseCompletedQuests * 12;

  const playerClass = playerClassId ? CLASSES_CATALOG[playerClassId] : null;

  // Aplica multiplicador de classe se houver
  let str = Math.round(baseStr * (playerClass?.strMod ?? 1.0));
  let int = Math.round(baseInt * (playerClass?.intMod ?? 1.0));
  let agi = Math.round(baseAgi * (playerClass?.agiMod ?? 1.0));
  let res = Math.round(baseRes * (playerClass?.resMod ?? 1.0));
  let faith = Math.round(baseFaith * (playerClass?.faithMod ?? 1.0));

  let speedMultiplier = 1.0;
  let damageReduction = 0;
  let hpRegenBonus = 0;
  let mpRegenBonus = 0;
  let isInvulnerable = false;

  const now = Date.now();
  for (const buff of activeBuffs) {
    if (buff.expiresAt > now) {
      if (buff.statModifiers.strBonus) str += buff.statModifiers.strBonus;
      if (buff.statModifiers.intBonus) int += buff.statModifiers.intBonus;
      if (buff.statModifiers.agiBonus) agi += buff.statModifiers.agiBonus;
      if (buff.statModifiers.resBonus) res += buff.statModifiers.resBonus;
      if (buff.statModifiers.faithBonus) faith += buff.statModifiers.faithBonus;
      if (buff.statModifiers.speedMultiplier) speedMultiplier *= buff.statModifiers.speedMultiplier;
      if (buff.statModifiers.damageReduction) damageReduction += buff.statModifiers.damageReduction;
      if (buff.statModifiers.hpRegenPerSec) hpRegenBonus += buff.statModifiers.hpRegenPerSec;
      if (buff.statModifiers.mpRegenPerSec) mpRegenBonus += buff.statModifiers.mpRegenPerSec;
      if (buff.statModifiers.invulnerable) isInvulnerable = true;
    }
  }

  // Se classe for Guardião, bônus passivo de regeneração
  if (playerClassId === "network_guardian") {
    hpRegenBonus += 3;
  }

  return {
    str,
    int,
    agi,
    res,
    faith,
    speedMultiplier,
    damageReduction,
    hpRegenBonus,
    mpRegenBonus,
    isInvulnerable,
  };
}
