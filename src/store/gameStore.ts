import { create } from "zustand";
import { GameState, Player, NPC, Quest, QuestId, WalletState, Transaction } from "../types";
import { INITIAL_QUESTS } from "../gameData";
import { EQUIPMENT_CATALOG } from "../equipmentData";
import { encryptAES, decryptAES } from "../utils/cryptoUtils";

import { getSpellsForClass, ClassSpell } from "../spellsData";

// ── Battle Cooldown Constants ─────────────────────────────────────────────────
// GCD (Global Cooldown): bloqueia TODAS as habilidades durante a duração.
// Após lançar qualquer magia, o GCD ativo impede uso de qualquer outra magia ou poção.
export const SPELL_GCD_MS: Record<"heal" | "fire" | "lightning", number> = {
  heal:      800,   // Heal: cooldown curto (recuperação rápida)
  fire:     1500,   // Bola de Fogo: cooldown médio
  lightning: 2500,  // Raio: cooldown longo (magia mais poderosa)
};
export const POTION_GCD_MS      = 1000; // GCD adicionado ao usar uma poção
export const POTION_SELF_CD_MS  = 5000; // Cooldown próprio da poção (5s para reusar)
export const SPELL_MAX_RANGE    = 4.0;  // Range máximo de magias (tiles); monstro retalia no mesmo range

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
  setLockedTarget: (targetId: string | null, targetInfo?: import("../types").TargetInfo | null) => void;
  addExperience: (amount: number) => void;
  registerKill: (creatureName: string, mapId: string) => { questCompleted: boolean; questId?: QuestId; xpGained?: number; dropItemId?: string };
  castMagic: (type: "heal" | "fire" | "lightning") => void;
  castSpell: (spell: ClassSpell) => void;
  castSpellSlot: (slot: 1 | 2 | 3) => void;
  buyPotions: (type: "health" | "mana") => void;
  usePotion: (type: "health" | "mana") => void;
  addItemToInventory: (itemId: string, type: "consumable" | "material" | "currency" | "tool", quantity: number) => void;
  addActiveAnimation: (anim: import("../types").AnimationEvent) => void;
  removeActiveAnimation: (id: string) => void;
  buyEquipment: (itemId: string, price: number) => void;
  equipItem: (itemId: string, slot: "rightHand" | "leftHand") => void;
  unequipSlot: (slot: "rightHand" | "leftHand") => void;
  addBuff: (buff: import("../types").ActiveBuff) => void;
  removeBuff: (buffId: string) => void;
  cleanExpiredBuffs: () => void;
  setPlayerClass: (classId: import("../types").PlayerClassId) => void;
  respawnPlayer: () => void;
  killPlayer: (killerName?: string, damage?: number) => void;
  recordArenaKill: () => void;
  recordArenaDeath: () => void;
  resetArenaScore: () => void;
}

const getInitialGameState = (): GameState => {
  try {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("stellar_island_game_state_v3") : null;
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
          targetInfo: null,
          ownedEquipment: parsed.ownedEquipment || [],
          activeBuffs: parsed.activeBuffs || [],
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
    ownedEquipment: [],
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
    targetInfo: null,
    activeBuffs: [],
    arenaScore: { kills: 0, deaths: 0, streak: 0, highestStreak: 0 },
  };
};

