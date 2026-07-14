/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string; // Transaction Hash (mocked)
  type: "CREATE_ACCOUNT" | "ON_RAMP_PIX" | "ON_RAMP_CARD" | "SWAP_SOROBAN" | "LOCK_HOLD";
  timestamp: string;
  amount: string;
  asset: "XLM" | "USDC" | "SORO";
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
  activeModal: "wallet" | "onramp" | "soroban" | "hold" | null;
  currentLedger: number;
}
