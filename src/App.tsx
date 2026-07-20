/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { GameOverlay } from "./components/GameOverlay";
import { FloatingWindows } from "./components/FloatingWindows";
import { LoginScreen } from "./components/LoginScreen";
import { MapModal } from "./components/MapModal";
import { PassportModal } from "./components/PassportModal";
import { DialogSystem } from "./components/DialogSystem";
import ReactNipple from "react-nipple";
import { GameState, Player, NPC, Transaction, QuestId, Quest, WalletState } from "./types";
import { INITIAL_QUESTS, INITIAL_NPCS } from "./gameData";
import { getNpcsForMap } from "./maps";
import { useGameStore } from "./store/gameStore";
import { fetchOnChainBalances } from "./services/stellarServices";
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
  const gameState = useGameStore();
  const setGameState = useGameStore((s) => s.setGameState);
  const playerPos = useGameStore((s) => s.playerPos);
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);

  const [npcs] = useState<NPC[]>(INITIAL_NPCS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Handle active retro floating window overlays: "customizer" | "backpack" | "ledger" | "guide" | null
  const [activeWindow, setActiveWindow] = useState<"customizer" | "backpack" | "ledger" | "guide" | null>(null);
  const [showPassport, setShowPassport] = useState(false);
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
  // And fetch real on-chain balances from testnet!
  useEffect(() => {
    const interval = setInterval(async () => {
      // Advance Ledger sequence
      setGameState((prev) => ({
        ...prev,
        currentLedger: prev.currentLedger + 1,
      }));

      // Acessando gameState mais recente via currentLedger tick 
      // Mas para evitar stale state do gameState inteiro no closure, 
      // faremos um setGameState com callback onde resolvemos de forma limpa.
      setGameState((prev) => {
        if (prev.wallet.hasWallet && prev.wallet.publicKey) {
          fetchOnChainBalances(prev.wallet.publicKey).then(balances => {
            if (balances) {
              setGameState(current => {
                // Previne re-renders desnecessarios se os saldos forem exatamente os mesmos
                if (
                  current.wallet.xlmBalance === balances.xlmBalance && 
                  current.wallet.usdwBalance === balances.usdwBalance && 
                  current.wallet.brwBalance === balances.brwBalance
                ) {
                  return current;
                }
                
                return {
                  ...current,
                  wallet: {
                    ...current.wallet,
                    xlmBalance: balances.xlmBalance,
                    usdwBalance: balances.usdwBalance,
                    brwBalance: balances.brwBalance,
                  }
                };
              });
            }
          });
        }
        return prev;
      });
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

  const handleOnRampSuccess = (asset: "XLM" | "USDW" | "BRW", amountAdded: number, method: "PIX" | "CARD") => {
    playSynthSound("coin");
    setGameState((prev) => {
      const newTx: Transaction = {
        id: generateTxHash(),
        type: method === "PIX" ? "ON_RAMP_PIX" : "ON_RAMP_CARD",
        timestamp: new Date().toLocaleTimeString(),
        amount: amountAdded.toString(),
        asset: asset,
        fee: "0.00001",
        memo: `Depósito via ${method}`,
        ledgerSequence: prev.currentLedger,
      };

      const updatedQuests = { ...prev.quests };
      updatedQuests.onramp.status = "completed";
      updatedQuests.soroban.status = "active";

      const balanceField = asset === "XLM" ? "xlmBalance" : asset === "USDW" ? "usdwBalance" : "brwBalance";

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          [balanceField]: (prev.wallet[balanceField] || 0) + amountAdded,
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
        // Prevent default scroll on Space
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();

        if (gameState.activeDialog) {
          // Avança diálogo se tiver um ativo
          handleAdvanceDialog();
        } else if (!gameState.activeModal) {
          // Abre terminal se jogador estiver próximo e não tiver modal aberto
          handleTriggerModal();
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
  }, [gameState.activeDialog, gameState.activeModal, isNearTerminal]);

  const activeQuestsArray = Object.values(gameState.quests) as Quest[];
  const completedCount = activeQuestsArray.filter(q => q.status === "completed").length;
  const progressPercent = Math.round((completedCount / activeQuestsArray.length) * 100);
  const isCompletedAll = gameState.quests.hold.status === "completed";

  let currentActiveQuest = activeQuestsArray.find(q => q.status === "active");
  if (!currentActiveQuest && isCompletedAll) {
    currentActiveQuest = {
      id: "all_done" as any,
      title: "Novas missões em breve...",
      description: "Você se tornou um Lendário. Aguarde por novas atualizações, missões e aventuras que serão adicionadas em breve! Continue explorando.",
      status: "completed"
    };
  } else if (!currentActiveQuest) {
    currentActiveQuest = activeQuestsArray[activeQuestsArray.length - 1];
  }

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
    <div className="w-screen h-screen bg-[#0c0d0e] flex flex-col selection:bg-[#ffc600] selection:text-black font-sans relative overflow-hidden select-none outline-none" tabIndex={0}>
      
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
              
              {gameState.quests.onramp.status === "completed" && (
                <>
                  <span className="text-sm animate-pulse" title="💰 Investidor (Ativo no Mercado)">💰</span>
                  <span className="text-sm animate-pulse" title="⚡ Aura de Velocidade (+10%)">⚡</span>
                </>
              )}

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

        <DialogSystem
          activeDialog={gameState.activeDialog}
          isNearTerminal={isNearTerminal}
          handleAdvanceDialog={handleAdvanceDialog}
          handleTriggerModal={handleTriggerModal}
        />

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

        {/* MOBILE JOYSTICK TOUCH PAD AND ACTION BUTTON */}
        {!gameState.activeDialog && (
          <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-between items-end px-6 pointer-events-none md:hidden">
            
            {/* Joystick no lado esquerdo */}
            <div className="pointer-events-auto bg-[#ece9df] border-2 border-black rounded-full p-2 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] opacity-80">
              <ReactNipple
                options={{
                  mode: "static",
                  position: { top: "50%", left: "50%" },
                  size: 90,
                  color: "black",
                }}
                style={{
                  width: 90,
                  height: 90,
                  position: "relative",
                }}
                onMove={(evt: any, data: any) => {
                  if (data && data.direction) {
                    handleMoveButtonPress(data.direction.angle); // 'up', 'down', 'left', 'right'
                  }
                }}
                onEnd={() => {
                  // Parar de mover
                  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
                  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
                  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
                  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
                }}
              />
            </div>

            {/* Action button no lado direito */}
            <div className="pointer-events-auto bg-[#ece9df] border-2 border-black rounded-full p-1.5 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] opacity-80 mb-2">
              <button 
                id="btn-action"
                onClick={(e) => {
                  e.preventDefault();
                  // Simulate space bar press for ALL interactions (GameCanvas & App)
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
                  setTimeout(() => {
                    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
                  }, 50);
                }}
                className="w-16 h-16 bg-[#ffc600] hover:bg-[#e6b300] text-black rounded-full border-2 border-black cursor-pointer text-sm font-bold active:translate-y-1 flex items-center justify-center shadow-[0_4px_0_#000] active:shadow-none"
              >
                AÇÃO
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
        <PassportModal 
          showPassport={showPassport}
          setShowPassport={setShowPassport}
          playerPos={playerPos}
          gameState={gameState}
          getFormattedName={getFormattedName}
          playSynthSound={playSynthSound}
          completedCount={completedCount}
          playerTitle={playerTitle}
          currentRegion={currentRegion}
          attrStr={attrStr}
          attrInt={attrInt}
          attrAgi={attrAgi}
          attrRes={attrRes}
          attrFaith={attrFaith}
          currentActiveQuest={currentActiveQuest}
        />

        {/* 2.5 COMPLETE WORLD MAP MODAL SHORTCUT */}
        {showMapModal && (
          <MapModal 
            showMapModal={showMapModal} 
            setShowMapModal={setShowMapModal} 
            playerPos={playerPos} 
          />
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
