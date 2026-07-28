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
  gamefiBalance?: number; // GameFiNow Native Token (GAMEFI)
  lastFaucetClaim?: number; // Timestamp (ms) do ultimo resgate na Fonte Faucet
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
  gender?: "male" | "female";
  activeOutfit?: string;
  ownedOutfits?: string[];
  activeTitle?: string;
  unlockedTitles?: string[];
  nameStyle?: "prefix" | "suffix" | "badge" | "plain";
  headColor: string;
  hairColor?: string;
  torsoColor: string;
  legsColor: string;
  shoesColor: string;
  headType: "square" | "topete" | "militar" | "beanie" | "helmet" | "horns" | "pirate" | "long_hair" | "ponytail" | "ribbon" | "bob" | "witch" | "elf_ears" | "flower_crown";
  torsoType: "plain" | "striped" | "suit" | "hoodie" | "dress" | "cyber" | "samurai" | "pirate" | "valkyrie" | "royal" | "plate_armor" | "witch_robe" | "golden_armor" | "classic" | "tshirt";
  shoesType: "sneakers" | "boots" | "flippers";
  skinColor: string;
  faceType: "none" | "glasses" | "beard" | "elder_beard" | "mustache" | "eyepatch" | "smile" | "eyelashes" | "makeup" | "visor";
  accessoryType: "none" | "backpack" | "cape" | "sword" | "wings" | "katana" | "viking_axe" | "magic_wand";
  name: string;
  mapId?: "center" | "east" | "west" | "north" | "south";
  // Campos extras usados pelo CharacterCustomizer (estilo visual avançado)
  headStyle?: string;    // Ex: "default" | "mohawk" | "cap" | "long" | "afro" | "helmet" | "crown" | "bald"
  eyeStyle?: string;     // Ex: "dots" | "sunglasses" | "vr_headset" | "visor" | "cyborg" | "anime" | "wink" | "classic"
  eyeColor?: string;     // Cor hex dos olhos
  torsoStyle?: string;   // Ex: "tshirt" | "suit" | "hoodie" | "jacket" | "cyber" | "robe" | "royal" | "dress"
  walletAddress?: string; // Alias para publicKey quando usado fora do gameState
  isGM?: boolean;
  // Combat stats (preparação para batalhas)
  level?: number;
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
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
  activeModal: "wallet" | "onramp" | "soroban" | "hold" | "atf" | "p2p_store" | "burn_altar" | "gamefi_faucet" | "outfit_shop" | null;
  currentLedger: number;
  jamesDialogsDone?: string[];
  mapZoomLevel?: number;
}
