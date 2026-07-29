import { create } from "zustand";
import { GameState, Player, NPC, Quest, QuestId, WalletState, Transaction } from "../types";
import { INITIAL_QUESTS } from "../gameData";
import { encryptAES, decryptAES } from "../utils/cryptoUtils";

interface GameStore extends GameState {
  playerPos: Player;
  setGameState: (state: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => void;
  setPlayerPos: (state: Partial<Player> | ((prev: Player) => Partial<Player>)) => void;
  updateWallet: (walletUpdate: Partial<WalletState>) => void;
  addTransaction: (tx: Transaction) => void;
  completeQuest: (questId: QuestId, newStatus?: Quest["status"]) => void;
  setActiveModal: (modal: GameState["activeModal"]) => void;
  setActiveDialog: (dialog: GameState["activeDialog"]) => void;
  setBattleMode: (active: boolean) => void;
  setLockedTarget: (targetId: string | null) => void;
  addExperience: (amount: number) => void;
  castMagic: (type: "heal" | "fire" | "lightning") => void;
}

const getInitialGameState = (): GameState => {
  try {
    const saved = localStorage.getItem("stellar_island_game_state_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.quests && parsed.wallet) {
        // Decrypt secretKey if present
        if (parsed.wallet.secretKey) {
          try {
            parsed.wallet.secretKey = decryptAES(parsed.wallet.secretKey, parsed.wallet.pin);
          } catch (e) {
            console.error("Failed to decrypt secretKey on load", e);
          }
        }
        
        return {
          ...parsed,
          wallet: {
            name: "",
            email: "",
            usdwBalance: 0,
            brwBalance: 0,
            gamefiBalance: 0,
            vaultXlm: 0,
            vaultUsdw: 0,
            vaultBrw: 0,
            poolXlmUsdw: 0,
            poolUsdwBrw: 0,
            ...parsed.wallet,
          },
          activeDialog: null,
          activeModal: null,
          jamesDialogsDone: parsed.jamesDialogsDone || [],
          isBattleModeActive: parsed.isBattleModeActive || false,
          lockedTargetId: null,
        };
      }
    }
  } catch (err) {
    console.warn("Could not load gameState from localStorage", err);
  }
  return {
    wallet: {
      hasWallet: false,
      publicKey: "",
      secretKey: "",
      xlmBalance: 0,
      usdcBalance: 0,
      soroBalance: 0,
      isLocked: false,
      lockedAmount: 0,
      name: "",
      email: "",
      usdwBalance: 0,
      brwBalance: 0,
      gamefiBalance: 0,
      vaultXlm: 0,
      vaultUsdw: 0,
      vaultBrw: 0,
      poolXlmUsdw: 0,
      poolUsdwBrw: 0,
    },
    quests: INITIAL_QUESTS,
    transactions: [],
    activeDialog: null,
    activeModal: null,
    currentLedger: 6184293,
    xp_current: 0,
    level: 1,
    jamesDialogsDone: [],
    isBattleModeActive: false,
    lockedTargetId: null,
  };
};

