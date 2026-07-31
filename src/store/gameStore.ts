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
  registerKill: (creatureName: string, mapId: string) => { questCompleted: boolean; questId?: QuestId; xpGained?: number; dropItemId?: string };
  castMagic: (type: "heal" | "fire" | "lightning") => void;
  buyPotions: (type: "health" | "mana") => void;
  usePotion: (type: "health" | "mana") => void;
  addItemToInventory: (itemId: string, type: "consumable" | "material" | "currency" | "tool", quantity: number) => void;
  addActiveAnimation: (anim: import("../types").AnimationEvent) => void;
  removeActiveAnimation: (id: string) => void;
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
    inventory: [],
    activeAnimations: [],
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
    let nextLevel = Math.floor(Math.pow(nextXP / 50, 0.4)) + 1;
    let isLevelingUp = false;

    if (newStatus === "completed" && !wasAlreadyCompleted) {
      if (questId === "wallet" || questId === "onramp" || questId === "soroban" || questId === "hold") {
        // Force level up sequence for onboarding quests: Lvl 2, Lvl 3, Lvl 4, Lvl 5
        const targetLevel = (questId === "wallet") ? 2 : (questId === "onramp") ? 3 : (questId === "soroban") ? 4 : 5;
        if (nextLevel < targetLevel) {
          nextLevel = targetLevel;
          // Calculate exact XP needed for this level
          nextXP = Math.ceil(50 * Math.pow(targetLevel - 1, 2.5));
          isLevelingUp = true;
        }
      } else {
        // Normal quests give flat XP
        nextXP += 400; 
        const calcLevel = Math.floor(Math.pow(nextXP / 50, 0.4)) + 1;
        if (calcLevel > nextLevel) {
          nextLevel = calcLevel;
          isLevelingUp = true;
        }
      }
    }

    let nextPlayerPos = { ...state.playerPos };
    if (nextLevel > (state.level || 1)) {
      isLevelingUp = true;
      nextPlayerPos.maxHp = 100 + ((nextLevel - 1) * 25);
      nextPlayerPos.hp = nextPlayerPos.maxHp;
      nextPlayerPos.maxMp = 50 + ((nextLevel - 1) * 10);
      nextPlayerPos.mp = nextPlayerPos.maxMp;
      localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
    }

    const newState = { ...state, quests: newQuests, xp_current: nextXP, level: nextLevel, playerPos: nextPlayerPos, pendingLevelUp: state.pendingLevelUp || isLevelingUp };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const { encryptAES } = require("../utils/cryptoUtils");
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { quests: newQuests, xp_current: nextXP, level: nextLevel, playerPos: nextPlayerPos, pendingLevelUp: newState.pendingLevelUp };
  }),

  setActiveModal: (modal) => set({ activeModal: modal }),
  
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  
  setBattleMode: (active) => set((state) => ({ 
    isBattleModeActive: active,
    // Reset target when disabling battle mode
    lockedTargetId: active ? state.lockedTargetId : null
  })),

  setLockedTarget: (targetId) => set({ lockedTargetId: targetId }),

  // ─── Registro de Kill para Kill Quests ──────────────────────────────────────
  registerKill: (creatureName, mapId) => {
    let result: { questCompleted: boolean; questId?: QuestId; xpGained?: number; dropItemId?: string } = { questCompleted: false };

    const state = useGameStore.getState();
    const quests = state.quests;

    // Encontra a kill quest que corresponde a esta criatura + mapa
    const killQuestIds: QuestId[] = ["kill_center", "kill_north", "kill_east", "kill_west", "kill_south"];
    const matchingQuestId = killQuestIds.find((id) => {
      const q = quests[id];
      return (
        q &&
        q.status !== "completed" &&
        q.targetCreature === creatureName &&
        q.targetMap === mapId
      );
    });

    if (!matchingQuestId) return result;

    const quest = quests[matchingQuestId];
    const newKillCount = (quest.killCount || 0) + 1;
    const killGoal = quest.killGoal || 5;
    const isComplete = newKillCount >= killGoal;

    const updatedQuest = {
      ...quest,
      killCount: newKillCount,
      status: isComplete ? ("completed" as const) : quest.status,
    };

    const newQuests = { ...quests, [matchingQuestId]: updatedQuest };
    result = { questCompleted: isComplete, questId: matchingQuestId };

    if (isComplete) {
      // Concede XP
      const xpToAdd = quest.xpReward || 200;
      result.xpGained = xpToAdd;
      result.dropItemId = quest.dropItemId;

      const currentXP = (state.xp_current || 0) + xpToAdd;
      const newLevel = Math.floor(Math.pow(currentXP / 50, 0.4)) + 1;

      let isLevelingUp = false;
      let nextPlayerPos = { ...state.playerPos };
      if (newLevel > (state.level || 1)) {
        isLevelingUp = true;
        nextPlayerPos.maxHp = 100 + ((newLevel - 1) * 25);
        nextPlayerPos.hp = nextPlayerPos.maxHp;
        nextPlayerPos.maxMp = 50 + ((newLevel - 1) * 10);
        nextPlayerPos.mp = nextPlayerPos.maxMp;
        localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
      }

      // Adiciona drop ao inventário
      if (quest.dropItemId) {
        state.addItemToInventory(quest.dropItemId, "material", 1);
      }

      // ── Progressão Sequencial das Kill Quests: center→east→north→west→south ──
      const killSequence: QuestId[] = ["kill_center", "kill_east", "kill_north", "kill_west", "kill_south"];
      const currentSeqIdx = killSequence.indexOf(matchingQuestId);
      if (currentSeqIdx !== -1 && currentSeqIdx < killSequence.length - 1) {
        const nextKillQuestId = killSequence[currentSeqIdx + 1];
        if (newQuests[nextKillQuestId]?.status === "locked") {
          // Fica locked até o jogador confirmar com James — deixamos como "pending_unlock"
          // A confirmação com James ativa através de jamesDialogsDone (handled in App.tsx)
          // Por ora, marcamos como "locked" mas adicionamos a flag no store para o James saber
          newQuests[nextKillQuestId] = { ...newQuests[nextKillQuestId], pendingActivation: true };
        }
      }

      useGameStore.setState((s) => ({
        quests: newQuests,
        xp_current: currentXP,
        level: newLevel,
        playerPos: nextPlayerPos,
        pendingLevelUp: s.pendingLevelUp || isLevelingUp,
      }));
    } else {
      // Apenas atualiza o progresso
      useGameStore.setState({ quests: newQuests });
    }

    // Persiste no localStorage
    try {
      const saved = localStorage.getItem("stellar_island_game_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.quests = { ...(parsed.quests || {}), [matchingQuestId]: updatedQuest };
        localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(parsed));
      }
    } catch { /* silently ignore */ }

    return result;
  },

  addExperience: (amount) => set((state) => {
    const currentXP = (state.xp_current || 0) + amount;
    // L = floor((XP / 50)^0.4) + 1
    const newLevel = Math.floor(Math.pow(currentXP / 50, 0.4)) + 1;
    
    let isLevelingUp = false;
    let nextPlayerPos = { ...state.playerPos };
    if (newLevel > (state.level || 1)) {
      isLevelingUp = true;
      nextPlayerPos.maxHp = 100 + ((newLevel - 1) * 25);
      nextPlayerPos.hp = nextPlayerPos.maxHp;
      nextPlayerPos.maxMp = 50 + ((newLevel - 1) * 10);
      nextPlayerPos.mp = nextPlayerPos.maxMp;
      localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
    }

    const newState = { ...state, xp_current: currentXP, level: newLevel, playerPos: nextPlayerPos, pendingLevelUp: state.pendingLevelUp || isLevelingUp };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { xp_current: currentXP, level: newLevel, playerPos: nextPlayerPos, pendingLevelUp: newState.pendingLevelUp };
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

    let startX = state.playerPos.x;
    let startY = state.playerPos.y;

    if (type !== "heal" && state.lockedTargetId) {
      // Find target pos from DOM or we just use a generic target position logic if we had it in state
      // Since creatures aren't in this Zustand store, we'll emit the player's position but with target flag
      // Wait, let's just leave startX/startY as the player if we don't have the mob pos here.
      // We can pass targetX/targetY if we knew them. We will need to look them up.
      // Actually, we can just dispatch an event, or better, we can modify MapRenderer to draw at the lockedTarget position directly.
    }

    const newAnim: import("../types").AnimationEvent = {
      id: `anim_${Date.now()}_${Math.random()}`,
      type,
      startX: startX,
      startY: startY,
      targetId: type !== "heal" ? state.lockedTargetId : null,
      timestamp: Date.now(),
      duration: type === "heal" ? 1000 : 600
    };

    localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
    return { playerPos: nextPlayerPos, activeAnimations: [...(state.activeAnimations || []), newAnim] };
  }),

  addItemToInventory: (itemId, type, quantity) => set((state) => {
    const currentInventory = [...(state.inventory || [])];
    let remaining = quantity;

    // Try to stack in existing slots first
    for (const slot of currentInventory) {
      if (slot.id === itemId && slot.quantity < 99) {
        const space = 99 - slot.quantity;
        if (remaining <= space) {
          slot.quantity += remaining;
          remaining = 0;
          break;
        } else {
          slot.quantity = 99;
          remaining -= space;
        }
      }
    }

    // Create new slots for remainder
    while (remaining > 0) {
      const toAdd = Math.min(99, remaining);
      currentInventory.push({ id: itemId, type, quantity: toAdd });
      remaining -= toAdd;
    }

    const newState = { ...state, inventory: currentInventory };
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, buyPotions, usePotion, addItemToInventory, addActiveAnimation, removeActiveAnimation, ...gameStateToSave } = newState;
    
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    return { inventory: currentInventory };
  }),

  buyPotions: (type) => set((state) => {
    // Deprecated for direct use, moving to FaucetModal for real transactions
    return state;
  }),

  usePotion: (type) => set((state) => {
    const currentInventory = [...(state.inventory || [])];
    const itemId = type === "health" ? "health_potion" : "mana_potion";
    
    // Find slot with potions
    const slotIndex = currentInventory.findIndex(s => s.id === itemId && s.quantity > 0);
    if (slotIndex === -1) return state; // No potions

    currentInventory[slotIndex].quantity -= 1;
    if (currentInventory[slotIndex].quantity <= 0) {
      currentInventory.splice(slotIndex, 1);
    }

    let nextPlayerPos = { ...state.playerPos };
    const maxHp = state.playerPos.maxHp ?? 100;
    const maxMp = state.playerPos.maxMp ?? 50;
    let newAnim: import("../types").AnimationEvent | null = null;

    if (type === "health") {
      nextPlayerPos.hp = Math.min(maxHp, (state.playerPos.hp ?? 0) + Math.floor(maxHp * 0.4));
      newAnim = { id: `anim_${Date.now()}_heal`, type: "heal", startX: state.playerPos.x, startY: state.playerPos.y, timestamp: Date.now(), duration: 1000 };
    }
    if (type === "mana") {
      nextPlayerPos.mp = Math.min(maxMp, (state.playerPos.mp ?? 0) + Math.floor(maxMp * 0.5));
    }

    localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(nextPlayerPos));
    
    const newState = { ...state, inventory: currentInventory, playerPos: nextPlayerPos };
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, buyPotions, usePotion, addItemToInventory, addActiveAnimation, removeActiveAnimation, ...gameStateToSave } = newState;
    
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameStateToSave));
    
    if (newAnim) {
      return { inventory: currentInventory, playerPos: nextPlayerPos, activeAnimations: [...(state.activeAnimations || []), newAnim] };
    }
    return { inventory: currentInventory, playerPos: nextPlayerPos };
  }),

  addActiveAnimation: (anim) => set((state) => ({
    activeAnimations: [...(state.activeAnimations || []), anim]
  })),

  removeActiveAnimation: (id) => set((state) => ({
    activeAnimations: (state.activeAnimations || []).filter(a => a.id !== id)
  })),

}));

