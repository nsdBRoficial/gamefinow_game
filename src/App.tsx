/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GameFiNow - v0.8.2
 * A Gamified On-Boarding Experience for the Stellar Ecosystem
 *
 * Main Application Component — orchestrates routing between:
 *   - LandingPage (welcome screen / marketing)
 *   - LoginScreen (character creation & authentication)
 *   - Main Game Loop (GameCanvas + HUD + Modals)
 *
 * Core Architecture:
 *   - State: Zustand (gameStore.ts) + local React state
 *   - i18n: react-i18next (EN/PT/ES via src/i18n/locales/*.json)
 *   - Rendering: HTML5 Canvas 60 FPS (GameCanvas.tsx)
 *   - Blockchain: Stellar Testnet via WalletNow SDK & Horizon API
 *
 * Changelog v0.8.2:
 *   - Full i18n support: English (default), Portuguese, Spanish
 *   - Redesigned animated Login Screen with particle effects
 *   - New Landing Page with hero section and CTA button
 *   - All NPC dialogues and quest texts migrated to i18n JSON
 *   - Improved James NPC storyline and all NPC lore
 *   - Fixed all hardcoded Portuguese strings in UI/HUD
 *   - TypeScript errors resolved (Quest type, t() hook scoping)
 *   - QA pass: tsc --noEmit clean
 */

import React, { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { BattleHUD } from "./components/BattleHUD";
import { GameOverlay, MiningRewardModal } from "./components/GameOverlay";
import { FloatingWindows } from "./components/FloatingWindows";
import { LoginScreen } from "./components/LoginScreen";
import { LandingPage } from "./components/LandingPage";
import { MapModal } from "./components/MapModal";
import { PassportModal } from "./components/PassportModal";
import { DialogSystem } from "./components/DialogSystem";
import { OutfitShopModal } from "./components/OutfitShopModal";
import { ChatBox, OnlineIndicator } from "./components/ChatBox";
import { WelcomeTutorialModal } from "./components/WelcomeTutorialModal";
import { Level5IntroModal } from "./components/Level5IntroModal";
import { DeathScreenModal } from "./components/DeathScreenModal";
import { ActiveBuffsHUD } from "./components/ActiveBuffsHUD";
import { ClassSelectionModal } from "./components/ClassSelectionModal";
import { GuildModal } from "./components/GuildModal";
import { AccountRecoveryModal } from "./components/AccountRecoveryModal";
import { audioStreamService } from "./services/audioStreamService";
import { calculateEffectiveStats } from "./classesData";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { getOrCreatePlayerId, subscribeToGlobalEvents, getSocket } from "./services/multiplayerService";
import ReactNipple from "react-nipple";
import { useTranslation } from "react-i18next";
import { GameState, Player, NPC, Transaction, QuestId, Quest, WalletState } from "./types";
import { INITIAL_QUESTS, INITIAL_NPCS, GRID_COLS, GRID_ROWS, isCollidable, isBridgeBlocked } from "./gameData";
import { getNpcsForMap, getMapGrid, MapId } from "./maps";
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
  const { t } = useTranslation();
  const gameState = useGameStore();
  const setGameState = useGameStore((s) => s.setGameState);
  const playerPos = useGameStore((s) => s.playerPos);
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);
  const setBattleMode = useGameStore((s) => s.setBattleMode);

  const [npcs] = useState<NPC[]>(INITIAL_NPCS);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Auto-dismiss do banner de Level Up após 3 segundos (via useEffect correto)
  React.useEffect(() => {
    if (!gameState.pendingLevelUp) return;
    const timer = setTimeout(() => {
      setGameState((prev) => ({ ...prev, pendingLevelUp: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [gameState.pendingLevelUp]);

  const [showNetworkError, setShowNetworkError] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Verificação de Modo GM via URL + Token
  const isGmMode = new URLSearchParams(window.location.search).get("mode") === "gm" && localStorage.getItem("admin_token") !== null;
  const [isLoggedIn, setIsLoggedIn] = useState(isGmMode);
  const [hasStarted, setHasStarted] = useState(isGmMode);

  useEffect(() => {
    if (isGmMode) {
      setPlayerPos((prev) => ({
        ...prev,
        name: "GM",
        isGM: true,
        level: 99,
        hp: 9999,
        maxHp: 9999,
        attack: 9999,
        defense: 9999,
        speed: 9999,
      }));
      setGameState((prev) => {
        const gmQuests = { ...prev.quests };
        gmQuests.wallet.status = "completed";
        gmQuests.onramp.status = "completed";
        gmQuests.soroban.status = "completed";
        gmQuests.hold.status = "completed";
        return { ...prev, quests: gmQuests };
      });
    } else if (playerPos.isGM) {
      setPlayerPos((prev) => ({ ...prev, isGM: false }));
    }
  }, [isGmMode, setPlayerPos, setGameState]);

  // ─── MULTIPLAYER: ID do jogador baseado na wallet Stellar (ou GM) ───
  const playerId = isGmMode ? "gm_admin" : getOrCreatePlayerId(gameState.wallet.publicKey || undefined);

  // ─── MULTIPLAYER: Hook de sincronização em tempo real ────────────────────────
  const {
    onlinePlayers,
    onlineCount,
    chatMessages,
    sendChat,
    isConnected,
    isMultiplayerEnabled,
  } = useMultiplayer({
    playerId,
    playerPos,
    setPlayerPos,
    gameState,
  });

  const [showLevel5IntroDelayed, setShowLevel5IntroDelayed] = useState(false);

  useEffect(() => {
    // Se o player é level 5+, está no center, e ainda não viu o modal
    if ((gameState.level || 1) >= 5 && playerPos.mapId === "center" && !gameState.hasSeenLevel5Intro && gameState.hasSeenTutorial) {
      const t = setTimeout(() => {
        setShowLevel5IntroDelayed(true);
      }, 10000);
      return () => clearTimeout(t);
    } else {
      setShowLevel5IntroDelayed(false);
    }
  }, [gameState.level, playerPos.mapId, gameState.hasSeenLevel5Intro, gameState.hasSeenTutorial]);

  // Handle active retro floating window overlays: "customizer" | "backpack" | "ledger" | "guide" | null
  const [activeWindow, setActiveWindow] = useState<"customizer" | "backpack" | "ledger" | "guide" | null>(null);
  const [showActiveQuest, setShowActiveQuest] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showLegendaryRibbon, setShowLegendaryRibbon] = useState(false);

  // Buscar dados do Leaderboard (Top 5 XP)
  useEffect(() => {
    if (showLeaderboard) {
      const fetchLeaderboard = () => {
        import("./services/multiplayerService").then((m) => {
          m.fetchTopPlayers(5).then(setLeaderboardData);
        });
      };

      fetchLeaderboard(); // Busca imediata ao abrir ou ao ganhar XP local
      
      // Atualiza a cada 5 segundos para ver o XP de outros jogadores em tempo real
      const interval = setInterval(fetchLeaderboard, 5000);
      
      return () => clearInterval(interval);
    }
  }, [showLeaderboard, gameState.xp_current]);

  // Compute hasStar for Battle Mode — only checks the 4 blockchain quests, NOT kill quests
  const hasCompletedAllQuests = ["wallet", "onramp", "soroban", "hold"].every(
    (id) => gameState.quests[id]?.status === "completed"
  );
  const hasStar = playerPos.isGM || hasCompletedAllQuests;
  const [showPassport, setShowPassport] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    // 1. Força o Nível 5 para jogadores que já concluíram todas as quests (Herói Lendário) e estão abaixo do Nível 5
    const p = useGameStore.getState().playerPos;
    if (hasStar && (gameState.level || 1) < 5) {
      setGameState({ xp_current: 1600, level: 5 });
      setPlayerPos({
        maxHp: 200,
        hp: 200,
        maxMp: 90,
        mp: 90
      });
    } 
    // 2. Sincronizar maxHp/maxMp antigos com o Level atual do jogador
    else if (gameState.level && p.maxHp) {
      const expectedHp = 100 + ((gameState.level - 1) * 25);
      const expectedMp = 50 + ((gameState.level - 1) * 10);
      if (p.maxHp !== expectedHp || p.maxMp !== expectedMp) {
        setPlayerPos({
          maxHp: expectedHp,
          hp: (p.hp === p.maxHp || !p.hp) ? expectedHp : p.hp,
          maxMp: expectedMp,
          mp: (p.mp === p.maxMp || !p.mp) ? expectedMp : p.mp,
        });
      }
    }
  }, [hasStar, gameState.level, setGameState, setPlayerPos]);

  // Quando o jogador obtém a Estrela de Guardião, ativa a Kill Quest do Centro
  useEffect(() => {
    if (hasStar && gameState.quests.kill_center?.status === "locked") {
      setGameState((prev) => ({
        ...prev,
        quests: {
          ...prev.quests,
          kill_center: { ...prev.quests.kill_center, status: "active" },
        },
      }));
    }
  }, [hasStar, gameState.quests.kill_center?.status, setGameState]);

  // Auto-Regeneration (1 HP and 1 MP per second)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerPos(prev => {
        if (prev.hp === undefined || prev.mp === undefined || !prev.maxHp || !prev.maxMp) return prev;
        if (prev.hp >= prev.maxHp && prev.mp >= prev.maxMp) return prev;
        
        return {
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + 1),
          mp: Math.min(prev.maxMp, prev.mp + 1)
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setPlayerPos]);

  useEffect(() => {
    if (isMultiplayerEnabled) {
      subscribeToGlobalEvents(
        ({ msg, from }) => {
          setGameState((prev) => ({
            ...prev,
            activeDialog: {
              npcName: `ANÚNCIO: ${from}`,
              text: [msg],
              currentStep: 0,
              npcId: "system",
            },
          }));
        },
        ({ reason }) => {
          console.error(`[App] JOGADOR KICKADO: ${reason}`);
          sessionStorage.removeItem("gfn_player_session_id");
          sessionStorage.removeItem("guest_name");
          localStorage.removeItem("stellar_public_key");
          // Mostra na propria pagina de forma obvia e para o app
          document.body.innerHTML = `
            <div style="background-color: black; color: red; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: monospace;">
              <h1>CONTA SUSPENSA</h1>
              <p>${reason}</p>
              <button onclick="window.location.reload()" style="margin-top:20px; padding: 10px 20px; background: red; color: white; border: none; cursor: pointer;">Voltar</button>
            </div>
          `;
        },
        ({ mapId }) => {
          setPlayerPos((prev) => ({
            ...prev,
            mapId: mapId as any,
            x: 30,
            y: 30,
            targetX: 30,
            targetY: 30,
            isMoving: false,
            dir: "down",
          }));
        }
      );

      const handleMaintenance = (data: { active: boolean }) => {
        setIsMaintenance(data.active);
      };
      const socket = getSocket();
      if (socket) {
        socket.on("maintenance_mode", handleMaintenance);
      }
      return () => {
        if (socket) socket.off("maintenance_mode", handleMaintenance);
      }
    }
  }, [isMultiplayerEnabled, setGameState, setPlayerPos]);

  // Trilha e Efeitos do Anfiteatro
  useEffect(() => {
    if (playerPos.mapId === "amphitheater") {
      audioStreamService.startAmphitheaterBgm();
    } else {
      audioStreamService.stopAmphitheaterBgm();
    }
  }, [playerPos.mapId]);

  const handleResetAndNewCharacter = () => {
    try {
      localStorage.removeItem("stellar_island_game_state_v3");
      localStorage.removeItem("stellar_island_player_pos_v3");
      localStorage.removeItem("walletnow_stellar_sk");
      localStorage.removeItem("walletnow_stellar_pk");
    } catch (e) {
      console.warn("Could not clean localStorage", e);
    }
    
    window.location.reload();
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
  const [isNearTerminal, setIsNearTerminal] = useState<"wallet" | "onramp" | "soroban" | "hold" | "atf" | "p2p_store" | "burn_altar" | "gamefi_faucet" | "outfit_shop" | "mine" | null>(null);

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

  // Auto-cura passiva (1 HP por segundo fora de batalha)
  useEffect(() => {
    const healInterval = setInterval(() => {
      const state = useGameStore.getState();
      const p = state.playerPos;
      if (!state.isBattleModeActive && p.hp !== undefined && p.maxHp !== undefined) {
        if (p.hp < p.maxHp) {
          state.setPlayerPos({
            hp: Math.min((p.hp || 0) + 1, p.maxHp || 100)
          });
        }
      }
    }, 1000);
    return () => clearInterval(healInterval);
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
        const currentDialog = prev.activeDialog;
        const jamesList = prev.jamesDialogsDone || [];

        // Se o diálogo concluído foi com o James [NPC] (id "guide"), registra o avanço do diálogo
        let updatedJamesList = [...jamesList];
        if (currentDialog && currentDialog.npcId === "guide") {
          if (prev.quests.wallet.status === "active" && !updatedJamesList.includes("guide_initial")) {
            updatedJamesList.push("guide_initial");
          } else if (prev.quests.wallet.status === "completed" && prev.quests.onramp.status === "active" && !updatedJamesList.includes("guide_wallet_done")) {
            updatedJamesList.push("guide_wallet_done");
          } else if (prev.quests.onramp.status === "completed" && prev.quests.soroban.status === "active" && !updatedJamesList.includes("guide_onramp_done")) {
            updatedJamesList.push("guide_onramp_done");
          } else if (prev.quests.soroban.status === "completed" && prev.quests.hold.status === "active" && !updatedJamesList.includes("guide_soroban_done")) {
            updatedJamesList.push("guide_soroban_done");
          } else if (prev.quests.hold.status === "completed" && !updatedJamesList.includes("guide_all_completed")) {
            updatedJamesList.push("guide_all_completed");
          }
          if (prev.quests.kill_south?.status === "completed" && !updatedJamesList.includes("james_kill_all_done")) {
            updatedJamesList.push("james_kill_all_done");
          }
        }

        // ── Kill Quest sequencial: Se James acaba de confirmar e a próxima kill está pendente ──
        let updatedQuestsForKill = { ...prev.quests };
        if (currentDialog && currentDialog.npcId === "guide") {
          // Sequência: center→east→north→west→south
          const killSequence = ["kill_center", "kill_east", "kill_north", "kill_west", "kill_south"] as const;
          for (const killId of killSequence) {
            const kq = updatedQuestsForKill[killId as keyof typeof updatedQuestsForKill] as any;
            if (kq && kq.pendingActivation && kq.status !== "active" && kq.status !== "completed") {
              updatedQuestsForKill = {
                ...updatedQuestsForKill,
                [killId]: { ...kq, status: "active", pendingActivation: false },
              };
              // Registra confirmação desta kill no James
              if (!updatedJamesList.includes(`james_kill_${killId}`)) {
                updatedJamesList.push(`james_kill_${killId}`);
              }
              break; // Ativa apenas uma por vez
            }
          }
        }

        return {
          ...prev,
          quests: updatedQuestsForKill,
          activeDialog: null,
          activeModal: nextModal,
          jamesDialogsDone: updatedJamesList,
        };
      });
    }
  };

  const handleTalkToNPC = (npc: NPC) => {
    playSynthSound("beep");

    let dialogKey = `npcs.${npc.id}.dialogs`;
    if (npc.questTrigger) {
      const activeQuest = gameState.quests[npc.questTrigger];
      if (activeQuest.status === "active" && npc.activeQuestDialogs) {
        dialogKey = `npcs.${npc.id}.activeQuestDialogs`;
      } else if (activeQuest.status === "completed") {
        dialogKey = `npcs.${npc.id}.completedDialogs`;
      }
    } else if (npc.id === "guide") {
      const jamesList = gameState.jamesDialogsDone || [];
      const walletStatus = gameState.quests.wallet.status;
      const onrampStatus = gameState.quests.onramp.status;
      const sorobanStatus = gameState.quests.soroban.status;
      const holdStatus = gameState.quests.hold.status;

      if (walletStatus === "active") {
        if (!jamesList.includes("guide_initial")) {
          dialogKey = "dialogs.guide.q1_initial";
        } else {
          dialogKey = "dialogs.guide.q1_active";
        }
      } else if (walletStatus === "completed" && onrampStatus === "active") {
        if (!jamesList.includes("guide_wallet_done")) {
          dialogKey = "dialogs.guide.q1_done_q2_start";
        } else {
          dialogKey = "dialogs.guide.q2_active";
        }
      } else if (onrampStatus === "completed" && sorobanStatus === "active") {
        if (!jamesList.includes("guide_onramp_done")) {
          dialogKey = "dialogs.guide.q2_done_q3_start";
        } else {
          dialogKey = "dialogs.guide.q3_active";
        }
      } else if (sorobanStatus === "completed" && holdStatus === "active") {
        if (!jamesList.includes("guide_soroban_done")) {
          dialogKey = "dialogs.guide.q3_done_q4_start";
        } else {
          dialogKey = "dialogs.guide.q4_active";
        }
      } else if (holdStatus === "completed") {
        // ── Kill Quests sequenciais ──
        const killCenter = gameState.quests.kill_center;
        const killEast = gameState.quests.kill_east;
        const killNorth = gameState.quests.kill_north;
        const killWest = gameState.quests.kill_west;
        const killSouth = gameState.quests.kill_south;

        if (killCenter?.status === "completed" && killEast?.pendingActivation) {
          // kill_center completa, east esperando confirmação
          dialogKey = "__kill_east_unlock__";
        } else if (killEast?.status === "completed" && killNorth?.pendingActivation) {
          dialogKey = "__kill_north_unlock__";
        } else if (killNorth?.status === "completed" && killWest?.pendingActivation) {
          dialogKey = "__kill_west_unlock__";
        } else if (killWest?.status === "completed" && killSouth?.pendingActivation) {
          dialogKey = "__kill_south_unlock__";
        } else if (killSouth?.status === "completed") {
          dialogKey = "__kill_all_completed__";
        } else if (killCenter?.status === "active") {
          dialogKey = "__kill_center_active__";
        } else if (killEast?.status === "active") {
          dialogKey = "__kill_east_active__";
        } else if (killNorth?.status === "active") {
          dialogKey = "__kill_north_active__";
        } else if (killWest?.status === "active") {
          dialogKey = "__kill_west_active__";
        } else if (killSouth?.status === "active") {
          dialogKey = "__kill_south_active__";
        } else {
          dialogKey = "dialogs.guide.all_completed";
        }
      }
    }

    // ── Diálogos especiais das Kill Quests (não passam pelo i18n) ──
    const KILL_QUEST_DIALOGS: Record<string, string[]> = {
      "__kill_east_unlock__": [
        "⚔️ Impressionante! Você exterminou os Blobs da Praça Central!",
        "Os Vermes das Cavernas no Leste estão cada vez mais ousados. A Forja de Kael está em perigo!",
        "Missão desbloqueada: Guerreiro da Forja Leste 🪱",
        "Vá ao Portal Leste e elimine 5 Cave Worms para proteger o ferreiro!",
      ],
      "__kill_north_unlock__": [
        "⚔️ Fantástico! Você é um verdadeiro caçador de Cavernas!",
        "Os Caranguejos gigantes do Norte estão bloqueando as rotas navais do Capitão HC!",
        "Missão desbloqueada: Caçador do Porto Norte 🦀",
        "Entre pelo Portal Norte e elimine 5 Crabs para liberar o porto!",
      ],
      "__kill_west_unlock__": [
        "⚔️ Herói! Os mercadores do Norte agradecem!",
        "As Abelhas Gigantes do Bazar Oeste atacam os comerciantes alquimistas!",
        "Missão desbloqueada: Desbravador do Bazar Oeste 🐝",
        "Vá ao Portal Oeste e elimine 5 Bees raivosas para restaurar a paz!",
      ],
      "__kill_south_unlock__": [
        "⚔️ Inacreditável! O Bazar Oeste prospera graças a você!",
        "Mas há rumores sombrios do Santuário Sul... Serpentes Místicas corrompidas pelo caos!",
        "Missão desbloqueada: Herói do Santuário Sul 🐍",
        "Esta é sua maior batalha! Vá ao Portal Sul e elimine 5 Snakes para salvar o Santuário!",
      ],
      "__kill_center_active__": [
        "Ainda há Slimes ameaçando a Praça Central!",
        "Ative o Modo Batalha e limpe a área! Preciso que você elimine 5 Slimes."
      ],
      "__kill_east_active__": [
        "A forja de Kael ainda corre perigo!",
        "Siga para o Leste e elimine 5 Cave Worms."
      ],
      "__kill_north_active__": [
        "O Capitão HC precisa da sua ajuda com os caranguejos!",
        "Siga para o Norte e elimine 5 Crabs."
      ],
      "__kill_west_active__": [
        "As abelhas gigantes continuam atormentando o Bazar Oeste!",
        "Siga para o Oeste e elimine 5 Bees."
      ],
      "__kill_south_active__": [
        "As Serpentes Místicas estão destruindo o Santuário Sul!",
        "Siga para o Sul e elimine 5 Snakes."
      ],
      "__kill_all_completed__": [
        "🌟 LENDÁRIO! Você completou todas as caças e provou ser o maior guerreiro de Stellar!",
        "Os cinco mapas estão limpos e os cidadãos estão em paz.",
        "Você é agora o CAMPEÃO DE STELLAR — um título que poucos alcançaram!",
        "Que sua espada brilhe sempre, herói! Novas aventuras aguardam além das estrelas...",
      ],
    };

    const res = t(dialogKey, { returnObjects: true });
    let dialogueLines: string[] = [];

    if (dialogKey.startsWith("__") && KILL_QUEST_DIALOGS[dialogKey]) {
      dialogueLines = KILL_QUEST_DIALOGS[dialogKey];
    } else if (Array.isArray(res)) {
      dialogueLines = res as string[];
    } else if (npc.dialogs && npc.dialogs.length > 0) {
      dialogueLines = npc.dialogs;
    } else if (typeof res === "string" && !(res as string).startsWith("npcs.")) {
      dialogueLines = [res as string];
    } else {
      dialogueLines = npc.dialogs || ["Welcome!"];
    }

    const resName = t(`npcs.${npc.id}.name`);
    const npcName = (typeof resName === "string" && !resName.startsWith("npcs.")) ? resName : (npc.name || "INFO");

    setGameState((prev) => ({
      ...prev,
      activeDialog: {
        npcName: npcName,
        text: dialogueLines,
        currentStep: 0,
        npcId: npc.id,
        onDialogComplete: npc.onDialogComplete,
      },
    }));
  };

  const handleTriggerModal = () => {
    playSynthSound("beep");
    if (isNearTerminal) {
      if (isNearTerminal === "mine") return;
      // Trava de Acesso: Apenas para quem tem a Estrela de Guardião (Carteira Stellar forjada / Missão concluída)
      const hasStar = gameState.wallet.hasWallet || gameState.quests.wallet.status === "completed";

      if (isNearTerminal === "atf" || isNearTerminal === "gamefi_faucet" || isNearTerminal === "burn_altar" || isNearTerminal === "p2p_store" || isNearTerminal === "outfit_shop") {
        if (!hasStar) {
          let terminalName = "Special Feature";
          if (isNearTerminal === "gamefi_faucet") terminalName = "Magic Faucet Fountain";
          else if (isNearTerminal === "burn_altar") terminalName = "Eternal Burn Altar";
          else if (isNearTerminal === "p2p_store") terminalName = "P2P Store Market";
          else if (isNearTerminal === "outfit_shop") terminalName = "Outfit Store Market";
          else if (isNearTerminal === "atf") terminalName = "ATM DeFi System";

          setGameState((prev) => ({
            ...prev,
            activeDialog: {
              npcName: terminalName,
              text: [
                "🔒 Access Denied!",
                "You must obtain the Guardian Star (Forge your Stellar Wallet with Blacksmith Kael at the East Portal) to access this feature in the Central Map!"
              ],
              currentStep: 0,
              npcId: "system",
            },
          }));
          return;
        }
      }

      if (isNearTerminal === "atf") {
        const isCompletedAll = gameState.quests.hold.status === "completed";
        if (!isCompletedAll) {
          setGameState((prev) => ({
            ...prev,
            activeDialog: {
              npcName: "ATM DeFi System",
              text: [
                "🔒 Access Denied.",
                "You must complete all 4 onboarding quests to unlock the consolidated ATM DeFi terminal."
              ],
              currentStep: 0,
              npcId: "system",
            },
          }));
          return;
        }
      }

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

      // O completeQuest já ativa a próxima quest e concede 400 XP automaticamente!
      useGameStore.getState().completeQuest("wallet");

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
        quests: useGameStore.getState().quests,
        transactions: [newTx, ...prev.transactions],
        xp_current: useGameStore.getState().xp_current,
        level: useGameStore.getState().level,
        playerPos: useGameStore.getState().playerPos,
      };
    });
  };

  const handleOnRampSuccess = (asset: "XLM" | "USDW" | "BRW", amountAdded: number, method: "PIX" | "CARD") => {
    playSynthSound("coin");
    
    // Guard: só avança se a quest onramp ainda não foi completada
    if (useGameStore.getState().quests.onramp.status !== "completed") {
      useGameStore.getState().completeQuest("onramp");
    }

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

      const balanceField = asset === "XLM" ? "xlmBalance" : asset === "USDW" ? "usdwBalance" : "brwBalance";

      return {
        wallet: {
          ...prev.wallet,
          [balanceField]: (prev.wallet[balanceField] || 0) + amountAdded,
        },
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  const handleSwapSuccess = (fromAsset: "XLM" | "USDW" | "BRW", toAsset: "XLM" | "USDW" | "BRW", amountFrom: number, amountTo: number) => {
    playSynthSound("success");
    
    // Guard: só avança se a quest soroban ainda não foi completada
    if (useGameStore.getState().quests.soroban.status !== "completed") {
      useGameStore.getState().completeQuest("soroban");
    }

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

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          [fromField]: Math.max(0, currentFrom - amountFrom),
          [toField]: currentTo + amountTo,
        },
        quests: useGameStore.getState().quests,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  const handleHoldSuccess = (asset: "XLM" | "USDW" | "BRW", amount: number, updatedFields: Partial<WalletState>, tx: Transaction) => {
    playSynthSound("success");
    
    // Guard: só completa hold se ainda não foi completada
    if (useGameStore.getState().quests.hold.status !== "completed") {
      useGameStore.getState().completeQuest("hold");
    }

    setGameState((prev) => {
      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          ...updatedFields,
          isLocked: true,
          lockedAmount: (prev.wallet.lockedAmount || 0) + (asset === "XLM" ? amount : 0),
        },
        quests: useGameStore.getState().quests,
        transactions: [tx, ...prev.transactions],
        xp_current: useGameStore.getState().xp_current,
        level: useGameStore.getState().level,
        playerPos: useGameStore.getState().playerPos,
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

      // 1. Boundary check
      if (
        nextTargetX < 0 ||
        nextTargetX >= GRID_COLS ||
        nextTargetY < 0 ||
        nextTargetY >= GRID_ROWS
      ) {
        return { ...prev, dir };
      }

      // 2. Tile Collision check
      const currentMapId = (prev.mapId || "center") as MapId;
      const grid = getMapGrid(currentMapId);
      const targetTile = grid[nextTargetY][nextTargetX];
      if (isCollidable(targetTile)) {
        return { ...prev, dir };
      }

      // 3. Bridge / Gate block check
      const bridgeBlock = isBridgeBlocked(nextTargetX, nextTargetY, gameState.quests);
      if (bridgeBlock.blocked) {
        return { ...prev, dir };
      }

      // 4. NPC Collision check
      const npcs = getNpcsForMap(currentMapId);
      const hitsNPC = npcs.some((n) => n.x === nextTargetX && n.y === nextTargetY);
      if (hitsNPC) {
        return { ...prev, dir };
      }

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
      if (e.key === " ") {
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
  const isCompletedAll = gameState.quests.hold.status === "completed";

  const currentXP = gameState.xp_current || 0;
  const currentLevel = gameState.level || 1;
  const xpForNextLevel = Math.ceil(50 * Math.pow(currentLevel, 2.5));
  const xpForCurrentLevel = Math.ceil(50 * Math.pow(currentLevel - 1, 2.5));
  const xpIntoThisLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = isGmMode ? 100 : Math.min(100, Math.max(0, (xpIntoThisLevel / xpNeededForNext) * 100));

  let currentActiveQuest = activeQuestsArray.find(q => q.status === "active");
  const isPendingKillQuest = activeQuestsArray.some(q => q.pendingActivation);

  if (!currentActiveQuest && isPendingKillQuest) {
    currentActiveQuest = {
      id: "pending_kill" as any,
      title: "REPORTAR AO JAMES",
      description: "Retorne ao saguão principal para receber as honrarias e sua próxima missão.",
      instructions: "Siga para a Praça Central e converse com James [NPC].",
      reward: "Nova Missão 🌟",
      status: "active"
    };
  } else if (!currentActiveQuest && gameState.quests.kill_south?.status === "completed") {
    currentActiveQuest = {
      id: "all_done" as any,
      title: "NEW QUESTS COMING SOON",
      description: "You have completed all current onboarding quests on the Stellar network. Stay tuned for upcoming adventures!",
      instructions: "You have completed all current onboarding quests on the Stellar network. Stay tuned for upcoming adventures!",
      reward: "Legendary Title 🌟",
      status: "completed"
    };
  } else if (!currentActiveQuest && isCompletedAll && !isPendingKillQuest) {
     currentActiveQuest = {
      id: "pending_kill" as any,
      title: "REPORTAR AO JAMES",
      description: "Retorne ao saguão principal para receber as honrarias e sua próxima missão.",
      instructions: "Siga para a Praça Central e converse com James [NPC].",
      reward: "Nova Missão 🌟",
      status: "active"
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

  // Dynamic Title (Prioritizes playerPos.activeTitle if set)
  let defaultTitle = typeof t === "function" ? t('title.newbie', "Newbie Castaway") : "Newbie Castaway";
  if (completedCount === 1) defaultTitle = typeof t === "function" ? t('title.initiated', "Stellar Initiate") : "Stellar Initiate";
  else if (completedCount === 2) defaultTitle = typeof t === "function" ? t('title.onramp', "On-Ramp Operator") : "On-Ramp Operator";
  else if (completedCount === 3) defaultTitle = typeof t === "function" ? t('title.soroban', "Soroban Alchemist") : "Soroban Alchemist";
  else if (completedCount >= 4) defaultTitle = typeof t === "function" ? t('title.legendary', "Legendary Stellar Hero") : "Legendary Stellar Hero";

  useEffect(() => {
    if (playerPos.activeTitle !== defaultTitle) {
      setPlayerPos((prev) => ({ ...prev, activeTitle: defaultTitle }));
    }
  }, [defaultTitle, playerPos.activeTitle]);

  const playerTitle = playerPos.activeTitle || defaultTitle;

  // RPG stats calculations com classes e buffs
  const effectiveStats = calculateEffectiveStats(
    completedCount,
    playerPos.playerClass || gameState.playerClass,
    gameState.activeBuffs
  );

  const attrStr = isGmMode ? 9999 : effectiveStats.str;
  const attrInt = isGmMode ? 9999 : effectiveStats.int;
  const attrAgi = isGmMode ? 9999 : effectiveStats.agi;
  const attrRes = isGmMode ? 9999 : effectiveStats.res;
  const attrFaith = isGmMode ? 9999 : (gameState.wallet.hasWallet ? effectiveStats.faith : 0);

  const isMovementBlocked = !!gameState.activeModal || !!gameState.activeDialog || !!activeWindow || showPassport || showMapModal;

  if (!hasStarted) {
    return (
      <LandingPage
        onPlay={() => setHasStarted(true)}
        playSynthSound={playSynthSound}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        existingWallet={gameState.wallet}
        existingPlayerName={playerPos.name}
        existingGender={playerPos.gender || "male"}
        onLogin={(name, gender, skipAppearanceOverride) => {
          const isFemale = gender === "female";
          setPlayerPos((prev) => {
            if (skipAppearanceOverride) {
              return { ...prev, name, ...(gender && { gender }) };
            }
            return {
              ...prev,
              name,
              gender: gender || prev.gender,
              headType: isFemale ? "ribbon" : (prev.headType || "topete"),
              headColor: isFemale ? "#ec4899" : (prev.headColor || "#3b82f6"),
              torsoType: isFemale ? "dress" : (prev.torsoType || "classic"),
              torsoColor: isFemale ? "#ec4899" : (prev.torsoColor || "#ef4444"),
              legsColor: isFemale ? "#1e293b" : (prev.legsColor || "#2563eb"),
              shoesColor: isFemale ? "#ec4899" : (prev.shoesColor || "#1e293b"),
              faceType: isFemale ? "eyelashes" : (prev.faceType || "none"),
              hairColor: isFemale ? "#ec4899" : (prev.hairColor || "#78350f"),
            };
          });
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

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center p-8 border border-red-500/50 bg-red-500/10 rounded-2xl max-w-md shadow-2xl shadow-red-500/20 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-4">Em Manutenção</h1>
          <p className="text-slate-300 font-medium">Os Game Masters ativaram o protocolo de emergência.</p>
          <p className="text-slate-400 mt-3 text-sm">O jogo voltará ao ar assim que as verificações de segurança forem concluídas. Por favor, aguarde.</p>
        </div>
      </div>
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
                title={t("ui.toggleAudio")}
              >
                <span className="text-base md:text-base">{soundEnabled ? "🔊" : "🔇"}</span>
              </button>
              
              {/* HP/MP Bars */}
              <div className="flex flex-col items-start bg-[#1a1913]/12 px-2.5 py-1.5 rounded-lg border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] w-36 gap-1">
                {/* HP */}
                <div className="w-full">
                  <div className="flex justify-between items-center w-full mb-0.5">
                    <span className="text-[9px] font-black leading-none text-red-700 tracking-wider">HP</span>
                    <span className="text-[9px] font-mono leading-none font-black text-slate-800">
                      {playerPos.hp ?? 100} / {playerPos.maxHp ?? 100}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 border border-black/30 rounded overflow-hidden relative">
                    <div 
                      className="h-full bg-green-500 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset] transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, ((playerPos.hp ?? 100) / (playerPos.maxHp ?? 100)) * 100))}%` }}
                    />
                  </div>
                </div>
                {/* MP */}
                <div className="w-full">
                  <div className="flex justify-between items-center w-full mb-0.5">
                    <span className="text-[9px] font-black leading-none text-blue-700 tracking-wider">MP</span>
                    <span className="text-[9px] font-mono leading-none font-black text-slate-800">
                      {playerPos.mp ?? 50} / {playerPos.maxMp ?? 50}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/30 border border-black/30 rounded overflow-hidden relative">
                    <div 
                      className="h-full bg-blue-500 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset] transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, ((playerPos.mp ?? 50) / (playerPos.maxMp ?? 50)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* EXP Progress Bar & Buffs */}
              <div className="hidden lg:flex flex-col w-44 gap-1">
                {/* EXP */}
                <div className="bg-[#1a1913]/12 px-2.5 py-1 rounded-lg border border-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] w-full">
                  <div className="flex justify-between text-[10px] leading-none mb-1 font-black">
                    <span className="text-amber-800">LVL {isGmMode ? 99 : currentLevel}</span>
                    <span className="text-amber-950 tracking-tighter">
                      {isGmMode ? "MAX" : `${currentXP} / ${xpForNextLevel}`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/20 border border-black/15 rounded overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* BUFFS */}
                <div className="flex items-center justify-center gap-1.5 bg-[#1a1913]/15 px-2 py-0.5 rounded-lg border border-black/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] w-full">
                  <span className="text-[9px] font-black text-[#473b2c] mr-1">BUFFS:</span>
                  <span 
                    className="text-xs cursor-help relative group" 
                    title={playerPos.x === 30 && playerPos.y === 31 ? "🛡️ Zona Segura (Você está protegido)" : "🏕️ Explorando a Ilha"}
                  >
                    {playerPos.x === 30 && playerPos.y === 31 ? "🛡️" : "⚔️"}
                  </span>
                  
                  {gameState.quests.onramp.status === "completed" && (
                    <>
                      <span className="text-xs animate-pulse" title="💰 Investidor (Ativo no Mercado)">💰</span>
                      <span className="text-xs animate-pulse" title="⚡ Aura de Velocidade (+10%)">⚡</span>
                    </>
                  )}

                  {gameState.wallet.hasWallet && (
                    <span className="text-xs text-cyan-700 font-bold" title="🔑 Chaves Stellar Sincronizadas">🔑</span>
                  )}
                  {isCompletedAll && (
                    <span className="text-xs text-amber-500 font-bold animate-bounce" title="🌟 Conquista Lendária Desbloqueada">🌟</span>
                  )}
                </div>
              </div>
            </div>

            {/* Title / Class Badge (Shown here next to HP on mobile) */}
            <span className="block md:hidden bg-[#1e293b] text-[#ffbf00] border-2 border-black rounded-lg px-2 py-1 text-[9px] font-black shadow-[1px_1px_0px_#000] uppercase tracking-wider whitespace-nowrap">
              👑 {playerTitle}
            </span>
          </div>

          {/* Center Section on desktop: Immersive Title */}
          <div className="hidden md:flex items-center gap-2">
            {/* Title / Class Badge */}
            <span className="bg-[#1e293b] text-[#ffbf00] border-2 border-black rounded-lg px-2.5 py-1 text-[10px] font-black shadow-[2px_2px_0px_#000] uppercase tracking-wider whitespace-nowrap max-w-[150px] truncate text-center leading-tight">
              👑 {playerTitle}
            </span>
          </div>

          {/* Bottom Row on mobile, Right Section on desktop: Multi-currency Purse & World Clock */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* XLM Balance */}
              <span 
                className="bg-[#ffe494] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-amber-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Crystal Shards (XLM) - Usado para taxas de transação."
              >
                🪙 <span className="font-mono text-[11.5px] md:text-[12.5px]">{Number(gameState.wallet.xlmBalance).toFixed(2).replace('.', ',')}</span> <span className="text-[9.5px] font-sans font-black opacity-85">XLM</span>
              </span>
              {/* USDW Balance */}
              <span 
                className="bg-[#c2f0fc] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-cyan-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Stellar Anchored Dollar (USDW) - Moeda de valor estável USD."
              >
                💵 <span className="font-mono text-[11.5px] md:text-[12.5px]">{Number(gameState.wallet.usdwBalance || 0).toFixed(2).replace('.', ',')}</span> <span className="text-[9.5px] font-sans font-black opacity-85">USDW</span>
              </span>
              {/* BRW Balance */}
              <span 
                className="bg-[#c2fcc9] border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-emerald-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000]"
                title="Stellar Anchored Real (BRW) - Moeda pareada ao Real Brasileiro."
              >
                🇧🇷 <span className="font-mono text-[11.5px] md:text-[12.5px]">{Number(gameState.wallet.brwBalance || 0).toFixed(2).replace('.', ',')}</span> <span className="text-[9.5px] font-sans font-black opacity-85">BRW</span>
              </span>
              {/* GAMEFI COIN Balance (Separated in HUD) */}
              <span 
                className="bg-gradient-to-r from-amber-400 to-yellow-400 border-2 border-black px-2 py-1 md:px-2 md:py-1 rounded-lg flex items-center gap-1 font-black text-slate-950 text-[11.5px] md:text-[12px] shadow-[1.5px_1.5px_0px_#000] cursor-pointer hover:scale-105 transition-transform"
                title="Moeda Oficial GameFiNow (GAMEFI)"
              >
                🎮 <span className="font-mono text-[11.5px] md:text-[12.5px]">{Number(gameState.wallet.gamefiBalance || 0).toFixed(2).replace('.', ',')}</span> <span className="text-[9.5px] font-sans font-black opacity-90">GAMEFI</span>
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
              setShowActiveQuest(!showActiveQuest);
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              showActiveQuest ? "bg-emerald-400" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title={t("ui.quests")}
          >
            <span className="text-xl md:text-lg">📝</span>
          </button>

          {/* Scoreboard / Leaderboard Toggle Scroll */}
          <button
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              showLeaderboard ? "bg-amber-400" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title="Scoreboard Global (XP)"
          >
            <span className="text-xl md:text-lg">👑</span>
          </button>

          {/* Quick Town Square Teleport Rune Portal */}
          <button
            onClick={handleTeleportToCenter}
            className="w-11 h-11 md:w-9 md:h-9 bg-cyan-100 hover:bg-cyan-50 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition group relative"
            title={t("ui.teleportCenter")}
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
            title={t("ui.passport")}
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

          {/* MULTIPLAYER: Chat MMO por mapa */}
          {isMultiplayerEnabled && (
            <ChatBox
              messages={chatMessages}
              onSend={sendChat}
              onlineCount={onlineCount}
              currentPlayerName={playerPos.name || "Anonymo"}
              isConnected={isConnected}
            />
          )}

        </div>

        {/* 3. RIGHT SIDEBARHUD - MINIMAP COMPASS & TAB CONTROLS */}
        <div className="absolute top-26 md:top-20 right-2.5 z-10 flex flex-col items-end gap-2 select-none">
          
          {/* STANDALONE GAMEFI COIN BADGE DIRECTLY ABOVE THE MINIMAP */}
          <div 
            className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border-2 border-black rounded-xl px-2.5 py-1 flex items-center gap-1.5 font-mono font-black text-slate-950 text-xs shadow-[2px_2px_0px_#000] cursor-pointer hover:scale-105 transition-transform"
            title="Saldo da Moeda Oficial GameFiNow (GAMEFI)"
          >
            <span className="text-sm animate-bounce">🪙</span>
            <span className="text-xs font-black font-mono">{Number(gameState.wallet.gamefiBalance || 0).toFixed(2).replace('.', ',')}</span>
            <span className="text-[9px] font-sans font-black uppercase opacity-90 tracking-wider">GAMEFI</span>
          </div>

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

          {/* Map Zoom Controls */}
          <div className="flex gap-1 bg-[#1c2c16] border-[2px] border-[#8b5a2b] rounded p-0.5 shadow-[2px_2px_0px_#000]">
            <button 
              onClick={() => {
                const isMobile = window.innerWidth < 768;
                const currentZ = gameState.mapZoomLevel ?? (isMobile ? 2.5 : 3.5);
                setGameState({...gameState, mapZoomLevel: Math.max(isMobile ? 1.0 : 2.0, currentZ - (isMobile ? 0.25 : 0.5))});
                playSynthSound("beep");
              }}
              className="w-6 h-6 md:w-5 md:h-5 bg-[#8b5a2b] hover:bg-[#a6713c] rounded text-white text-[12px] flex items-center justify-center font-bold active:bg-amber-600"
            >
              -
            </button>
            <div className="text-[10px] md:text-[9px] font-mono text-amber-200 px-1 flex items-center font-black">
              ZOOM
            </div>
            <button 
              onClick={() => {
                const isMobile = window.innerWidth < 768;
                const currentZ = gameState.mapZoomLevel ?? (isMobile ? 2.5 : 3.5);
                setGameState({...gameState, mapZoomLevel: Math.min(isMobile ? 5.0 : 10.0, currentZ + (isMobile ? 0.25 : 0.5))});
                playSynthSound("beep");
              }}
              className="w-6 h-6 md:w-5 md:h-5 bg-[#8b5a2b] hover:bg-[#a6713c] rounded text-white text-[12px] flex items-center justify-center font-bold active:bg-amber-600"
            >
              +
            </button>
          </div>

          {/* Battle Mode Trigger */}
          <button
            onClick={() => {
              if (hasStar) {
                setBattleMode(!gameState.isBattleModeActive);
                playSynthSound("beep");
              } else {
                alert("Você precisa completar todas as missões (Estrela de Guardião) para habilitar o modo de batalha.");
              }
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] transition ${
              hasStar ? "hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer" : "opacity-50 cursor-not-allowed grayscale"
            } ${
              gameState.isBattleModeActive ? "bg-red-600 text-white border-red-900" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title={hasStar ? (gameState.isBattleModeActive ? "Desativar Modo de Batalha" : "Ativar Modo de Batalha") : "Bloqueado: Requer Estrela de Guardião"}
          >
            <span className="text-xl md:text-lg">⚔️</span>
          </button>

          {/* Backpack Window Trigger */}
          <button
            onClick={() => {
              setActiveWindow(activeWindow === "backpack" ? null : "backpack");
              playSynthSound("beep");
            }}
            className={`w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition ${
              activeWindow === "backpack" ? "bg-emerald-500 text-white" : "bg-[#ebd9c0] hover:bg-[#f3e6d3]"
            }`}
            title={t("ui.backpack")}
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
            title={t("ui.wardrobe")}
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
            title={t("ui.ledger")}
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
            title={t("ui.rulebook")}
          >
            <span className="text-xl md:text-lg">📖</span>
          </button>

          {/* Consagração de Classes RPG */}
          <button
            onClick={() => {
              setGameState((prev) => ({ ...prev, activeModal: "class_selection" }));
              playSynthSound("beep");
            }}
            className="w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition bg-purple-500 hover:bg-purple-400 text-white"
            title="Consagração de Classes RPG (Igreja Central)"
          >
            <span className="text-xl md:text-lg">⛪</span>
          </button>

          {/* Sistema de Guildas */}
          <button
            onClick={() => {
              setGameState((prev) => ({ ...prev, activeModal: "guild" }));
              playSynthSound("beep");
            }}
            className="w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition bg-amber-400 hover:bg-amber-300"
            title="Sistema de Guildas & Sede"
          >
            <span className="text-xl md:text-lg">🚪</span>
          </button>

          {/* Recuperação de Conta Web3 SEP-10 */}
          <button
            onClick={() => {
              setGameState((prev) => ({ ...prev, activeModal: "account_recovery" }));
              playSynthSound("beep");
            }}
            className="w-11 h-11 md:w-9 md:h-9 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition bg-cyan-400 hover:bg-cyan-300"
            title="Recuperação de Conta Web3 (SEP-10)"
          >
            <span className="text-xl md:text-lg">🔑</span>
          </button>

        </div>

        {/* 4. CHRONICLES ACTIVE QUEST FLOATING CARD OVERLAY */}
        {!isGmMode && showActiveQuest && (
          <div className="absolute top-26 md:top-20 left-[62px] md:left-[54px] z-10 bg-[#fbf5eb]/95 border-2 border-black rounded-lg p-2.5 w-[260px] sm:w-[380px] md:w-[480px] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] text-[10px] md:text-[9.5px] leading-snug font-mono select-none pointer-events-none text-left animate-in slide-in-from-left-2 fade-in duration-300">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#ffbf00] rounded-full animate-ping" />
              <span className="text-[8px] md:text-[7.5px] text-amber-800 font-extrabold uppercase tracking-wider">{t('ui.activeQuest')}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 mt-0.5">
              <span className="text-black font-black block leading-tight text-[11.5px] md:text-[10.5px] uppercase shrink-0">
                {currentActiveQuest 
                  ? (((currentActiveQuest.id as string) === "all_done" || (currentActiveQuest.id as string) === "pending_kill")
                      ? currentActiveQuest.title 
                      : t(`quests.${currentActiveQuest.id}.title`) + 
                        ((currentActiveQuest.id as string).startsWith("kill_") ? ` (${currentActiveQuest.killCount || 0}/${currentActiveQuest.killGoal || 5})` : "")
                    ) 
                  : "NEW QUESTS COMING SOON"}
              </span>
              <span className="text-slate-600 text-[10px] md:text-[9px] block leading-snug sm:border-l sm:border-black/15 sm:pl-2">
                {currentActiveQuest ? (((currentActiveQuest.id as string) === "all_done" || (currentActiveQuest.id as string) === "pending_kill") ? currentActiveQuest.instructions : t(`quests.${currentActiveQuest.id}.instructions`)) : "You have completed all current onboarding quests on the Stellar network. Stay tuned for upcoming adventures!"}
              </span>
            </div>
          </div>
        )}

        {/* 4.5 LEADERBOARD FLOATING CARD OVERLAY (Positioned slightly below Active Quest if both are open, or at top if alone) */}
        {!isGmMode && showLeaderboard && (
          <div className={`absolute left-[62px] md:left-[54px] z-10 bg-[#fbf5eb]/95 border-2 border-black rounded-lg p-2.5 w-[260px] sm:w-[380px] md:w-[480px] shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] text-[10px] md:text-[9.5px] leading-snug font-mono select-none pointer-events-none text-left animate-in slide-in-from-left-2 fade-in duration-300 ${showActiveQuest ? 'top-52 md:top-40' : 'top-26 md:top-20'}`}>
            <div className="flex items-center gap-1.5 mb-1.5 border-b border-black/10 pb-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[8px] md:text-[7.5px] text-amber-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <span className="text-sm">👑</span> SCOREBOARD GLOBAL (TOP 5 XP)
              </span>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {leaderboardData.length === 0 ? (
                <span className="text-slate-600 animate-pulse">Carregando heróis...</span>
              ) : (
                leaderboardData.map((p, index) => {
                  const isTop1 = index === 0;
                  const isMe = p.player_id === playerId;
                  return (
                    <div key={p.player_id} className={`flex items-center justify-between rounded px-1.5 py-1 ${isTop1 ? 'bg-gradient-to-r from-amber-200 to-amber-100 border border-amber-400/50' : ''} ${isMe ? 'bg-emerald-100 border border-emerald-400/50' : ''}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`font-black w-3 ${isTop1 ? 'text-amber-600' : 'text-slate-500'}`}>#{index + 1}</span>
                        <span className={`font-black truncate max-w-[120px] sm:max-w-[200px] ${isMe ? 'text-emerald-700' : 'text-black'}`}>
                          {p.name || 'Herói Anônimo'} {isMe && '(Você)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-slate-500">Lv.{p.level || 1}</span>
                        <span className="font-bold text-amber-600 w-16 text-right">{p.xp_current || 0} XP</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. TRAVELER LENDÁRIO CELEBRATION RIBLED */}
        {!isGmMode && isCompletedAll && showLegendaryRibbon && (
          <div 
            onClick={() => setShowLegendaryRibbon(false)}
            className="absolute top-[150px] md:top-32 left-1/2 -translate-x-1/2 z-10 bg-[#ffbf00] border-2 border-black px-3.5 py-1.5 rounded-full shadow-[2px_2px_0px_#000] text-[9.5px] md:text-[8.5px] font-black text-black tracking-wider flex items-center gap-1.5 animate-bounce select-none cursor-pointer hover:bg-amber-400"
          >
            {t('ui.legendaryRibbon')}
            <span className="ml-1 opacity-70">✕</span>
          </div>
        )}

        {/* MAIN GAME ENGINE SCREEN CANVAS */}
        <BattleHUD />
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
            realOnlinePlayers={isMultiplayerEnabled ? onlinePlayers : undefined}
          />
        </div>

        {/* MULTIPLAYER: Indicador de jogadores online */}
        {isMultiplayerEnabled && (
          <OnlineIndicator count={onlineCount} isConnected={isConnected} />
        )}



        <DialogSystem
          activeDialog={gameState.activeDialog}
          isNearTerminal={isNearTerminal}
          handleAdvanceDialog={handleAdvanceDialog}
          handleTriggerModal={handleTriggerModal}
        />
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
            <span className="text-[#5db81d] font-bold uppercase tracking-wider">{t("ui.networkActive")}</span>
            <span className="text-slate-600">|</span>
            <span>{t("ui.sandboxSimulation")}</span>
            <span className="text-slate-600">|</span>
            <span>{t("huds.ledger")}: <span className="text-[#5db81d] font-bold">#{gameState.currentLedger} ({t("ui.active")})</span></span>
          </div>

          <div className="flex items-center gap-1.5 font-extrabold text-slate-400">
            <span>🎮 {t("ui.keyboard")}:</span>
            <span className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded text-[7.5px]">WASD</span>
            <span className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded text-[7.5px]">{t("ui.space")}</span>
          </div>
        </div>

        {/* MOBILE JOYSTICK TOUCH PAD AND ACTION BUTTON */}
        {!gameState.activeDialog && (
          <div className="absolute bottom-14 left-0 right-0 z-50 flex justify-between items-end px-6 pointer-events-none md:hidden">
            
            {/* Joystick no lado esquerdo — elevado e posicionado com excelente ergonomia */}
            <div className="pointer-events-auto bg-[#ece9df]/90 border-2 border-black rounded-full p-2.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] backdrop-blur-sm ml-8 mb-8">
              <ReactNipple
                options={{
                  mode: "static",
                  position: { top: "50%", left: "50%" },
                  size: 96,
                  color: "#1e293b",
                }}
                style={{
                  width: 96,
                  height: 96,
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
            <div className="pointer-events-auto bg-[#ece9df]/90 border-2 border-black rounded-full p-2 shadow-[3px_3px_0px_rgba(0,0,0,1)] backdrop-blur-sm mr-8 mb-8">
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
                className="w-16 h-16 bg-[#ffbf00] active:bg-[#e6ab00] text-black rounded-full border-2 border-black cursor-pointer text-sm font-black active:translate-y-1 flex items-center justify-center shadow-[0_4px_0_#000] active:shadow-none"
              >
                {t("ui.action")}
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

        {/* ─── MODAL DE CONSAGRAÇÃO DE CLASSES DA FONTE ─── */}
        <ClassSelectionModal 
          playSynthSound={playSynthSound} 
          completedCount={completedCount} 
        />

        {/* ─── MODAL DE GUILDAS & SEDE ─── */}
        <GuildModal
          playSynthSound={playSynthSound}
          onTeleportToGuildhouse={() => {
            setPlayerPos((prev) => ({
              ...prev,
              mapId: "guildhouse",
              x: 30,
              y: 50,
              targetX: 30,
              targetY: 50,
              isMoving: false,
            }));
          }}
        />

        {/* ─── MODAL DE RECUPERAÇÃO DE CONTA SEP-10 / EMAIL ─── */}
        <AccountRecoveryModal
          playSynthSound={playSynthSound}
        />

        {/* ─── HUD DE BUFFS ATIVOS COM TIMERS ─── */}
        <ActiveBuffsHUD />

        {/* ─── OVERLAYS DE ANIMAÇÃO (DEATH & LEVEL UP) ─── */}
        <DeathScreenModal playSynthSound={playSynthSound} />

        {gameState.pendingLevelUp && !gameState.isDead && (
          <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-yellow-500/10 backdrop-blur-[1px]">
            <div className="animate-bounce flex flex-col items-center">
              <h1 className="text-yellow-400 font-black text-7xl uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black stroke-2" style={{ WebkitTextStroke: '2px black' }}>
                LEVEL UP!
              </h1>
              <p className="text-white font-mono text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] bg-black/50 px-4 py-1 rounded-full mt-2">
                Nível {gameState.level}
              </p>
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

      {/* 4. OUTFIT STORE MODAL */}
      {gameState.activeModal === "outfit_shop" && (
        <OutfitShopModal
          gameState={gameState}
          setGameState={setGameState}
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          onClose={() => setGameState((prev) => ({ ...prev, activeModal: null }))}
          playSynthSound={playSynthSound}
        />
      )}

      {/* 5. TUTORIAL MODALS */}
      {!gameState.hasSeenTutorial && (
        <WelcomeTutorialModal
          onClose={() => setGameState((prev) => ({ ...prev, hasSeenTutorial: true }))}
        />
      )}

      {(gameState.level || 1) >= 5 && showLevel5IntroDelayed && (
        <Level5IntroModal
          onClose={() => {
            setShowLevel5IntroDelayed(false);
            setGameState((prev) => ({ ...prev, hasSeenLevel5Intro: true }));
          }}
        />
      )}

      {/* 6. MINING REWARD MODAL — On-Chain GAMEFI Mint Result */}
      <MiningRewardModal />

      {/* SUBTLE IMMERSIVE CREDITS TEXT IN OUTER SPACE */}
      {/* (Moved to bottom HUD) */}
    </div>
  );
}
