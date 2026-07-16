/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { GameOverlay } from "./components/GameOverlay";
import { FloatingWindows } from "./components/FloatingWindows";
import { LoginScreen } from "./components/LoginScreen";
import { GameState, Player, NPC, Transaction, QuestId, Quest, WalletState } from "./types";
import { INITIAL_QUESTS, INITIAL_NPCS } from "./gameData";
import { getNpcsForMap } from "./maps";
import { 
  Rocket, 
  HelpCircle, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Award,
  Sparkles,
  Fingerprint,
  Coins,
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  Compass,
  Eye,
  EyeOff
} from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem("stellar_island_game_state_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.quests && parsed.wallet) {
          // Reset dialogue/modal popups on refresh to ensure a clean UI load
          // and ensure saved wallet is backwards-compatible with new fields
          return {
            ...parsed,
            wallet: {
              name: "",
              email: "",
              usdwBalance: 0,
              brwBalance: 0,
              vaultXlm: 0,
              vaultUsdw: 0,
              vaultBrw: 0,
              poolXlmUsdw: 0,
              poolUsdwBrw: 0,
              ...parsed.wallet,
            },
            activeDialog: null,
            activeModal: null,
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
    };
  });

  const [playerPos, setPlayerPos] = useState<Player>(() => {
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
    };
  });

  // Sync gameState and playerPos changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("stellar_island_game_state_v1", JSON.stringify(gameState));
    } catch (err) {
      console.warn("Could not save gameState to localStorage", err);
    }
  }, [gameState]);

  useEffect(() => {
    try {
      localStorage.setItem("stellar_island_player_pos_v1", JSON.stringify(playerPos));
    } catch (err) {
      console.warn("Could not save playerPos to localStorage", err);
    }
  }, [playerPos]);

  const [npcs] = useState<NPC[]>(INITIAL_NPCS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Handle active retro floating window overlays: "customizer" | "backpack" | "ledger" | "guide" | null
  const [activeWindow, setActiveWindow] = useState<"customizer" | "backpack" | "ledger" | "guide" | null>(null);
  const [showPassport, setShowPassport] = useState(false);
  const [passportTab, setPassportTab] = useState<"attributes" | "credentials">("attributes");
  const [passportSecVisible, setPassportSecVisible] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const handleResetAndNewCharacter = () => {
    try {
      localStorage.removeItem("stellar_island_game_state_v1");
      localStorage.removeItem("stellar_island_player_pos_v1");
    } catch (e) {
      console.warn("Could not clean localStorage", e);
    }
    
    // Reset player position to center
    setPlayerPos({
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
    });

    // Reset game state
    setGameState({
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
    });
    
    setIsLoggedIn(false);
  };

  const handleTeleportToCenter = () => {
    playSynthSound("unlock");
    setPlayerPos((prev) => ({
      ...prev,
      x: 30,
      y: 30,
      targetX: 30,
      targetY: 30,
      isMoving: false,
      dir: "down",
      mapId: "center",
    }));
  };

  // Is the player near any smart terminal?
  const [isNearTerminal, setIsNearTerminal] = useState<"wallet" | "onramp" | "soroban" | "hold" | "atf" | null>(null);

  // Simulate periodic Stellar Ledger sequence increments (Consensus in 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        currentLedger: prev.currentLedger + 1,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Synthesizer Sounds
  const playSynthSound = (type: "beep" | "success" | "coin" | "unlock") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === "beep") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "coin") {
        osc.type = "square";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      } else if (type === "success") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === "unlock") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(261.63, audioCtx.currentTime);
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.08);
        osc.frequency.setValueAtTime(392.00, audioCtx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio blocked", e);
    }
  };

  const generateTxHash = () => {
    const chars = "abcdef0123456789";
    let hash = "tx_";
    for (let i = 0; i < 16; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  };

  const handleAdvanceDialog = () => {
    playSynthSound("beep");
    if (!gameState.activeDialog) return;

    const { currentStep, text, npcId } = gameState.activeDialog;
    if (currentStep < text.length - 1) {
      setGameState((prev) => ({
        ...prev,
        activeDialog: {
          ...prev.activeDialog!,
          currentStep: currentStep + 1,
        },
      }));
    } else {
      setGameState((prev) => {
        let nextModal = prev.activeModal;
        
        if (npcId === "keymaster" && prev.quests.wallet.status === "active") {
          nextModal = "wallet";
        } else if (npcId === "portmaster" && prev.quests.onramp.status === "active") {
          nextModal = "onramp";
        } else if (npcId === "scholar" && prev.quests.soroban.status === "active") {
          nextModal = "soroban";
        } else if (npcId === "sage" && prev.quests.hold.status === "active") {
          nextModal = "hold";
        }

        return {
          ...prev,
          activeDialog: null,
          activeModal: nextModal,
        };
      });
    }
  };

  const handleTalkToNPC = (npc: NPC) => {
    playSynthSound("beep");

    let dialogueLines = npc.dialogs;
    if (npc.questTrigger) {
      const activeQuest = gameState.quests[npc.questTrigger];
      if (activeQuest.status === "active" && npc.activeQuestDialogs) {
        dialogueLines = npc.activeQuestDialogs;
      } else if (activeQuest.status === "completed") {
        dialogueLines = npc.completedDialogs;
      }
    } else if (npc.id === "guide") {
      const walletStatus = gameState.quests.wallet.status;
      if (walletStatus === "completed") {
        dialogueLines = npc.completedDialogs;
      }
    }

    setGameState((prev) => ({
      ...prev,
      activeDialog: {
        npcName: npc.name,
        text: dialogueLines,
        currentStep: 0,
        npcId: npc.id,
      },
    }));
  };

  const handleTriggerModal = () => {
    playSynthSound("beep");
    if (isNearTerminal) {
      setGameState((prev) => ({
        ...prev,
        activeModal: isNearTerminal,
      }));
    }
  };

  const handleUpdateWallet = (updatedWalletFields: Partial<WalletState>, newTx?: Transaction) => {
    setGameState((prev) => {
      const nextWallet = {
        ...prev.wallet,
        ...updatedWalletFields,
      };
      return {
        ...prev,
        wallet: nextWallet,
        transactions: newTx ? [newTx, ...prev.transactions] : prev.transactions,
      };
    });
  };

  const handleWalletCreated = (pubKey: string, secKey: string, name: string, email: string, pin: string) => {
    playSynthSound("success");
    setPlayerPos((prev) => ({
      ...prev,
      name: name,
    }));
    setGameState((prev) => {
      const newTx: Transaction = {
        id: generateTxHash(),
        type: "CREATE_ACCOUNT",
        timestamp: new Date().toLocaleTimeString(),
        amount: "100",
        asset: "XLM",
        fee: "0.00001",
        memo: `WalletNow Onboarding (${email})`,
        ledgerSequence: prev.currentLedger,
      };

      const updatedQuests = { ...prev.quests };
      updatedQuests.wallet.status = "completed";
      updatedQuests.onramp.status = "active";

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          hasWallet: true,
          publicKey: pubKey,
          secretKey: secKey,
          name: name,
          email: email,
          pin: pin,
          xlmBalance: 100, // 100 XLM from WalletNow Testnet Kit
          usdwBalance: 50,  // 50 USDW
          brwBalance: 250,  // 250 BRW
          usdcBalance: 0,
          soroBalance: 0,
        },
        quests: updatedQuests,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  const handleOnRampSuccess = (xlmAdded: number, method: "PIX" | "CARD") => {
    playSynthSound("coin");
    setGameState((prev) => {
      const newTx: Transaction = {
        id: generateTxHash(),
        type: method === "PIX" ? "ON_RAMP_PIX" : "ON_RAMP_CARD",
        timestamp: new Date().toLocaleTimeString(),
        amount: xlmAdded.toString(),
        asset: "XLM",
        fee: "0.00001",
        memo: `Depósito via ${method}`,
        ledgerSequence: prev.currentLedger,
      };

      const updatedQuests = { ...prev.quests };
      updatedQuests.onramp.status = "completed";
      updatedQuests.soroban.status = "active";

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          xlmBalance: prev.wallet.xlmBalance + xlmAdded,
        },
        quests: updatedQuests,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  const handleSwapSuccess = (fromAsset: "XLM" | "USDW" | "BRW", toAsset: "XLM" | "USDW" | "BRW", amountFrom: number, amountTo: number) => {
    playSynthSound("success");
    setGameState((prev) => {
      const fromField = fromAsset === "XLM" ? "xlmBalance" : fromAsset === "USDW" ? "usdwBalance" : "brwBalance";
      const toField = toAsset === "XLM" ? "xlmBalance" : toAsset === "USDW" ? "usdwBalance" : "brwBalance";

      const currentFrom = prev.wallet[fromField] || 0;
      const currentTo = prev.wallet[toField] || 0;

      const newTx: Transaction = {
        id: generateTxHash(),
        type: "SWAP_SOROBAN",
        timestamp: new Date().toLocaleTimeString(),
        amount: amountTo.toString(),
        asset: toAsset,
        fee: "0.00009",
        memo: `Swap Soroban AMM: ${amountFrom} ${fromAsset} → ${amountTo} ${toAsset}`,
        ledgerSequence: prev.currentLedger,
      };

      const updatedQuests = { ...prev.quests };
      updatedQuests.soroban.status = "completed";
      updatedQuests.hold.status = "active";

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          [fromField]: Math.max(0, currentFrom - amountFrom),
          [toField]: currentTo + amountTo,
        },
        quests: updatedQuests,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  const handleHoldSuccess = (asset: "XLM" | "USDW" | "BRW", amount: number, updatedFields: Partial<WalletState>, tx: Transaction) => {
    playSynthSound("success");
    setGameState((prev) => {
      const updatedQuests = { ...prev.quests };
      updatedQuests.hold.status = "completed";

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          ...updatedFields,
          isLocked: true,
          lockedAmount: (prev.wallet.lockedAmount || 0) + (asset === "XLM" ? amount : 0),
        },
        quests: updatedQuests,
        transactions: [tx, ...prev.transactions],
      };
    });
  };

  const handleMoveButtonPress = (dir: "up" | "down" | "left" | "right") => {
    if (gameState.activeDialog) return;
    setPlayerPos((prev) => {
      if (prev.isMoving) return prev;
      let nextTargetX = prev.targetX;
      let nextTargetY = prev.targetY;
      
      if (dir === "up") nextTargetY -= 1;
      if (dir === "down") nextTargetY += 1;
      if (dir === "left") nextTargetX -= 1;
      if (dir === "right") nextTargetX += 1;

      return {
        ...prev,
        dir,
        targetX: nextTargetX,
        targetY: nextTargetY,
        isMoving: true,
        frame: 0,
      };
    });
  };

  const handleInteractButtonPress = () => {
    if (gameState.activeDialog) {
      handleAdvanceDialog();
    } else {
      handleTriggerModal();
    }
  };

  // Keyboard shortcut listener to advance dialogue boxes and toggle full map
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (gameState.activeDialog) {
          e.preventDefault();
          handleAdvanceDialog();
        }
      } else if (e.key.toLowerCase() === "m") {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setShowMapModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [gameState.activeDialog]);

  const activeQuestsArray = Object.values(gameState.quests) as Quest[];
  const completedCount = activeQuestsArray.filter(q => q.status === "completed").length;
  const progressPercent = Math.round((completedCount / activeQuestsArray.length) * 100);
  const currentActiveQuest = activeQuestsArray.find(q => q.status === "active") || activeQuestsArray[activeQuestsArray.length - 1];
  const isCompletedAll = gameState.quests.hold.status === "completed";

  const getFormattedName = () => {
    let base = playerPos.name || "Anonymo";
    if (gameState.quests.wallet.status === "completed" && gameState.wallet.publicKey) {
      const last4 = gameState.wallet.publicKey.slice(-4);
      base += ` [${last4}]`;
    }
    if (gameState.quests.hold.status === "completed") {
      base = `⭐ ${base}`;
    }
    return base;
  };

  // Helper to determine region name based on mapId
  const getRegionName = (mapId: string): string => {
    switch (mapId) {
      case "center":
        return "Praça Central Stellar";
      case "east":
        return "Templo Stellar (Cavernas Arenosas)";
      case "north":
        return "Porto de Cargas (Praia dos Anchors)";
      case "west":
        return "Plataforma Soroban (Distrito Cypherpunk)";
      case "south":
        return "Santuário do Holder (Floresta e Plantações)";
      default:
        return "Praça Central Stellar";
    }
  };

  const currentRegion = getRegionName(playerPos.mapId || "center");

  // Dynamic Title based on completed quests
  let playerTitle = "Náufrago Recém-Chegado";
  if (completedCount === 1) playerTitle = "Iniciado de Stellar";
  else if (completedCount === 2) playerTitle = "Operador On-Ramp";
  else if (completedCount === 3) playerTitle = "Alquimista do Soroban";
  else if (completedCount >= 4) playerTitle = "Herói Lendário de Stellar";

  // RPG stats calculations
  const attrStr = 12 + completedCount * 3;
  const attrInt = 10 + completedCount * 6;
  const attrAgi = 11 + completedCount * 2;
  const attrRes = 10 + completedCount * 4;
  const attrFaith = gameState.wallet.hasWallet ? 20 + completedCount * 12 : 0;

  const isMovementBlocked = !!gameState.activeModal || !!gameState.activeDialog || !!activeWindow || showPassport || showMapModal;

  if (!isLoggedIn) {
    return (
      <LoginScreen
        existingWallet={gameState.wallet}
        existingPlayerName={playerPos.name}
        onLogin={(name) => {
          setPlayerPos((prev) => ({ ...prev, name }));
          playSynthSound("success");
          setIsLoggedIn(true);
        }}
        onPasskeyLogin={() => {
          playSynthSound("success");
          setIsLoggedIn(true);
        }}
        onResetCharacter={handleResetAndNewCharacter}
        playSynthSound={playSynthSound}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-[#0c0d0e] flex flex-col selection:bg-[#ffc600] selection:text-black font-sans relative overflow-hidden select-none">
      
      {/* CENTRAL 100% STANDALONE IN-GAME CONSOLE CONTAINER */}
      <div className="relative w-full h-full bg-[#0c0d0e] overflow-hidden flex flex-col">
        {/* 1. TOP PARCHMENT HUD BAR - HIGH RE-DESIGNED FIDELITY */}
        <div className="absolute top-0 left-0 right-0 z-20 h-24 md:h-16 bg-[#ebd9c0] border-b-[2.5px] border-black flex flex-col md:flex-row items-center justify-between px-2 md:px-4 text-xs md:text-sm font-bold text-black select-none font-mono shadow-[0_3px_5px_rgba(0,0,0,0.4)] py-1.5 md:py-0 gap-1.5 md:gap-0">
          
          {/* Top Row on mobile, Left Section on desktop */}
          <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playSynthSound("beep");
                }}
                className="w-10 h-10 md:w-10 md:h-10 bg-[#fbf5eb] border-2 border-black rounded-lg flex items-center justify-center hover:bg-white active:translate-y-0.5 shadow-[2px_2px_0px_#000] cursor-pointer transition"
                title="Alternar Áudio"
              >
                <span className="text-base md:text-base">{soundEnabled ? "🔊" : "🔇"}</span>
              </button>
              
              {/* HP Hearts & Health Bar combined */}
              <div className="flex flex-col items-start bg-[#1a1913]/12 px-2.5 py-1.5 md:py-1 rounded-lg border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] md:text-[11px] font-black leading-none text-red-700 tracking-wider">HP</span>
                  <span className="text-[11px] md:text-[11px] font-mono leading-none font-black text-slate-800 bg-[#ebd9c0]/50 px-1 rounded border border-black/5">
                    {80 + completedCount * 30} / {80 + completedCount * 30}
                  </span>
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => {
                    const isLit = h <= 5 + completedCount;
                    return (
                      <span 
                        key={h} 
                        className={`text-[12px] md:text-[13px] select-none leading-none ${
                          isLit 
                            ? "text-red-500 font-bold drop-shadow-[0.5px_0.5px_0_rgba(0,0,0,0.35)] animate-pulse" 
                            : "text-neutral-500 opacity-20"
                        }`}
                      >
                        ❤️
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* EXP Progress Bar (Pixel styled) */}
              <div className="hidden lg:flex flex-col w-36 bg-[#1a1913]/12 px-2.5 py-1 rounded-lg border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between text-[11px] leading-none mb-1 font-black">
                  <span className="text-amber-800">EXP LVL {completedCount + 1}</span>
                  <span className="text-amber-950">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-black/20 border border-black/15 rounded overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Title / Class Badge (Shown here next to HP on mobile) */}
            <span className="block md:hidden bg-[#1e293b] text-[#ffbf00] border-2 border-black rounded-lg px-2.5 py-1.5 text-[11px] font-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">
              👑 {playerTitle}
            </span>
          </div>

          {/* Center Section on desktop: Immersive Title & Buff Indicators */}
          <div className="hidden md:flex items-center gap-2">
            {/* Title / Class Badge */}
            <span className="bg-[#1e293b] text-[#ffbf00] border-2 border-black rounded-lg px-2.5 py-1 text-[12.5px] font-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">
              👑 {playerTitle}
            </span>

            {/* Glowing active buff icons */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#1a1913]/15 px-2 py-1 rounded-lg border border-black/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
              <span className="text-[11px] font-black text-[#473b2c] mr-1">BUFFS:</span>
              <span 
                className={`text-sm cursor-help relative group`} 
                title={playerPos.x === 30 && playerPos.y === 31 ? "🛡️ Zona Segura (Você está protegido)" : "🏕️ Explorando a Ilha"}
              >
                {playerPos.x === 30 && playerPos.y === 31 ? "🛡️" : "⚔️"}
              </span>
              <span className="text-sm animate-pulse" title="⚡ Aura de Velocidade (+10%)">⚡</span>
              {gameState.wallet.hasWallet && (
                <span className="text-sm text-cyan-700 font-bold" title="🔑 Chaves Stellar Sincronizadas">🔑</span>
              )}
              {isCompletedAll && (
                <span className="text-sm text-amber-500 font-bold animate-bounce" title="🌟 Conquista Lendária Desbloqueada">🌟</span>
              )}
            </div>
          </div>

          {/* Bottom Row on mobile, Right Section on desktop: Multi-currency Purse & World Clock */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* XLM Balance */}
              <span 
                className="bg-[#ffe494] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-amber-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Crystal Shards (XLM) - Usado para taxas de transação."
              >
                🪙 <span className="font-mono text-[11.5px] md:text-[12.5px]">{gameState.wallet.xlmBalance}</span> <span className="text-[9.5px] font-sans font-black opacity-85">XLM</span>
              </span>
              {/* USDW Balance */}
              <span 
                className="bg-[#c2f0fc] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-cyan-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Stellar Anchored Dollar (USDW) - Moeda de valor estável USD."
              >
                💵 <span className="font-mono text-[11.5px] md:text-[12.5px]">{gameState.wallet.usdwBalance}</span> <span className="text-[9.5px] font-sans font-black opacity-85">USDW</span>
              </span>
              {/* BRW Balance */}
              <span 
                className="bg-[#c2fcc9] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-emerald-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Stellar Anchored Real (BRW) - Moeda pareada ao Real Brasileiro."
              >
                🇧🇷 <span className="font-mono text-[11.5px] md:text-[12.5px]">{gameState.wallet.brwBalance}</span> <span className="text-[9.5px] font-sans font-black opacity-85">BRW</span>
              </span>
            </div>
            
            {/* Day and real-time clock */}
            <span className="bg-black/90 text-white border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1.5 font-mono text-[11px] md:text-[11.5px] font-black tracking-tight shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.2)] whitespace-nowrap">
              📅 Dia {16 + completedCount} | {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ☀️
            </span>
          </div>

        </div>

        {/* 2. LEFT SIDEBARHUD - TELEPORTS, LOGS AND TRAVEL BADGES */}
        <div className="absolute top-26 md:top-20 left-2.5 z-10 flex flex-col gap-2 select-none">
          
          {/* Active Quests Toggle Scroll */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "backpack" ? null : "backpack");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "backpack" ? "bg-emerald-400" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="Sinalizadores de Missões"
          >
            <span className="text-xl md:text-lg">📝</span>
          </button>

          {/* Quick Town Square Teleport Rune Portal */}
          <button
            onClick={handleTeleportToCenter}
            className="w-11 h-11 md:w-9 md:h-9 bg-cyan-100 hover:bg-cyan-50 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition group relative"
            title="Teletransporte ao Centro (Runa de Regresso)"
          >
            <span className="text-xl md:text-lg animate-spin-slow">🌀</span>
            <span className="absolute left-13 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 font-mono">
              Retornar ao Centro (30,30)
            </span>
          </button>

          {/* Traveller ID Passport Badge */}
          <button
            onClick={() => {
              setShowPassport(!showPassport);
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              showPassport ? "bg-amber-400" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="ID do Viajante (Passport)"
          >
            <span className="text-xl md:text-lg">🛡️</span>
          </button>

          {/* Complete World Map Button */}
          <button
            onClick={() => {
              setShowMapModal(!showMapModal);
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              showMapModal ? "bg-amber-400 animate-pulse" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            } group relative`}
            title="Mapa Completo de Stellar [M]"
          >
            <span className="text-xl md:text-lg">🗺️</span>
            <span className="absolute left-13 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 font-mono">
              Ver Mapa de Stellar [M]
            </span>
          </button>

          {/* New Character / Reset Sandbox button */}
          <button
            onClick={() => {
              playSynthSound("unlock");
              handleResetAndNewCharacter();
            }}
            className="w-11 h-11 md:w-9 md:h-9 bg-red-600 hover:bg-red-500 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition group relative"
            title="Novo Personagem (Resetar Tudo)"
          >
            <span className="text-xl md:text-lg">✨</span>
            <span className="absolute left-13 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 font-mono">
              Novo Personagem (Resetar Tudo)
            </span>
          </button>

        </div>

        {/* 3. RIGHT SIDEBARHUD - MINIMAP COMPASS & TAB CONTROLS */}
        <div className="absolute top-26 md:top-20 right-2.5 z-10 flex flex-col items-end gap-2.5 select-none">
          
          {/* Authentic Mini Map Compass Circle */}
          <div className="w-24 h-24 md:w-[84px] md:h-[84px] rounded-full bg-[#1c2c16] border-[3px] border-[#8b5a2b] shadow-lg flex flex-col items-center justify-center relative select-none">
            {/* cardinal markers */}
            <span className="absolute top-0 text-[8px] md:text-[6.5px] text-white/90 font-black font-sans leading-none">N</span>
            <span className="absolute right-0.5 text-[8px] md:text-[6.5px] text-white/90 font-black font-sans leading-none">E</span>
            <span className="absolute bottom-0 text-[8px] md:text-[6.5px] text-white/90 font-black font-sans leading-none">S</span>
            <span className="absolute left-0.5 text-[8px] md:text-[6.5px] text-white/90 font-black font-sans leading-none">W</span>
            
            {/* pulsing radar center */}
            <div className="w-[74px] h-[74px] md:w-[62px] md:h-[62px] rounded-full border border-dashed border-emerald-500/20 flex items-center justify-center bg-radial-gradient">
              <div className="w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="absolute w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-cyan-400" />
            </div>
            
            {/* Coordinates tag (matching HUD layout) */}
            <div className="absolute -bottom-2 bg-black/95 border-2 border-[#8b5a2b] px-1.5 py-0.5 rounded text-[8.5px] md:text-[7.5px] text-amber-200 font-mono font-black tracking-tight shadow-[1px_1.5px_0px_#000] whitespace-nowrap">
              X:{Math.round(playerPos.x)} Y:{Math.round(playerPos.y)}
            </div>
          </div>

          {/* Spacer to push buttons nicely down below map */}
          <div className="h-1" />

          {/* Backpack Window Trigger */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "backpack" ? null : "backpack");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "backpack" ? "bg-emerald-500 text-white" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="Inventário & Runas"
          >
            <span className="text-xl md:text-lg">🎒</span>
          </button>

          {/* Outfit customization anvil */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "customizer" ? null : "customizer");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "customizer" ? "bg-amber-400" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="Guarda-roupa (Outfits)"
          >
            <span className="text-xl md:text-lg">⚒️</span>
          </button>

          {/* Transaction Console Ledger Scroll */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "ledger" ? null : "ledger");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "ledger" ? "bg-[#007ba4] text-white" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title={`Histórico de Transações (${gameState.transactions.length})`}
          >
            <span className="text-xl md:text-lg">📜</span>
          </button>

          {/* Manual scrolls Rule book */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "guide" ? null : "guide");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "guide" ? "bg-red-600 text-white" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="Livro de Regras do Continente"
          >
            <span className="text-xl md:text-lg">📖</span>
          </button>

        </div>

        {/* 4. CHRONICLES ACTIVE QUEST FLOATING CARD OVERLAY */}
        <div className="absolute top-26 md:top-20 left-[62px] md:left-[54px] z-10 bg-[#fbf5eb]/95 border-2 border-black rounded-lg p-2.5 w-[260px] sm:w-[380px] md:w-[480px] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] text-[10px] md:text-[9.5px] leading-snug font-mono select-none pointer-events-none text-left">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#ffbf00] rounded-full animate-ping" />
            <span className="text-[8px] md:text-[7.5px] text-amber-800 font-extrabold uppercase tracking-wider">Missão Ativa</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 mt-0.5">
            <span className="text-black font-black block leading-tight text-[11.5px] md:text-[10.5px] uppercase shrink-0">
              {currentActiveQuest?.title}
            </span>
            <span className="text-slate-600 text-[10px] md:text-[9px] block leading-snug sm:border-l sm:border-black/15 sm:pl-2">
              {currentActiveQuest?.description}
            </span>
          </div>
        </div>

        {/* 5. TRAVELER LENDÁRIO CELEBRATION RIBBON */}
        {isCompletedAll && (
          <div className="absolute top-[150px] md:top-32 left-1/2 -translate-x-1/2 z-10 bg-[#ffbf00] border-2 border-black px-3.5 py-1.5 rounded-full shadow-[2px_2px_0px_#000] text-[9.5px] md:text-[8.5px] font-black text-black tracking-wider flex items-center gap-1.5 animate-bounce select-none pointer-events-none">
            🏆 CONQUISTA MÁXIMA: TRAVELER LENDÁRIO DE STELLAR! 🌟
          </div>
        )}

        {/* MAIN GAME ENGINE SCREEN CANVAS */}
        <div className="w-full h-full">
          <GameCanvas
            gameState={gameState}
            playerPos={playerPos}
            setPlayerPos={setPlayerPos}
            npcs={getNpcsForMap(playerPos.mapId || "center")}
            onTalkToNPC={handleTalkToNPC}
            onNearTerminal={(type) => {
              setIsNearTerminal(type);
              playSynthSound("beep");
            }}
            isMovementBlocked={isMovementBlocked}
          />
        </div>

        {/* AUTHENTIC DIALOG SPEECH BUBBLE OVERLAY */}
        {gameState.activeDialog && (
          <div 
            onClick={handleAdvanceDialog}
            className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 bg-[#faf9f5] text-black border-[3.5px] border-black rounded-[16px] shadow-[4px_5px_0px_rgba(0,0,0,1)] p-5 md:p-6 flex items-start gap-4 md:gap-5 cursor-pointer select-none z-30 animate-in slide-in-from-bottom duration-150"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[#ece9df] border-3 border-black rounded-xl flex items-center justify-center text-3xl md:text-4xl shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
              {gameState.activeDialog.npcId === "guide" ? "🤵" :
               gameState.activeDialog.npcId === "keymaster" ? "💎" :
               gameState.activeDialog.npcId === "portmaster" ? "👑" :
               gameState.activeDialog.npcId === "scholar" ? "🔮" : "🧙‍♂️"}
            </div>
            <div className="flex-1 space-y-1.5 text-left">
              <div className="bg-[#ffbf00] border-2 border-black rounded-md px-2 py-0.5 font-black text-[10px] md:text-xs uppercase font-mono tracking-wider text-black inline-block shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {gameState.activeDialog.npcName}
              </div>
              <p className="text-sm sm:text-base md:text-lg font-bold leading-relaxed text-slate-900">
                "{gameState.activeDialog.text[gameState.activeDialog.currentStep]}"
              </p>
              <div className="flex justify-between items-center pt-2 text-[9px] md:text-xs text-slate-600 font-mono border-t border-dashed border-black/20">
                <span>Pressione [ESPAÇO / ENTER] ou toque para avançar.</span>
                <span className="bg-[#ece9df] px-1.5 py-0.5 rounded border border-black/15 text-black font-bold">
                  {gameState.activeDialog.currentStep + 1} / {gameState.activeDialog.text.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* WEb3 TERMINAL PROXIMITY DIALOG ACTION TRIGGER */}
        {isNearTerminal && !gameState.activeDialog && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-72 max-w-[90%] bg-white border-3 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000] flex flex-col gap-1.5 animate-bounce text-center">
            <div className="font-mono">
              <span className="text-[7.5px] text-[#ffbf00] font-black uppercase block tracking-wider leading-none">Terminal Disponível</span>
              <span className="text-black font-black text-xs uppercase leading-tight">CONECTAR AO TERMINAL {isNearTerminal === "atf" ? "ATM" : isNearTerminal.toUpperCase()}</span>
            </div>
            <button
              id="btn-open-terminal"
              onClick={handleTriggerModal}
              className="w-full py-1.5 rounded bg-[#5db81d] text-white border-2 border-black shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.2),inset_2px_2px_0px_rgba(255,255,255,0.4),0_2.5px_0px_#000] active:translate-y-0.5 active:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2),0_1px_0px_#000] font-black text-[10px] tracking-wider cursor-pointer transition"
            >
              💻 CONECTAR DISPOSITIVO WEB3
            </button>
          </div>
        )}

        {/* NEW ENHANCED BOTTOM STATUS/REGION BAR HUD */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-8 bg-black/90 border-t-2 border-[#8b5a2b]/60 flex items-center justify-between px-3 text-[8.5px] sm:text-[9.5px] font-mono text-slate-300 pointer-events-auto select-none">
          <div className="flex items-center gap-1.5 font-bold text-[#ffbf00]">
            <span className="animate-pulse">🗺️</span>
            <span className="uppercase tracking-tight truncate max-w-[130px] sm:max-w-[280px]">
              {currentRegion}
            </span>
            <span className="text-slate-500 font-normal">|</span>
            <span className="text-cyan-400 font-mono font-extrabold flex items-center gap-0.5">
              🧭 X: {Math.round(playerPos.x)} Y: {Math.round(playerPos.y)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[9px] font-semibold text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-[#5db81d] animate-ping mr-0.5" />
            <span className="text-[#5db81d] font-bold uppercase tracking-wider">REDE ATIVA (Ledger #{gameState.currentLedger})</span>
            <span className="text-slate-600">|</span>
            <span>Simulação Sandbox Stellar</span>
          </div>

          <div className="flex items-center gap-1.5 font-extrabold text-slate-400">
            <span>🎮 Teclado:</span>
            <span className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded text-[7.5px]">WASD</span>
            <span className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded text-[7.5px]">ESPAÇO</span>
          </div>
        </div>

        {/* MOBILE JOYSTICK TOUCH PAD (Absolute bottom-left overlay elevated above status bar) */}
        {!gameState.activeDialog && (
          <div className="absolute bottom-10 left-3 z-10 flex items-center gap-1 bg-[#ece9df] border-2 border-black rounded-lg p-1.5 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] md:hidden">
            <div className="grid grid-cols-3 gap-1 w-36 h-26 font-mono">
              <div />
              <button 
                id="btn-move-up"
                onClick={() => handleMoveButtonPress("up")}
                className="bg-white hover:bg-slate-100 text-black rounded-lg border-2 border-black cursor-pointer text-base font-bold active:translate-y-0.5 flex items-center justify-center shadow-[0_2px_0_#000] active:shadow-none"
              >
                ▲
              </button>
              <div />
              <button 
                id="btn-move-left"
                onClick={() => handleMoveButtonPress("left")}
                className="bg-white hover:bg-slate-100 text-black rounded-lg border-2 border-black cursor-pointer text-base font-bold active:translate-y-0.5 flex items-center justify-center shadow-[0_2px_0_#000] active:shadow-none"
              >
                ◀
              </button>
              <button 
                id="btn-move-down"
                onClick={() => handleMoveButtonPress("down")}
                className="bg-white hover:bg-slate-100 text-black rounded-lg border-2 border-black cursor-pointer text-base font-bold active:translate-y-0.5 flex items-center justify-center shadow-[0_2px_0_#000] active:shadow-none"
              >
                ▼
              </button>
              <button 
                id="btn-move-right"
                onClick={() => handleMoveButtonPress("right")}
                className="bg-white hover:bg-slate-100 text-black rounded-lg border-2 border-black cursor-pointer text-base font-bold active:translate-y-0.5 flex items-center justify-center shadow-[0_2px_0_#000] active:shadow-none"
              >
                ▶
              </button>
            </div>
          </div>
        )}

        {/* MODULAR RETRO FLOATING WINDOWS (Overlays on top of the map) */}
        <FloatingWindows
          activeWindow={activeWindow}
          onClose={() => setActiveWindow(null)}
          gameState={gameState}
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
        />

        {/* RETRO FLOATING PASSPORT & RPG STATUS WINDOW */}
        {showPassport && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#fbf5eb] border-[3px] border-black p-4 rounded-xl shadow-[6px_6px_0px_#000] max-w-sm w-full font-mono text-black">
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#8b5a2b] flex items-center gap-1">🛡️ ID DO VIAJANTE & FICHA RPG</span>
                <button 
                  onClick={() => setShowPassport(false)}
                  className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded border border-black flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-y-0.5"
                >
                  X
                </button>
              </div>

              {/* Tabs selector */}
              <div className="grid grid-cols-2 gap-1 mb-3">
                <button
                  onClick={() => {
                    setPassportTab("attributes");
                    playSynthSound("beep");
                  }}
                  className={`py-1 text-[9px] sm:text-[10px] font-bold border-2 border-black rounded transition shadow-[1px_1.5px_0_#000] active:translate-y-0.5 ${
                    passportTab === "attributes" ? "bg-amber-400 text-black" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🛡️ Atributos & RPG
                </button>
                <button
                  onClick={() => {
                    setPassportTab("credentials");
                    playSynthSound("beep");
                  }}
                  className={`py-1 text-[9px] sm:text-[10px] font-bold border-2 border-black rounded transition shadow-[1px_1.5px_0_#000] active:translate-y-0.5 ${
                    passportTab === "credentials" ? "bg-cyan-400 text-black" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🔑 Credenciais Stellar
                </button>
              </div>
              
              {/* Content Body */}
              <div className="space-y-3 text-xs text-left">
                {passportTab === "attributes" ? (
                  <div className="space-y-2.5">
                    {/* Character snapshot card */}
                    <div className="bg-[#ebd9c0]/40 p-2.5 border-2 border-dashed border-[#8b5a2b]/50 rounded-lg flex gap-3 items-center">
                      {/* Live avatar visualization */}
                      <div className="w-12 h-12 rounded border border-black/15 bg-white flex flex-col items-center justify-center relative shrink-0">
                        {/* Skin & head preview */}
                        <div 
                          className="w-6 h-6 rounded-md border border-black/20"
                          style={{ backgroundColor: playerPos.skinColor }}
                        >
                          {/* Face simulation */}
                          <div className="text-center text-[10px] leading-tight select-none mt-0.5">
                            {playerPos.faceType === "smile" ? "🙂" : playerPos.faceType === "cool" ? "😎" : "😐"}
                          </div>
                        </div>
                        {/* Torso block */}
                        <div 
                          className="w-7 h-2.5 border-x border-b border-black/20 -mt-0.5"
                          style={{ backgroundColor: playerPos.torsoColor }}
                        />
                        {/* Shoes color */}
                        <div 
                          className="w-6 h-1 border-b border-black/20 -mt-0.5"
                          style={{ backgroundColor: playerPos.shoesColor }}
                        />
                      </div>
                      
                      {/* Name and class info */}
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none block ${
                          gameState.quests.hold.status === "completed"
                            ? "text-amber-600 drop-shadow-[0_0_2px_rgba(217,119,6,0.3)]"
                            : gameState.quests.soroban.status === "completed"
                            ? "text-purple-600 drop-shadow-[0_0_2px_rgba(147,51,234,0.3)]"
                            : gameState.quests.onramp.status === "completed"
                            ? "text-green-600 drop-shadow-[0_0_2px_rgba(22,163,74,0.3)]"
                            : gameState.quests.wallet.status === "completed"
                            ? "text-cyan-600 drop-shadow-[0_0_2px_rgba(8,145,178,0.3)]"
                            : "text-slate-800"
                        }`}>
                          {getFormattedName()}
                        </span>
                        <span className="text-[8.5px] font-bold text-amber-800 leading-none block uppercase">
                          Lvl {completedCount + 1} | {playerTitle}
                        </span>
                        <span className="text-[7.5px] text-slate-500 font-semibold block leading-tight truncate">
                          📍 {currentRegion}
                        </span>
                      </div>
                    </div>

                    {/* RPG Attributes Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                        <span className="text-slate-500">💪 Força (STR):</span>
                        <span className="font-extrabold text-red-700">{attrStr}</span>
                      </div>
                      <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                        <span className="text-slate-500">🔮 Inteligência (INT):</span>
                        <span className="font-extrabold text-blue-700">{attrInt}</span>
                      </div>
                      <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                        <span className="text-slate-500">⚡ Agilidade (AGI):</span>
                        <span className="font-extrabold text-amber-700">{attrAgi}</span>
                      </div>
                      <div className="bg-white border border-black/15 p-1.5 rounded flex justify-between items-center">
                        <span className="text-slate-500">🛡️ Resistência (RES):</span>
                        <span className="font-extrabold text-emerald-700">{attrRes}</span>
                      </div>
                    </div>

                    {/* Stellar Faith and Power stats */}
                    <div className="bg-white border border-black/15 p-2 rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-700">
                        <span>✨ Sincronia Stellar (Fé):</span>
                        <span className="text-cyan-700 font-extrabold">{attrFaith} Pts</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded border border-black/5 overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 transition-all duration-300" 
                          style={{ width: `${Math.min(attrFaith, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Current Objective banner */}
                    <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-md">
                      <span className="text-[7px] text-emerald-800 block font-bold uppercase tracking-wider leading-none">Objetivo de Missão</span>
                      <span className="text-[9.5px] font-bold text-emerald-950 block leading-tight mt-0.5">
                        {currentActiveQuest?.title}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">Endereço Público (Stellar Account ID)</span>
                      {gameState.wallet.hasWallet ? (
                        <div className="flex gap-1.5 mt-1">
                          <span className="text-[9px] bg-white border border-black/15 px-2 py-1.5 rounded flex-1 select-all break-all overflow-hidden font-bold leading-tight">
                            {gameState.wallet.publicKey}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(gameState.wallet.publicKey);
                              playSynthSound("coin");
                              alert("Endereço público copiado!");
                            }}
                            className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-2 text-[9px] font-black shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                          >
                            Copiar
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-600 font-black uppercase text-[8.5px] animate-pulse block mt-1">[ SEM CARTEIRA ATIVA! Fale com o Frank ]</span>
                      )}
                    </div>
                    
                    {gameState.wallet.hasWallet && (
                      <div>
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Chave Privada Secreta (Seed)</span>
                        <div className="flex gap-1.5 mt-1">
                          <span className="text-[8.5px] bg-red-50 text-red-900 border border-red-200 px-2 py-1.5 rounded flex-1 select-all break-all overflow-hidden font-bold leading-tight flex items-center min-w-0">
                            <span className="truncate flex-1">
                              {passportSecVisible ? gameState.wallet.secretKey : "S" + "•".repeat(55)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPassportSecVisible(!passportSecVisible);
                              playSynthSound("beep");
                            }}
                            className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-1.5 flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                            title={passportSecVisible ? "Ocultar Chave" : "Mostrar Chave"}
                          >
                            {passportSecVisible ? <EyeOff className="h-3 w-3 text-slate-600" /> : <Eye className="h-3 w-3 text-slate-600" />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(gameState.wallet.secretKey);
                              playSynthSound("coin");
                              alert("Chave secreta copiada!");
                            }}
                            className="bg-white hover:bg-[#fbf5eb] border-2 border-black rounded px-2 text-[9px] font-black shadow-[1.5px_1.5px_0_#000] active:translate-y-0.5 active:shadow-none"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}

                    {gameState.wallet.hasWallet && (
                      <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-2 mt-2 bg-white/40 p-2 rounded">
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">Nome do Perfil</span>
                          <span className="text-[9.5px] text-slate-900 font-extrabold leading-tight block mt-0.5">{gameState.wallet.name || "Sem Nome"}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">E-mail SDK</span>
                          <span className="text-[9.5px] text-slate-900 font-extrabold leading-tight block mt-0.5 truncate" title={gameState.wallet.email}>{gameState.wallet.email || "Sem E-mail"}</span>
                        </div>
                        <div className="col-span-2 mt-1">
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">Senha PIN</span>
                          <span className="text-[10.5px] font-mono font-extrabold text-orange-800 tracking-wider leading-none block mt-0.5">🔑 {gameState.wallet.pin || "------"}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-[#ebd9c0]/50 p-2 rounded border border-black/10 text-[8px] text-[#543b2a] leading-relaxed font-semibold mt-2">
                      ⚠️ Essa carteira é gerada e mantida localmente para fins educacionais de simulação da rede Stellar. Nunca deposite dinheiro real neste par de chaves de testes.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2.5 COMPLETE WORLD MAP MODAL SHORTCUT */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs pointer-events-auto select-none animate-fade-in">
            <div className="bg-[#ebd9c0] border-4 border-[#5c3e21] p-5 rounded-2xl shadow-[4px_6px_0px_#27190c] max-w-lg w-full text-[#3e2714] relative flex flex-col gap-4 font-sans border-double">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#8b5c30]/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg uppercase tracking-wide text-[#5c3e21]">Mapa de Stellar</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-700 font-mono font-medium">Guia de Viagem das Rúnias e Portais</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMapModal(false);
                    playSynthSound("beep");
                  }}
                  className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white border-2 border-black rounded flex items-center justify-center shadow-[1.5px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer font-bold text-xs"
                >
                  X
                </button>
              </div>

              {/* Map Layout Diagram */}
              <div className="flex flex-col items-center gap-3 bg-[#dfcca7]/50 p-4 rounded-xl border-2 border-[#5c3e21]/20">
                
                {/* 1. NORTH WORLD */}
                <div className="flex flex-col items-center">
                  <div className={`w-36 px-2.5 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
                    playerPos.mapId === "north" 
                      ? "bg-cyan-100 border-cyan-600 ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#dfcca7]" 
                      : "bg-[#f5ebd3] border-[#5c3e21]/60"
                  }`}>
                    {playerPos.mapId === "north" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
                    <div className="text-[10px] font-extrabold text-cyan-800">Porto de Cargas</div>
                    <div className="text-[8px] text-slate-600 font-medium">Praia dos Anchors [Norte]</div>
                  </div>
                  {/* Vertical Connection */}
                  <div className="h-4 w-0.5 bg-dashed border-l-2 border-[#5c3e21]/40"></div>
                </div>

                {/* 2. WEST, CENTER, EAST ROW */}
                <div className="flex items-center gap-2 sm:gap-4 w-full justify-center">
                  {/* WEST WORLD */}
                  <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
                    playerPos.mapId === "west" 
                      ? "bg-purple-100 border-purple-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-[#dfcca7]" 
                      : "bg-[#f5ebd3] border-[#5c3e21]/60"
                  }`}>
                    {playerPos.mapId === "west" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
                    <div className="text-[10px] font-extrabold text-purple-800">Plataforma Soroban</div>
                    <div className="text-[8px] text-slate-600 font-medium">Cypherpunk [Oeste]</div>
                  </div>

                  {/* Horizontal Connector Left */}
                  <div className="w-2 sm:w-4 h-0.5 border-t-2 border-dashed border-[#5c3e21]/40"></div>

                  {/* CENTER WORLD */}
                  <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
                    (!playerPos.mapId || playerPos.mapId === "center") 
                      ? "bg-emerald-100 border-emerald-600 ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#dfcca7]" 
                      : "bg-[#f5ebd3] border-[#5c3e21]/60"
                  }`}>
                    {(!playerPos.mapId || playerPos.mapId === "center") && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
                    <div className="text-[10px] font-extrabold text-emerald-800">Praça Central</div>
                    <div className="text-[8px] text-slate-600 font-medium">Ponto Inicial [Centro]</div>
                  </div>

                  {/* Horizontal Connector Right */}
                  <div className="w-2 sm:w-4 h-0.5 border-t-2 border-dashed border-[#5c3e21]/40"></div>

                  {/* EAST WORLD */}
                  <div className={`w-28 sm:w-32 px-2 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
                    playerPos.mapId === "east" 
                      ? "bg-amber-100 border-amber-600 ring-2 ring-amber-400 ring-offset-1 ring-offset-[#dfcca7]" 
                      : "bg-[#f5ebd3] border-[#5c3e21]/60"
                  }`}>
                    {playerPos.mapId === "east" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
                    <div className="text-[10px] font-extrabold text-amber-800">Templo Stellar</div>
                    <div className="text-[8px] text-slate-600 font-medium">Cavernas [Leste]</div>
                  </div>
                </div>

                {/* 3. SOUTH WORLD */}
                <div className="flex flex-col items-center">
                  {/* Vertical Connection */}
                  <div className="h-4 w-0.5 bg-dashed border-l-2 border-[#5c3e21]/40"></div>
                  <div className={`w-36 px-2.5 py-1.5 rounded-lg border-2 text-center shadow-[1.5px_2px_0px_#000] relative ${
                    playerPos.mapId === "south" 
                      ? "bg-yellow-100 border-yellow-600 ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#dfcca7]" 
                      : "bg-[#f5ebd3] border-[#5c3e21]/60"
                  }`}>
                    {playerPos.mapId === "south" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-[7px] font-bold px-1 py-0.2 rounded uppercase animate-bounce font-mono">Aqui 📍</span>}
                    <div className="text-[10px] font-extrabold text-yellow-800">Santuário Holder</div>
                    <div className="text-[8px] text-slate-600 font-medium">Floresta [Sul]</div>
                  </div>
                </div>

              </div>

              {/* Informational Details / Instructions */}
              <div className="bg-[#fcf8f2] p-3 rounded-lg border border-[#8b5c30]/20 text-[9.5px] leading-relaxed flex flex-col gap-1.5 font-mono">
                <div className="font-bold uppercase text-[#5c3e21] border-b border-[#8b5c30]/20 pb-0.5 mb-0.5">ℹ️ Portais de Viagem Livre:</div>
                <div className="text-emerald-700 font-bold text-center py-0.5 bg-emerald-50 rounded border border-emerald-200">
                  ✨ TODOS OS PORTAIS ESTÃO 100% LIBERADOS E ABERTOS! ✨
                </div>
                <div className="text-slate-600 text-[9px] leading-normal">
                  As rotas para o Leste, Norte, Oeste e Sul estão totalmente desbloqueadas para livre ida e volta. Cada bioma funciona de forma isolada, sendo uma área fechada com apenas o portal de retorno ligando de volta à Praça Central.
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-500 font-semibold font-mono uppercase tracking-wider">
                Dica: Pressione <span className="bg-[#5c3e21]/15 text-[#3e2714] px-1 py-0.5 rounded border border-black/10 font-bold">[ M ]</span> para fechar
              </div>

            </div>
          </div>
        )}

      </div>

      {/* 3. TRANSACTIONAL SMART CONTRACTS MODALS */}
      <GameOverlay
        activeModal={gameState.activeModal}
        wallet={gameState.wallet}
        onClose={() => setGameState((prev) => ({ ...prev, activeModal: null }))}
        onWalletCreated={handleWalletCreated}
        onOnRampSuccess={handleOnRampSuccess}
        onSwapSuccess={handleSwapSuccess}
        onHoldSuccess={handleHoldSuccess}
        onUpdateWallet={handleUpdateWallet}
        playerName={getFormattedName()}
      />

      {/* SUBTLE IMMERSIVE CREDITS TEXT IN OUTER SPACE */}
      <div className="absolute bottom-1 md:bottom-2 text-[8px] sm:text-[9.5px] text-white/35 font-mono pointer-events-none select-none tracking-wider text-center">
        Stellar Onboarding Island • GameFiNow Engine v2.5 • Ledger: <span className="text-[#5db81d] font-bold">#28,492 (ACTIVE)</span>
      </div>

    </div>
  );
}
