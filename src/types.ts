/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string; // Transaction Hash (mocked)
  type: string;
  timestamp: string;
  amount: string;
  asset: string;
  fee: string; // Stellar fee is extremely low (e.g., 0.00001 XLM)
  memo: string;
  ledgerSequence: number;
}

export interface WalletState {
  hasWallet: boolean;
  publicKey: string;
  secretKey: string;
  xlmBalance: number;
  usdcBalance: number;
  soroBalance: number;
  isLocked: boolean;
  lockedAmount: number;
  // WalletNow SDK additions
  name?: string;
  email?: string;
  pin?: string;
  usdwBalance?: number; // WalletNow USDW Token (Stablecoin USD)
  brwBalance?: number;  // WalletNow BRW Token (Stablecoin BRL)
  vaultXlm?: number;    // WalletNow XLM Yield Vault
  vaultUsdw?: number;   // WalletNow USDW Yield Vault
  vaultBrw?: number;    // WalletNow BRW Yield Vault
  poolXlmUsdw?: number; // WalletNow Liquidity Pool (XLM-USDW)
  poolUsdwBrw?: number; // WalletNow Liquidity Pool (USDW-BRW)
}

export type QuestId = "wallet" | "onramp" | "soroban" | "hold";

export interface Quest {
  id: QuestId;
  title: string;
  description: string;
  instructions: string;
  reward: string;
  status: "locked" | "active" | "completed";
}

export interface Player {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: "up" | "down" | "left" | "right";
  isMoving: boolean;
  frame: number;
  // Character Customization parameters (quadrado personalizável: cabeça, tronco, pernas, sapatos)
  headColor: string;
  torsoColor: string;
  legsColor: string;
  shoesColor: string;
  headType: "square" | "beanie" | "helmet" | "horns";
  torsoType: "plain" | "striped" | "suit" | "hoodie";
  shoesType: "sneakers" | "boots" | "flippers";
  skinColor: string;
  faceType: "none" | "glasses" | "beard" | "eyepatch" | "smile";
  accessoryType: "none" | "backpack" | "cape" | "sword";
  name: string;
  mapId?: "center" | "east" | "west" | "north" | "south";
}

export interface NPC {
  id: string;
  name: string;
  x: number; // grid x
  y: number; // grid y
  dir: "up" | "down" | "left" | "right";
  dialogs: string[];
  activeQuestDialogs?: string[];
  completedDialogs: string[];
  questTrigger?: QuestId;
  color: string;
  accentColor: string;
  emoji: string;
}

export interface GameState {
  wallet: WalletState;
  quests: Record<QuestId, Quest>;
  transactions: Transaction[];
  activeDialog: {
    npcName: string;
    text: string[];
    currentStep: number;
    npcId: string;
  } | null;
  activeModal: "wallet" | "onramp" | "soroban" | "hold" | "atf" | null;
  currentLedger: number;
}
