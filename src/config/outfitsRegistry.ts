/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GameFiNow - Outfits Registry & Gated Item Management
 * Centralized catalog for player outfits, pricing, locking, and gender categorization.
 */

import { PixelCharData } from "../components/canvas/PlayerSprite";

export interface OutfitDefinition {
  id: string;
  name: string;
  category: string;
  targetGender: "male" | "female" | "unisex";
  priceXlm: number;
  isLockedByDefault: boolean; // Flag if item requires purchase/unlock in production
  isTestnetFree: boolean;     // Flag if automatically unlocked in testnet mode
  description: string;
  charData: PixelCharData;
}

export const OUTFITS_REGISTRY: OutfitDefinition[] = [
  // 1. MALE EXCLUSIVES
  {
    id: "cyber_ninja",
    name: "Cyberpunk Ninja ♂️",
    category: "Futurista",
    targetGender: "male",
    priceXlm: 2.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Visor neon incandescente, circuito de carbono reluzente no peito e espada Katana Cyber nas costas.",
    charData: {
      gender: "male",
      headType: "topete",
      headColor: "#06b6d4",
      torsoType: "cyber",
      torsoColor: "#0f172a",
      legsColor: "#1e293b",
      shoesColor: "#06b6d4",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "katana",
    },
  },
  {
    id: "viking_lord",
    name: "Viking Warlord ♂️",
    category: "Guerreiro",
    targetGender: "male",
    priceXlm: 3.5,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Chifres de guerreiro nórdico, barba trançada, armadura de placas pesadas e machado duplo de batalha.",
    charData: {
      gender: "male",
      headType: "horns",
      headColor: "#78350f",
      torsoType: "plate_armor",
      torsoColor: "#451a03",
      legsColor: "#27272a",
      shoesColor: "#18181b",
      skinColor: "#ffdbac",
      faceType: "beard",
      accessoryType: "viking_axe",
    },
  },
  {
    id: "soroban_archmage",
    name: "Soroban Archmage ♂️",
    category: "Mágico",
    targetGender: "male",
    priceXlm: 3.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Chapéu celestial de mago com estrela de ouro, barba longa de sábio e túnica mística Soroban.",
    charData: {
      gender: "male",
      headType: "beanie",
      headColor: "#1d4ed8",
      torsoType: "suit",
      torsoColor: "#1e3a8a",
      legsColor: "#1e3a8a",
      shoesColor: "#1e293b",
      skinColor: "#fce7f3",
      faceType: "elder_beard",
      accessoryType: "cape",
    },
  },
  {
    id: "executive_suit",
    name: "Stellar CEO ♂️",
    category: "Elegante",
    targetGender: "male",
    priceXlm: 2.5,
    isLockedByDefault: false,
    isTestnetFree: true,
    description: "Terno de alta costura azul marinho com colarinho duplo e gravata borboleta para negociar na rede.",
    charData: {
      gender: "male",
      headType: "topete",
      headColor: "#1e293b",
      torsoType: "suit",
      torsoColor: "#0f172a",
      legsColor: "#1e293b",
      shoesColor: "#020617",
      skinColor: "#ffdbac",
      faceType: "glasses",
      accessoryType: "backpack",
    },
  },

  // 2. FEMALE EXCLUSIVES
  {
    id: "valkyrie_warrior",
    name: "Valkyrie Queen ♀️",
    category: "Mítico",
    targetGender: "female",
    priceXlm: 3.5,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Peitoral prateado reluzente, asas angelicais iluminadas, coroa de flores e detalhes em magenta.",
    charData: {
      gender: "female",
      headType: "flower_crown",
      headColor: "#f472b6",
      torsoType: "valkyrie",
      torsoColor: "#ec4899",
      legsColor: "#be185d",
      shoesColor: "#831843",
      skinColor: "#ffe4e6",
      faceType: "eyelashes",
      accessoryType: "wings",
    },
  },
  {
    id: "starlight_witch",
    name: "Starlight Sorceress ♀️",
    category: "Mágico",
    targetGender: "female",
    priceXlm: 3.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Chapéu de maga da noite com túnica mística, cinto de poções e varinha mágica com cristal de mana.",
    charData: {
      gender: "female",
      headType: "witch",
      headColor: "#6d28d9",
      torsoType: "witch_robe",
      torsoColor: "#4c1d95",
      legsColor: "#3b0764",
      shoesColor: "#1e1b4b",
      skinColor: "#fce7f3",
      faceType: "makeup",
      accessoryType: "magic_wand",
    },
  },
  {
    id: "cyber_heroine",
    name: "Cyberpunk Heroine ♀️",
    category: "Futurista",
    targetGender: "female",
    priceXlm: 2.5,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Cabelo rabo de cavalo azul neon, jaqueta cyber tecnológica com LED e espada Katana ajustada.",
    charData: {
      gender: "female",
      headType: "ponytail",
      headColor: "#38bdf8",
      torsoType: "cyber",
      torsoColor: "#0284c7",
      legsColor: "#0f172a",
      shoesColor: "#38bdf8",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "katana",
    },
  },
  {
    id: "elven_princess",
    name: "Elven Princess ♀️",
    category: "Lendário",
    targetGender: "female",
    priceXlm: 4.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Orelhas delicadas de elfa, longo cabelo dourado e vestido de gala royal com saia rodada em camadas.",
    charData: {
      gender: "female",
      headType: "elf_ears",
      headColor: "#f59e0b",
      torsoType: "dress",
      torsoColor: "#10b981",
      legsColor: "#047857",
      shoesColor: "#065f46",
      skinColor: "#ffdbac",
      faceType: "eyelashes",
      accessoryType: "wings",
    },
  },

  // 3. UNISEX / GLOBAL OUT_FITS
  {
    id: "golden_knight",
    name: "Golden VIP Knight 🌟",
    category: "Lendário",
    targetGender: "unisex",
    priceXlm: 5.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Armadura completa de ouro 24k entalhada a mão com ombreiras maciças e asas douradas radiantes.",
    charData: {
      headType: "helmet",
      headColor: "#eab308",
      torsoType: "golden_armor",
      torsoColor: "#ca8a04",
      legsColor: "#eab308",
      shoesColor: "#78350f",
      skinColor: "#ffdbac",
      faceType: "none",
      accessoryType: "wings",
    },
  },
  {
    id: "astro_explorer",
    name: "Astro Explorer 🌟",
    category: "Espacial",
    targetGender: "unisex",
    priceXlm: 2.5,
    isLockedByDefault: false,
    isTestnetFree: true,
    description: "Traje pressurizado de exploração intergaláctica com capacete reflexivo e mochila de oxigênio.",
    charData: {
      headType: "helmet",
      headColor: "#f8fafc",
      torsoType: "suit",
      torsoColor: "#e2e8f0",
      legsColor: "#64748b",
      shoesColor: "#0f172a",
      skinColor: "#ffdbac",
      faceType: "visor",
      accessoryType: "backpack",
    },
  },
  {
    id: "stellar_pirate",
    name: "Stellar Pirate 🌟",
    category: "Exótico",
    targetGender: "unisex",
    priceXlm: 2.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Capitão pirata com colete de couro, fivela de ouro central, tapa-olho e cimitarra afiada.",
    charData: {
      headType: "pirate",
      headColor: "#0f172a",
      torsoType: "pirate",
      torsoColor: "#1e293b",
      legsColor: "#020617",
      shoesColor: "#451a03",
      skinColor: "#8d5524",
      faceType: "eyepatch",
      accessoryType: "sword",
    },
  },
  {
    id: "royal_emperor",
    name: "Royal Emperor 🌟",
    category: "VIP Supremo",
    targetGender: "unisex",
    priceXlm: 10.0,
    isLockedByDefault: true,
    isTestnetFree: true,
    description: "Manto imperial aveludado em roxo real com gola bordada a ouro e coroa flutuante de autoridade.",
    charData: {
      headType: "horns",
      headColor: "#fbbf24",
      torsoType: "royal",
      torsoColor: "#7e22ce",
      legsColor: "#581c87",
      shoesColor: "#eab308",
      skinColor: "#ffdbac",
      faceType: "smile",
      accessoryType: "cape",
    },
  },
];

/**
 * Helper to check if an outfit is unlocked for a given player.
 * In Testnet or if isTestnetFree is true, all items are accessible, while honoring owned status.
 */
export function isOutfitUnlocked(
  outfitId: string,
  ownedOutfits: string[] = [],
  isTestnet: boolean = true
): boolean {
  const definition = OUTFITS_REGISTRY.find((o) => o.id === outfitId);
  if (!definition) return true; // Default fallback

  if (ownedOutfits.includes(outfitId)) return true;
  if (!definition.isLockedByDefault) return true;
  if (isTestnet && definition.isTestnetFree) return true;

  return false;
}

export function getOutfitById(outfitId: string): OutfitDefinition | undefined {
  return OUTFITS_REGISTRY.find((o) => o.id === outfitId);
}