const getInitialPlayerPos = (): Player => {
  try {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("stellar_island_player_pos_v3") : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.x === "number") {
        // Regra de segurança da Arena: Ninguém deve nascer dentro da Arena ao entrar no jogo, logar ou cair
        const isArena = parsed.mapId === "arena";
        const mapId = isArena ? "center" : (parsed.mapId || "center");
        const posX = isArena ? 30 : parsed.x;
        const posY = isArena ? 30 : parsed.y;

        return {
          ...parsed,
          mapId,
          x: posX,
          y: posY,
          targetX: posX,
          targetY: posY,
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
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    return nextState;
  }),

  setPlayerPos: (updater) => set((state) => {
    const nextPlayer = typeof updater === "function" ? updater(state.playerPos) : updater;
    const newPlayer = { ...state.playerPos, ...nextPlayer };
    // Otimização de I/O: Não faz stringify+setItem a 60 FPS. Só salva se o jogador não estiver em animação de movimento entre tiles ou mudando de mapa.
    if (!newPlayer.isMoving || newPlayer.mapId !== state.playerPos.mapId) {
      localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(newPlayer));
    }
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
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
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
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
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
      localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    }

    const newState = { ...state, quests: newQuests, xp_current: nextXP, level: nextLevel, playerPos: nextPlayerPos, pendingLevelUp: state.pendingLevelUp || isLevelingUp };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    return { quests: newQuests, xp_current: nextXP, level: nextLevel, playerPos: nextPlayerPos, pendingLevelUp: newState.pendingLevelUp };
  }),

  setActiveModal: (modal) => set({ activeModal: modal }),
  
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  
  setBattleMode: (active) => set((state) => ({ 
    isBattleModeActive: active,
    // Reset target when disabling battle mode
    lockedTargetId: active ? state.lockedTargetId : null,
    targetInfo: active ? state.targetInfo : null,
  })),

  setLockedTarget: (targetId, targetInfo = null) => set({ lockedTargetId: targetId, targetInfo }),

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
        localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
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
      const saved = localStorage.getItem("stellar_island_game_state_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.quests = { ...(parsed.quests || {}), [matchingQuestId]: updatedQuest };
        localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(parsed));
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
      localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    }

    const newState = { ...state, xp_current: currentXP, level: newLevel, playerPos: nextPlayerPos, pendingLevelUp: state.pendingLevelUp || isLevelingUp };
    
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, ...gameStateToSave } = newState;
    
    // Encrypt secretKey before saving
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    return { xp_current: currentXP, level: newLevel, playerPos: nextPlayerPos, pendingLevelUp: newState.pendingLevelUp };
  }),

  castMagic: (type) => set((state) => {
    const now = Date.now();

    // ── Verificação de GCD (Global Cooldown) ─────────────────────────────────
    // Se ainda estiver dentro do cooldown de qualquer habilidade, bloqueia o cast.
    // Sinaliza lastBlockedCastTime para o GameCanvas exibir o efeito de Exhaustion.
    if (now < (state.globalCooldownEnd ?? 0)) {
      return { lastBlockedCastTime: now };
    }

    const mp = state.playerPos.mp ?? 50;
    const maxMp = state.playerPos.maxMp ?? 50;
    const hp = state.playerPos.hp ?? 100;
    const maxHp = state.playerPos.maxHp ?? 100;

    let mpCost = 10;
    if (type === "fire") mpCost = 15;
    if (type === "lightning") mpCost = 25;

    // ── Verificação de MP ─────────────────────────────────────────────────────
    if (mp < mpCost) {
      // Sem mana suficiente — também sinaliza Exhaustion (visualmente diferente)
      return { lastBlockedCastTime: now };
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

    // ── Calcula o novo GCD com base no tipo de magia ──────────────────────────
    const gcdDuration = SPELL_GCD_MS[type];
    const nextGlobalCooldownEnd = now + gcdDuration;

    const newAnim: import("../types").AnimationEvent = {
      id: `anim_${Date.now()}_${Math.random()}`,
      type,
      startX: state.playerPos.x,
      startY: state.playerPos.y,
      targetId: type !== "heal" ? state.lockedTargetId : null,
      timestamp: now,
      duration: type === "heal" ? 1000 : 600
    };

    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    return {
      playerPos: nextPlayerPos,
      activeAnimations: [...(state.activeAnimations || []), newAnim],
      globalCooldownEnd: nextGlobalCooldownEnd,
    };
  }),

  castSpell: (spell) => set((state) => {
    const now = Date.now();
    if (now < (state.globalCooldownEnd ?? 0)) {
      return { lastBlockedCastTime: now };
    }

    const mp = state.playerPos.mp ?? 50;
    const hp = state.playerPos.hp ?? 100;
    const maxHp = state.playerPos.maxHp ?? 100;

    if (mp < spell.mpCost) {
      return { lastBlockedCastTime: now };
    }

    let nextHp = hp;
    if (spell.type === "heal") {
      const healPercent = spell.basePower / 100;
      nextHp = Math.min(maxHp, hp + Math.floor(maxHp * healPercent));
    }

    const nextPlayerPos = {
      ...state.playerPos,
      mp: mp - spell.mpCost,
      hp: nextHp,
    };

    const nextGlobalCooldownEnd = now + spell.gcdMs;

    const newAnim: import("../types").AnimationEvent = {
      id: `anim_${Date.now()}_${Math.random()}`,
      type: spell.animationType,
      startX: state.playerPos.x,
      startY: state.playerPos.y,
      targetId: spell.type !== "heal" ? state.lockedTargetId : null,
      timestamp: now,
      duration: spell.type === "heal" ? 1000 : 600,
      // Metadata da spell para cálculo de dano real no loop de combate
      spellBasePower: spell.type !== "heal" ? spell.basePower : undefined,
      spellElement: spell.element,
      spellClassId: spell.classId,
    };

    let updatedBuffs = state.activeBuffs || [];
    if (spell.buffToApply) {
      const bData = spell.buffToApply;
      const newBuff: import("../types").ActiveBuff = {
        id: bData.id,
        name: bData.name,
        icon: bData.icon,
        durationMs: bData.durationMs,
        startTime: now,
        expiresAt: now + bData.durationMs,
        statModifiers: bData.statModifiers,
      };
      updatedBuffs = [...updatedBuffs.filter((b) => b.id !== newBuff.id && b.expiresAt > now), newBuff];
    }

    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    return {
      playerPos: nextPlayerPos,
      activeAnimations: [...(state.activeAnimations || []), newAnim],
      activeBuffs: updatedBuffs,
      globalCooldownEnd: nextGlobalCooldownEnd,
    };
  }),

  castSpellSlot: (slot) => {
    const state = useGameStore.getState();
    const classId = state.playerPos.playerClass || state.playerClass;
    const spells = getSpellsForClass(classId);
    const spell = spells[slot - 1];
    if (spell) {
      state.castSpell(spell);
    }
  },

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
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    return { inventory: currentInventory };
  }),

  buyPotions: (type) => set((state) => {
    // Deprecated for direct use, moving to FaucetModal for real transactions
    return state;
  }),

  usePotion: (type) => set((state) => {
    const now = Date.now();

    // ── Verificação de GCD Global ─────────────────────────────────────────────
    // Não pode usar poção enquanto qualquer GCD estiver ativo.
    if (now < (state.globalCooldownEnd ?? 0)) {
      return { lastBlockedCastTime: now };
    }

    // ── Verificação de Cooldown Próprio da Poção (5s) ─────────────────────────
    if (now < (state.potionCooldownEnd ?? 0)) {
      return { lastBlockedCastTime: now };
    }

    const currentInventory = [...(state.inventory || [])];
    const itemId = type === "health" ? "health_potion" : "mana_potion";
    
    // Verifica se tem poção no inventário
    const slotIndex = currentInventory.findIndex(s => s.id === itemId && s.quantity > 0);
    if (slotIndex === -1) return state; // Sem poções disponíveis

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
      newAnim = { id: `anim_${Date.now()}_heal`, type: "heal", startX: state.playerPos.x, startY: state.playerPos.y, timestamp: now, duration: 1000 };
    }
    if (type === "mana") {
      nextPlayerPos.mp = Math.min(maxMp, (state.playerPos.mp ?? 0) + Math.floor(maxMp * 0.5));
    }

    // ── Aplicar GCD de poção (1s) e cooldown próprio (5s) ────────────────────
    const nextGlobalCooldownEnd = now + POTION_GCD_MS;
    const nextPotionCooldownEnd = now + POTION_SELF_CD_MS;

    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    
    const newState = { ...state, inventory: currentInventory, playerPos: nextPlayerPos };
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, buyPotions, usePotion, addItemToInventory, addActiveAnimation, removeActiveAnimation, ...gameStateToSave } = newState;
    
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    if (newAnim) {
      return {
        inventory: currentInventory,
        playerPos: nextPlayerPos,
        activeAnimations: [...(state.activeAnimations || []), newAnim],
        globalCooldownEnd: nextGlobalCooldownEnd,
        potionCooldownEnd: nextPotionCooldownEnd,
      };
    }
    return {
      inventory: currentInventory,
      playerPos: nextPlayerPos,
      globalCooldownEnd: nextGlobalCooldownEnd,
      potionCooldownEnd: nextPotionCooldownEnd,
    };
  }),

  addActiveAnimation: (anim) => set((state) => ({
    activeAnimations: [...(state.activeAnimations || []), anim]
  })),

  removeActiveAnimation: (id) => set((state) => ({
    activeAnimations: (state.activeAnimations || []).filter(a => a.id !== id)
  })),

  buyEquipment: (itemId, price) => set((state) => {
    const currentOwned = state.ownedEquipment || [];
    if (currentOwned.includes(itemId)) return state;
    
    // Assumindo que a validacao de fundos e debitos onchain foi feita antes de chamar isso
    const newState = {
      ...state,
      ownedEquipment: [...currentOwned, itemId]
    };
    
    // Save to localStorage
    const { playerPos, setGameState, setPlayerPos, updateWallet, addTransaction, completeQuest, setActiveModal, setActiveDialog, setBattleMode, setLockedTarget, addExperience, castMagic, buyPotions, usePotion, addItemToInventory, addActiveAnimation, removeActiveAnimation, buyEquipment, equipItem, unequipSlot, ...gameStateToSave } = newState as any;
    if (gameStateToSave.wallet && gameStateToSave.wallet.secretKey) {
      const safeWallet = { ...gameStateToSave.wallet };
      safeWallet.secretKey = encryptAES(safeWallet.secretKey, safeWallet.pin);
      gameStateToSave.wallet = safeWallet;
    }
    localStorage.setItem("stellar_island_game_state_v3", JSON.stringify(gameStateToSave));
    
    return { ownedEquipment: newState.ownedEquipment };
  }),

  equipItem: (itemId, slot) => set((state) => {
    const currentOwned = state.ownedEquipment || [];
    if (!currentOwned.includes(itemId)) return state;

    const item = EQUIPMENT_CATALOG.find((i: any) => i.id === itemId);
    if (!item) return state;

    const playerLvl = state.level || 1;
    if (playerLvl < item.levelRequired) return state;

      let newEquip = { ...state.playerPos.equippedItems };
      
      if (slot === "rightHand") {
        newEquip.rightHand = itemId;
        // Arma de 2 maos remove escudo
        if (item.hands === 2) {
          newEquip.leftHand = undefined;
        }
      } else if (slot === "leftHand") {
        // Se tem arma de 2 maos na mao direita, bloqueia escudo
        if (newEquip.rightHand) {
          const rightItem = EQUIPMENT_CATALOG.find((i: any) => i.id === newEquip.rightHand);
          if (rightItem && rightItem.hands === 2) {
            return state; // Bloqueado
          }
        }
        newEquip.leftHand = itemId;
      }

    const nextPlayerPos = { ...state.playerPos, equippedItems: newEquip };
    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    
    // Atualiza imediatamente o outro state da playerPos
    setTimeout(() => {
      useGameStore.getState().setPlayerPos({ equippedItems: newEquip });
    }, 0);
    
    return { playerPos: nextPlayerPos };
  }),

  unequipSlot: (slot) => set((state) => {
    let newEquip = { ...state.playerPos.equippedItems };
    if (slot === "rightHand") newEquip.rightHand = undefined;
    if (slot === "leftHand") newEquip.leftHand = undefined;

    const nextPlayerPos = { ...state.playerPos, equippedItems: newEquip };
    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    return { playerPos: nextPlayerPos };
  }),

  addBuff: (buff) => set((state) => {
    const existing = (state.activeBuffs || []).filter((b) => b.id !== buff.id && b.expiresAt > Date.now());
    return { activeBuffs: [...existing, buff] };
  }),

  removeBuff: (buffId) => set((state) => ({
    activeBuffs: (state.activeBuffs || []).filter((b) => b.id !== buffId),
  })),

  cleanExpiredBuffs: () => set((state) => {
    const current = state.activeBuffs;
    if (!current || current.length === 0) return state;
    const now = Date.now();
    const valid = current.filter((b) => b.expiresAt > now);
    if (valid.length !== current.length) {
      return { activeBuffs: valid };
    }
    return state;
  }),

  setPlayerClass: (classId) => set((state) => {
    const nextPlayerPos = { ...state.playerPos, playerClass: classId };
    localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
    return { playerClass: classId, playerPos: nextPlayerPos };
  }),

  killPlayer: (killerName, damage) => set((state) => {
    const curMap = state.playerPos.mapId || "center";
    const isArena = curMap === "arena";
    let updatedArenaScore = state.arenaScore;
    if (isArena) {
      const cur = state.arenaScore || { kills: 0, deaths: 0, streak: 0, highestStreak: 0 };
      updatedArenaScore = {
        ...cur,
        deaths: cur.deaths + 1,
        streak: 0,
      };
    }

    return {
      isDead: true,
      isBattleModeActive: false,
      lockedTargetId: null,
      targetInfo: null,
      arenaScore: updatedArenaScore,
      lastDeathInfo: {
        killerName,
        damage,
        timestamp: Date.now(),
        mapId: curMap,
      },
    };
  }),

  respawnPlayer: () => set((state) => {
    const maxHp = state.playerPos.maxHp || 100;
    const maxMp = state.playerPos.maxMp || 50;
    const isArena = state.playerPos.mapId === "arena" || state.lastDeathInfo?.mapId === "arena";

    const nextPlayerPos = {
      ...state.playerPos,
      x: 30,
      y: isArena ? 53 : 30,
      targetX: 30,
      targetY: isArena ? 53 : 30,
      mapId: isArena ? ("arena" as const) : ("center" as const),
      hp: maxHp,
      mp: maxMp,
      isMoving: false,
    };
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("stellar_island_player_pos_v3", JSON.stringify(nextPlayerPos));
      } catch (e) {
        // Safe fallback
      }
    }

    // Concede 3 segundos de escudo protetor de invulnerabilidade no respawn
    const respawnBuff: import("../types").ActiveBuff = {
      id: "buff_shield_respawn",
      name: "Escudo de Renascimento",
      icon: "🛡️",
      statModifiers: {
        invulnerable: true,
        damageReduction: 1.0,
      },
      durationMs: 3000,
      startTime: Date.now(),
      expiresAt: Date.now() + 3000,
    };

    const existingBuffs = (state.activeBuffs || []).filter((b) => b.id !== "buff_shield_respawn" && b.expiresAt > Date.now());

    return {
      isDead: false,
      isBattleModeActive: isArena,
      lockedTargetId: null,
      targetInfo: null,
      playerPos: nextPlayerPos,
      activeBuffs: [...existingBuffs, respawnBuff],
    };
  }),

  recordArenaKill: () => set((state) => {
    const cur = state.arenaScore || { kills: 0, deaths: 0, streak: 0, highestStreak: 0 };
    const nextStreak = cur.streak + 1;
    return {
      arenaScore: {
        kills: cur.kills + 1,
        deaths: cur.deaths,
        streak: nextStreak,
        highestStreak: Math.max(cur.highestStreak, nextStreak),
      },
    };
  }),

  recordArenaDeath: () => set((state) => {
    const cur = state.arenaScore || { kills: 0, deaths: 0, streak: 0, highestStreak: 0 };
    return {
      arenaScore: {
        ...cur,
        deaths: cur.deaths + 1,
        streak: 0,
      },
    };
  }),

  resetArenaScore: () => set(() => ({
    arenaScore: { kills: 0, deaths: 0, streak: 0, highestStreak: 0 },
  })),

}));

export const getEquipmentBonuses = (playerPos: import("../types").Player) => {
  const equips = playerPos.equippedItems;
  let atkMultiplier = 1;
  let defMultiplier = 1;
  let blockChanceMultiplier = 0;
  let critChanceMultiplier = 0;
  
  if (!equips) return { atkMultiplier, defMultiplier, blockChanceMultiplier, critChanceMultiplier };
  
  if (equips.rightHand) {
    const rItem = EQUIPMENT_CATALOG.find((i: any) => i.id === equips.rightHand);
    if (rItem) {
      atkMultiplier += rItem.atkBonus;
      if (rItem.critChance) critChanceMultiplier += rItem.critChance;
    }
  }
  
  if (equips.leftHand) {
    const lItem = EQUIPMENT_CATALOG.find((i: any) => i.id === equips.leftHand);
    if (lItem) {
      defMultiplier -= lItem.defBonus;
      if (lItem.blockChance) blockChanceMultiplier += lItem.blockChance;
    }
  }
  
  // Nao deixa defesa ser < 0 (100% de reducao = 0 multiplier)
  defMultiplier = Math.max(0, defMultiplier);

  return { atkMultiplier, defMultiplier, blockChanceMultiplier, critChanceMultiplier };
};


