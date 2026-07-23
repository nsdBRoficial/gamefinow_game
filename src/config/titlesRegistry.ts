/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GameFiNow - Official Quest Titles & Color Styles Registry
 * Manages the 4 official quest progression titles and their colors (Cyan, Gold, Purple, Neon Green).
 */

export interface QuestTitleDefinition {
  id: string;
  title: string;
  questId?: string;
  icon: string;
  colorName: string;
  hexColor: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  description: string;
}

export const QUEST_TITLES: QuestTitleDefinition[] = [
  {
    id: "naufrago",
    title: "Náufrago Recém-Chegado",
    icon: "🌊",
    colorName: "Cinza Slate",
    hexColor: "#94a3b8",
    textClass: "text-slate-300",
    borderClass: "border-slate-700",
    bgClass: "bg-slate-900/60",
    description: "Estilo padrão concedido ao desembarcar na Ilha de Stellar.",
  },
  {
    id: "iniciado_stellar",
    title: "Iniciado de Stellar",
    questId: "wallet",
    icon: "📜",
    colorName: "Ciano Reluzente",
    hexColor: "#38bdf8",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500",
    bgClass: "bg-cyan-950/60",
    description: "Desbloqueado ao concluir a Missão 1 (Carteira On-Chain).",
  },
  {
    id: "operador_onramp",
    title: "Operador On-Ramp",
    questId: "onramp",
    icon: "💳",
    colorName: "Dourado Nobre",
    hexColor: "#facc15",
    textClass: "text-amber-400",
    borderClass: "border-amber-500",
    bgClass: "bg-amber-950/60",
    description: "Desbloqueado ao concluir a Missão 2 (Fiat On-Ramp).",
  },
  {
    id: "alquimista_soroban",
    title: "Alquimista do Soroban",
    questId: "soroban",
    icon: "🧪",
    colorName: "Roxo Místico",
    hexColor: "#a855f7",
    textClass: "text-purple-400",
    borderClass: "border-purple-500",
    bgClass: "bg-purple-950/60",
    description: "Desbloqueado ao concluir a Missão 3 (Smart Contracts Soroban).",
  },
  {
    id: "heroi_stellar",
    title: "Herói Lendário de Stellar",
    questId: "hold",
    icon: "👑",
    colorName: "Verde Elétrico Matrix",
    hexColor: "#00ff66",
    textClass: "text-[#00ff66]",
    borderClass: "border-[#00ff66]",
    bgClass: "bg-emerald-950/60",
    description: "Desbloqueado ao concluir a Missão 4 (Cofre Holder VIP).",
  },
];

/**
 * Returns available titles unlocked by the player's quest progress.
 */
export function getUnlockedQuestTitles(questsState: Record<string, any> = {}): QuestTitleDefinition[] {
  return QUEST_TITLES.filter((item) => {
    if (!item.questId) return true; // Default title
    return questsState[item.questId]?.status === "completed";
  });
}
