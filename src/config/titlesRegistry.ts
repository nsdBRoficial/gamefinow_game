/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GameFiNow - Official Quest Titles & Name Colors Registry
 * Manages the 5 official quest progression title colors:
 *   1. Náufrago: White (#ffffff)
 *   2. Wallet: Yellow (#ffc600)
 *   3. On-Ramp: Gold (#fbbf24)
 *   4. Soroban: Purple (#e879f9)
 *   5. Vault/Holder: Matrix Green (#00ff66)
 */

export interface QuestTitleDefinition {
  id: string;
  title: string;
  questId?: string;
  icon: string;
  colorName: string;
  hexColor: string;
  glowColor?: string;
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
    colorName: "Branco NPC",
    hexColor: "#ffffff",
    textClass: "text-white",
    borderClass: "border-slate-400",
    bgClass: "bg-slate-900/80",
    description: "Cor inicial padrão de aventureiro desembarcado.",
  },
  {
    id: "iniciado_stellar",
    title: "Iniciado de Stellar",
    questId: "wallet",
    icon: "📜",
    colorName: "Amarelo Padrão",
    hexColor: "#ffc600",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500",
    bgClass: "bg-yellow-950/80",
    description: "Desbloqueado na Missão 1 (Carteira On-Chain).",
  },
  {
    id: "operador_onramp",
    title: "Operador On-Ramp",
    questId: "onramp",
    icon: "💳",
    colorName: "Dourado Nobre",
    hexColor: "#fbbf24",
    glowColor: "#f59e0b",
    textClass: "text-amber-400",
    borderClass: "border-amber-500",
    bgClass: "bg-amber-950/80",
    description: "Desbloqueado na Missão 2 (Fiat On-Ramp).",
  },
  {
    id: "alquimista_soroban",
    title: "Alquimista do Soroban",
    questId: "soroban",
    icon: "🧪",
    colorName: "Roxo Místico",
    hexColor: "#e879f9",
    glowColor: "#d946ef",
    textClass: "text-purple-400",
    borderClass: "border-purple-500",
    bgClass: "bg-purple-950/80",
    description: "Desbloqueado na Missão 3 (Smart Contracts Soroban).",
  },
  {
    id: "heroi_stellar",
    title: "Herói Lendário de Stellar",
    questId: "hold",
    icon: "👑",
    colorName: "Verde Matrix Elétrico",
    hexColor: "#00ff66",
    glowColor: "#00e676",
    textClass: "text-[#00ff66]",
    borderClass: "border-[#00ff66]",
    bgClass: "bg-emerald-950/80",
    description: "Desbloqueado na Missão 4 (Cofre Holder VIP ao Sul).",
  },
];
