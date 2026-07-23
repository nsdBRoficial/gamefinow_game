/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GameFiNow - Titles & Name Styles Registry
 * Management of unlockable player titles, quest badges, and custom name display formatting.
 */

export interface TitleDefinition {
  id: string;
  title: string;
  category: "Missão" | "Outfit" | "Conquista" | "VIP";
  icon: string;
  description: string;
  requiredQuestId?: string;
  requiredOutfitId?: string;
  isDefault?: boolean;
}

export const TITLES_REGISTRY: TitleDefinition[] = [
  // QUEST TITLES
  {
    id: "naufrago",
    title: "Náufrago Recém-Chegado",
    category: "Missão",
    icon: "🌊",
    description: "Título concedido a todos os aventureiros ao chegarem na Ilha de Stellar.",
    isDefault: true,
  },
  {
    id: "iniciado_stellar",
    title: "Iniciado de Stellar",
    category: "Missão",
    icon: "📜",
    description: "Desbloqueado ao concluir a primeira missão de criação da Carteira On-Chain.",
    requiredQuestId: "wallet",
  },
  {
    id: "operador_onramp",
    title: "Operador On-Ramp",
    category: "Missão",
    icon: "💳",
    description: "Desbloqueado ao realizar a conversão Fiat/Crypto via ponte de On-Ramp.",
    requiredQuestId: "onramp",
  },
  {
    id: "alquimista_soroban",
    title: "Alquimista do Soroban",
    category: "Missão",
    icon: "🧪",
    description: "Desbloqueado ao interagir com Smart Contracts e fazer trocas no ecossistema Soroban.",
    requiredQuestId: "soroban",
  },
  {
    id: "heroi_stellar",
    title: "Herói Lendário de Stellar",
    category: "VIP",
    icon: "👑",
    description: "Desbloqueado ao obter acesso completo ao Cofre do Holder VIP.",
    requiredQuestId: "hold",
  },

  // OUTFIT TITLES
  {
    id: "cyber_ninja_title",
    title: "Cyber Ninja ⚡",
    category: "Outfit",
    icon: "🥷",
    description: "Conquistado ao equipar o traje Cyberpunk Ninja.",
    requiredOutfitId: "cyber_ninja",
  },
  {
    id: "archmage_title",
    title: "Arquimago Soroban 🔮",
    category: "Outfit",
    icon: "🔮",
    description: "Conquistado ao equipar a túnica de Soroban Archmage.",
    requiredOutfitId: "soroban_archmage",
  },
  {
    id: "valkyrie_title",
    title: "Rainha Valquíria 🪽",
    category: "Outfit",
    icon: "🪽",
    description: "Conquistado ao equipar o traje de Valquíria Real.",
    requiredOutfitId: "valkyrie_warrior",
  },
  {
    id: "ceo_title",
    title: "CEO da Blockchain 💼",
    category: "Outfit",
    icon: "💼",
    description: "Conquistado ao vestir o terno executivo Stellar CEO.",
    requiredOutfitId: "executive_suit",
  },
  {
    id: "gold_knight_title",
    title: "Cavaleiro de Ouro 🌟",
    category: "Outfit",
    icon: "🌟",
    description: "Conquistado ao vestir a armadura de Ouro maciço 24k.",
    requiredOutfitId: "golden_knight",
  },
  {
    id: "pirate_title",
    title: "Capitão dos Sete Mares 🏴‍☠️",
    category: "Outfit",
    icon: "🏴‍☠️",
    description: "Conquistado ao equipar o traje Pirata Stellar.",
    requiredOutfitId: "stellar_pirate",
  },
];

/**
 * Returns array of unlocked title definitions based on player quest status and owned outfits.
 */
export function getUnlockedTitles(
  questsState: Record<string, any> = {},
  ownedOutfits: string[] = []
): TitleDefinition[] {
  return TITLES_REGISTRY.filter((item) => {
    if (item.isDefault) return true;
    if (item.requiredQuestId && questsState[item.requiredQuestId]?.status === "completed") return true;
    if (item.requiredOutfitId && ownedOutfits.includes(item.requiredOutfitId)) return true;
    return false;
  });
}

export type NameStyle = "prefix" | "suffix" | "badge" | "plain";

/**
 * Formats a player name with their active title according to chosen style.
 */
export function formatPlayerNameWithTitle(
  name: string,
  activeTitle?: string,
  style: NameStyle = "badge"
): string {
  if (!activeTitle || style === "plain") {
    return name;
  }

  // Strip emoji from title if needed or keep for badge
  if (style === "prefix") {
    return `[${activeTitle}] ${name}`;
  }
  if (style === "suffix") {
    return `${name}, o ${activeTitle}`;
  }
  if (style === "badge") {
    return `👑 ${name} | ${activeTitle}`;
  }

  return name;
}