const getInitialPlayerPos = (): Player => {
  try {
    const saved = localStorage.getItem("stellar_island_player_pos_v1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.x === "number") {
        return {
          ...parsed,
          targetX: parsed.x,
          targetY: parsed.y,
          isMoving: false,
          frame: 0,
        };
      }
    }
  } catch (err) {
    console.warn("Could not load playerPos from localStorage", err);
  }
  return {
    x: 30,
    y: 30,
    targetX: 30,
    targetY: 30,
    dir: "down",
    isMoving: false,
    frame: 0,
    headColor: "#fcd34d",
    torsoColor: "#ef4444",
    legsColor: "#2563eb",
    shoesColor: "#1e293b",
    headType: "square",
    torsoType: "plain",
    shoesType: "sneakers",
    skinColor: "#ffdbac",
    faceType: "smile",
    accessoryType: "backpack",
    name: "Anonymo",
    mapId: "center",
    gender: "male",
    headStyle: "default",
    eyeStyle: "dots",
    eyeColor: "#1e293b",
    torsoStyle: "tshirt",
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialGameState(),
  playerPos: getInitialPlayerPos(),

  setGameState: (updater) => set((state) => {
    const nextState = typeof updater === "function" ? updater(state) : updater;
    const newState = { ...state, ...nextState };
    
    // Extract only GameState properties for localStorage
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return nextState;
  }),

  setPlayerPos: (updater) => set((state) => {
    const nextPlayer = typeof updater === "function" ? updater(state.playerPos) : updater;
    const newPlayer = { ...state.playerPos, ...nextPlayer };
    
    localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(newPlayer));
    
    return { playerPos: newPlayer };
  }),

  updateWallet: (walletUpdate) => set((state) => {
    const newWallet = { ...state.wallet, ...walletUpdate };
    const newState = { ...state, wallet: newWallet };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { wallet: newWallet };
  }),

  addTransaction: (tx) => set((state) => {
    const newTxList = [tx, ...state.transactions];
    const newState = { ...state, transactions: newTxList, currentLedger: state.currentLedger + 1 };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { transactions: newTxList, currentLedger: newState.currentLedger };
  }),

  completeQuest: (questId, newStatus = "completed") => set((state) => {
    const wasAlreadyCompleted = state.quests[questId]?.status === "completed";
    
    const newQuests = {
      ...state.quests,
      [questId]: { ...state.quests[questId], status: newStatus },
    };
    
    if (questId === "wallet" && newStatus === "completed" && newQuests.onramp.status === "locked") {
      newQuests.onramp.status = "active";
    }
    if (questId === "onramp" && newStatus === "completed" && newQuests.soroban.status === "locked") {
      newQuests.soroban.status = "active";
    }
    if (questId === "soroban" && newStatus === "completed" && newQuests.hold.status === "locked") {
      newQuests.hold.status = "active";
    }

    let nextXP = state.xp_current || 0;
    if (newStatus === "completed" && !wasAlreadyCompleted) {
      nextXP += 400; // Matemática para chegar em 1600 XP (Lvl 5) em 4 missões!
    }
    const nextLevel = Math.floor(Math.pow(nextXP / 50, 0.4)) + 1;

    const newState = { ...state, quests: newQuests, xp_current: nextXP, level: nextLevel };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const { encryptAES } = require("../utils/cryptoUtils");
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { quests: newQuests };
  }),

  setActiveModal: (modal) => set({ activeModal: modal }),
  
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  
  setBattleMode: (active) => set((state) => ({ 
    isBattleModeActive: active,
    // Reset target when disabling battle mode
    lockedTargetId: active ? state.lockedTargetId : null
  })),

  setLockedTarget: (targetId) => set({ lockedTargetId: targetId }),

  addExperience: (amount) => set((state) => {
    const currentXP = (state.xp_current || 0) + amount;
    // L = floor((XP / 50)^0.4) + 1
    const newLevel = Math.floor(Math.pow(currentXP / 50, 0.4)) + 1;
    
    const newState = { ...state, xp_current: currentXP, level: newLevel };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { xp_current: currentXP, level: newLevel };
  }),

  castMagic: (type) => set((state) => {
    const mp = state.playerPos.mp ?? 50;
    const maxMp = state.playerPos.maxMp ?? 50;
    const hp = state.playerPos.hp ?? 100;
    const maxHp = state.playerPos.maxHp ?? 100;

    let mpCost = 10;
    if (type === "fire") mpCost = 15;
    if (type === "lightning") mpCost = 25;

    if (mp < mpCost) {
      console.warn(`Not enough MP for ${type}`);
      return state;
    }

    let nextHp = hp;
    if (type === "heal") {
      nextHp = Math.min(maxHp, hp + Math.floor(maxHp * 0.2));
    }

    const nextPlayerPos = {
      ...state.playerPos,
      mp: mp - mpCost,
      hp: nextHp
    };

    localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
    return { playerPos: nextPlayerPos };
  }),

}));

