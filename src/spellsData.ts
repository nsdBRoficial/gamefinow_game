/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerClassId } from "./types";

export interface ClassSpell {
  id: string;
  name: string;
  icon: string;
  classId: PlayerClassId | "universal";
  shortcutKey: string; // "1", "2", "3", "4", "5"
  mpCost: number;
  gcdMs: number;
  type: "heal" | "damage" | "buff" | "teleport" | "aoe";
  element: "physical" | "fire" | "lightning" | "ice" | "holy";
  basePower: number;
  description: string;
  animationType: "heal" | "fire" | "lightning";
  buffToApply?: {
    id: string;
    name: string;
    icon: string;
    durationMs: number;
    statModifiers: {
      strBonus?: number;
      intBonus?: number;
      agiBonus?: number;
      resBonus?: number;
      faithBonus?: number;
      speedMultiplier?: number;
      damageReduction?: number;
      hpRegenPerSec?: number;
      mpRegenPerSec?: number;
      invulnerable?: boolean;
    };
  };
}

export const CLASS_SPELLS: Record<PlayerClassId | "universal", ClassSpell[]> = {
  universal: [
    {
      id: "spell_univ_heal",
      name: "Bênção da Fonte",
      icon: "💖",
      classId: "universal",
      shortcutKey: "1",
      mpCost: 15,
      gcdMs: 800,
      type: "heal",
      element: "holy",
      basePower: 25,
      description: "Restaura 25% do HP máximo usando a energia da fonte.",
      animationType: "heal",
    },
    {
      id: "spell_univ_fire",
      name: "Chama de Fótons",
      icon: "🔥",
      classId: "universal",
      shortcutKey: "2",
      mpCost: 20,
      gcdMs: 1500,
      type: "damage",
      element: "fire",
      basePower: 35,
      description: "Dispara uma bola de fogo que causa dano médio a distância.",
      animationType: "fire",
    },
    {
      id: "spell_univ_lightning",
      name: "Raio Estelar",
      icon: "⚡",
      classId: "universal",
      shortcutKey: "3",
      mpCost: 30,
      gcdMs: 2500,
      type: "damage",
      element: "lightning",
      basePower: 60,
      description: "Conjura um raio fulminante do cosmos com alto dano.",
      animationType: "lightning",
    },
  ],

  warrior: [
    {
      id: "spell_warrior_slash",
      name: "Golpe Furioso",
      icon: "⚔️",
      classId: "warrior",
      shortcutKey: "1",
      mpCost: 10,
      gcdMs: 1000,
      type: "damage",
      element: "physical",
      basePower: 45,
      description: "Golpe de espada com impacto devastador baseado na Força (STR).",
      animationType: "fire",
    },
    {
      id: "spell_warrior_warcry",
      name: "Grito de Guerra",
      icon: "📢",
      classId: "warrior",
      shortcutKey: "2",
      mpCost: 15,
      gcdMs: 1200,
      type: "buff",
      element: "physical",
      basePower: 0,
      description: "Aumenta a Força em +15 e a velocidade em +20% por 15 segundos.",
      animationType: "heal",
      buffToApply: {
        id: "buff_warcry",
        name: "Fúria do Guerreiro",
        icon: "💪",
        durationMs: 15000,
        statModifiers: { strBonus: 15, speedMultiplier: 1.2 },
      },
    },
    {
      id: "spell_warrior_charge",
      name: "Investida Sísmica",
      icon: "☄️",
      classId: "warrior",
      shortcutKey: "3",
      mpCost: 25,
      gcdMs: 2000,
      type: "damage",
      element: "physical",
      basePower: 70,
      description: "Avança com força total esmagando as defesas do alvo.",
      animationType: "lightning",
    },
  ],

  soroban_mage: [
    {
      id: "spell_mage_fireball",
      name: "Meteoro Soroban",
      icon: "🔥",
      classId: "soroban_mage",
      shortcutKey: "1",
      mpCost: 20,
      gcdMs: 1200,
      type: "damage",
      element: "fire",
      basePower: 50,
      description: "Feitiço de fogo de longo alcance potencializado pela Inteligência (INT).",
      animationType: "fire",
    },
    {
      id: "spell_mage_lightning_chain",
      name: "Raio em Cadeia",
      icon: "⚡",
      classId: "soroban_mage",
      shortcutKey: "2",
      mpCost: 35,
      gcdMs: 2000,
      type: "damage",
      element: "lightning",
      basePower: 85,
      description: "Eletrocuta o alvo com alta taxa de acerto crítico e dano concentrado.",
      animationType: "lightning",
    },
    {
      id: "spell_mage_arcane_shield",
      name: "Bastião Arcano",
      icon: "🔮",
      classId: "soroban_mage",
      shortcutKey: "3",
      mpCost: 25,
      gcdMs: 1500,
      type: "buff",
      element: "holy",
      basePower: 0,
      description: "Cria uma barreira mágica que reduz o dano sofrido em 40% por 20 segundos.",
      animationType: "heal",
      buffToApply: {
        id: "buff_arcane_shield",
        name: "Escudo Arcano",
        icon: "🔮",
        durationMs: 20000,
        statModifiers: { damageReduction: 0.40, intBonus: 20 },
      },
    },
  ],

  cosmic_ranger: [
    {
      id: "spell_ranger_pierce",
      name: "Tiro Perfurante",
      icon: "🏹",
      classId: "cosmic_ranger",
      shortcutKey: "1",
      mpCost: 12,
      gcdMs: 1000,
      type: "damage",
      element: "physical",
      basePower: 40,
      description: "Flecha ultra-veloz que ignora 30% da armadura inimiga.",
      animationType: "fire",
    },
    {
      id: "spell_ranger_shadow_step",
      name: "Passo Sombrio",
      icon: "👟",
      classId: "cosmic_ranger",
      shortcutKey: "2",
      mpCost: 18,
      gcdMs: 1200,
      type: "buff",
      element: "physical",
      basePower: 0,
      description: "Aumenta a velocidade em +30% e a Agilidade em +25 por 15 segundos.",
      animationType: "heal",
      buffToApply: {
        id: "buff_shadow_step",
        name: "Passo Sombrio",
        icon: "👟",
        durationMs: 15000,
        statModifiers: { speedMultiplier: 1.3, agiBonus: 25 },
      },
    },
    {
      id: "spell_ranger_photon_rain",
      name: "Chuva de Fótons",
      icon: "✨",
      classId: "cosmic_ranger",
      shortcutKey: "3",
      mpCost: 30,
      gcdMs: 2200,
      type: "damage",
      element: "holy",
      basePower: 75,
      description: "Chuva luminosa de projéteis cósmicos que inflige dano massivo.",
      animationType: "lightning",
    },
  ],

  network_guardian: [
    {
      id: "spell_guardian_solar_judgment",
      name: "Julgamento Solar",
      icon: "☀️",
      classId: "network_guardian",
      shortcutKey: "1",
      mpCost: 20,
      gcdMs: 1400,
      type: "damage",
      element: "holy",
      basePower: 45,
      description: "Golpe sagrado que pune o inimigo com energia luminosa da rede.",
      animationType: "lightning",
    },
    {
      id: "spell_guardian_divine_heal",
      name: "Bênção da Alvorada",
      icon: "💖",
      classId: "network_guardian",
      shortcutKey: "2",
      mpCost: 25,
      gcdMs: 1000,
      type: "heal",
      element: "holy",
      basePower: 50,
      description: "Restaura 50% do HP máximo e cura aliados próximos.",
      animationType: "heal",
    },
    {
      id: "spell_guardian_divine_shield",
      name: "Aura de Invulnerabilidade",
      icon: "🛡️",
      classId: "network_guardian",
      shortcutKey: "3",
      mpCost: 40,
      gcdMs: 3000,
      type: "buff",
      element: "holy",
      basePower: 0,
      description: "Concede imunidade total a dano por 4 segundos e regenera +10 HP/s.",
      animationType: "heal",
      buffToApply: {
        id: "buff_divine_shield",
        name: "Aura Invulnerável",
        icon: "🛡️",
        durationMs: 4000,
        statModifiers: { invulnerable: true, hpRegenPerSec: 10, resBonus: 30 },
      },
    },
  ],
};

export function getSpellsForClass(classId?: PlayerClassId): ClassSpell[] {
  if (!classId) return CLASS_SPELLS.universal;
  return CLASS_SPELLS[classId] || CLASS_SPELLS.universal;
}
