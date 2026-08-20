/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { GameState, Player, NPC, Quest } from "../types";
import { TILE_SIZE, TileType, isCollidable, GRID_COLS, GRID_ROWS, GameDecoration, GameCreature } from "../gameData";
import { getMapGrid, getMapDecorations, isGateBlocked, MapId } from "../maps";
import { useTranslation } from "react-i18next";
import { Compass, MapPin, Sparkles } from "lucide-react";
import { drawPixelCharacter, getNPCPixelChar } from "./canvas/PlayerSprite";
import { drawMapTiles, drawSpecialTerminals, drawMapDecorations, drawActiveAnimations } from "./canvas/MapRenderer";
import { drawNPCs, drawOtherPlayers, cleanupRenderStates } from "./canvas/NPCManager";
import { OnlinePlayer } from "../services/multiplayerService";
import { getCurrentQuestTarget, drawQuestArrow } from "./canvas/QuestArrowRenderer";
import { playSynthSound } from "../utils/audioUtils";
import { useGameStore, SPELL_MAX_RANGE, getEquipmentBonuses } from "../store/gameStore";
import { calculateEffectiveStats } from "../classesData";

interface GameCanvasProps {
  gameState: GameState;
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
  npcs: NPC[];
  onTalkToNPC: (npc: NPC) => void;
  onNearTerminal: (terminalType: "wallet" | "onramp" | "soroban" | "hold" | "atf" | "p2p_store" | "burn_altar" | "gamefi_faucet" | "outfit_shop" | null) => void;
  isMovementBlocked?: boolean;
  /** Jogadores reais do Supabase (substitui os bots quando presente) */
  realOnlinePlayers?: OnlinePlayer[];
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerPos,
  setPlayerPos,
  npcs,
  gameState,
  onTalkToNPC,
  onNearTerminal,
  isMovementBlocked = false,
  realOnlinePlayers,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 680, height: 480 });
  const latestPlayerPos = useRef(playerPos);
  const latestGameState = useRef(gameState);
  const latestDimensions = useRef(dimensions);
  const latestNpcs = useRef(npcs);

  // CORREÇÃO RAIZ: mapGrid precisa ser uma ref para que o loop de animação
  // (que é um closure) sempre leia o grid correto ao trocar de mapa.
  // Uma variável normal só seria atualizada no próximo render do React,
  // mas o game loop roda 60x/s sem esperar re-renders.
  const mapGridRef = useRef<number[][]>(getMapGrid((playerPos.mapId || "center") as MapId));

  useEffect(() => {
    latestPlayerPos.current = playerPos;
    // Atualiza o grid SEMPRE que o mapId do jogador mudar
    mapGridRef.current = getMapGrid((playerPos.mapId || "center") as MapId);
  }, [playerPos]);

  useEffect(() => {
    latestGameState.current = gameState;
  }, [gameState]);

  useEffect(() => {
    latestDimensions.current = dimensions;
  }, [dimensions]);

  const mmoPhrasesRef = useRef<string[]>([]);
  useEffect(() => {
    const phrases = t("mmo.phrases", { returnObjects: true });
    if (Array.isArray(phrases)) {
      mmoPhrasesRef.current = phrases;
    }
  }, [t]);

  // Ref para jogadores reais do Supabase (atualizada via prop)
  const realOnlinePlayersRef = useRef<OnlinePlayer[]>([]);
  useEffect(() => {
    if (realOnlinePlayers) {
      realOnlinePlayersRef.current = realOnlinePlayers;
    }
  }, [realOnlinePlayers]);

  useEffect(() => {
    latestNpcs.current = npcs;
  }, [npcs]);

  // 2.2x default zoom factor for that perfectly sized close-up retro feel!
  const zoomLevel = 2.2;

  // Keyboard controls ref to track active keys
  const keysPressed = useRef<Record<string, boolean>>({});

  // Passive Slime Blobs in town square (tracked in Ref for 60fps buttery smooth rendering without React state overhead)
  const creaturesRef = useRef<GameCreature[]>([
    { id: "slime1", name: "Blob", x: 25, y: 24, targetX: 25, targetY: 24, isMoving: false, frame: 0, color: "#eab308", level: 5, hp: 250, maxHp: 250, bounceOffset: 0, dir: "left" },
    { id: "slime2", name: "Blob", x: 35, y: 24, targetX: 35, targetY: 24, isMoving: false, frame: 0, color: "#d97706", level: 5, hp: 250, maxHp: 250, bounceOffset: 0, dir: "right" },
    { id: "slime3", name: "Blob", x: 24, y: 34, targetX: 24, targetY: 34, isMoving: false, frame: 0, color: "#ea580c", level: 6, hp: 300, maxHp: 300, bounceOffset: 0, dir: "left" },
    { id: "slime4", name: "Blob", x: 36, y: 34, targetX: 36, targetY: 34, isMoving: false, frame: 0, color: "#ef4444", level: 5, hp: 250, maxHp: 250, bounceOffset: 0, dir: "right" },
    { id: "slime5", name: "Blob", x: 28, y: 25, targetX: 28, targetY: 25, isMoving: false, frame: 0, color: "#f97316", level: 6, hp: 300, maxHp: 300, bounceOffset: 0, dir: "left" },
    { id: "slime6", name: "Blob", x: 32, y: 35, targetX: 32, targetY: 35, isMoving: false, frame: 0, color: "#b45309", level: 6, hp: 300, maxHp: 300, bounceOffset: 0, dir: "right" },
    { id: "slime7", name: "Blob", x: 5, y: 5, targetX: 5, targetY: 5, isMoving: false, frame: 0, color: "#8b5cf6", level: 6, hp: 300, maxHp: 300, bounceOffset: 0, dir: "right" },
    { id: "slime8", name: "Blob", x: 55, y: 5, targetX: 55, targetY: 5, isMoving: false, frame: 0, color: "#7c3aed", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "left" },
    { id: "slime9", name: "Blob", x: 5, y: 55, targetX: 5, targetY: 55, isMoving: false, frame: 0, color: "#6d28d9", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "right" },
    { id: "slime10", name: "Blob", x: 55, y: 55, targetX: 55, targetY: 55, isMoving: false, frame: 0, color: "#5b21b6", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "left" },
    { id: "slime11", name: "Blob", x: 30, y: 5, targetX: 30, targetY: 5, isMoving: false, frame: 0, color: "#4c1d95", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "right" },
  ]);

  // Cave Worms — criaturas exclusivas da caverna do Leste (East Map)
  // Patrulham entre as paredes particionantes (rows 16..44, cols 4..58)
  const wormsRef = useRef<GameCreature[]>([
    { id: "worm1", name: "Cave Worm", x: 12, y: 20, targetX: 12, targetY: 20, isMoving: false, frame: 0, color: "#7f1d1d", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "right" },
    { id: "worm2", name: "Cave Worm", x: 40, y: 8,  targetX: 40, targetY: 8,  isMoving: false, frame: 0, color: "#991b1b", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "left"  },
    { id: "worm3", name: "Cave Worm", x: 20, y: 38, targetX: 20, targetY: 38, isMoving: false, frame: 0, color: "#6b21a8", level: 7, hp: 350, maxHp: 350, bounceOffset: 0, dir: "right" },
    { id: "worm4", name: "Cave Worm", x: 48, y: 25, targetX: 48, targetY: 25, isMoving: false, frame: 0, color: "#be123c", level: 8, hp: 420, maxHp: 420, bounceOffset: 0, dir: "left"  },
    { id: "worm5", name: "Cave Worm", x: 35, y: 50, targetX: 35, targetY: 50, isMoving: false, frame: 0, color: "#9f1239", level: 8, hp: 420, maxHp: 420, bounceOffset: 0, dir: "right" },
    { id: "worm6", name: "Cave Worm", x: 6, y: 6, targetX: 6, targetY: 6, isMoving: false, frame: 0, color: "#450a0a", level: 8, hp: 420, maxHp: 420, bounceOffset: 0, dir: "right" },
    { id: "worm7", name: "Cave Worm", x: 54, y: 8, targetX: 54, targetY: 8, isMoving: false, frame: 0, color: "#450a0a", level: 8, hp: 420, maxHp: 420, bounceOffset: 0, dir: "left" },
    { id: "worm8", name: "Cave Worm", x: 6, y: 54, targetX: 6, targetY: 54, isMoving: false, frame: 0, color: "#4c1d95", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "right" },
    { id: "worm9", name: "Cave Worm", x: 54, y: 54, targetX: 54, targetY: 54, isMoving: false, frame: 0, color: "#3b0764", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "left" },
    { id: "worm10", name: "Cave Worm", x: 30, y: 56, targetX: 30, targetY: 56, isMoving: false, frame: 0, color: "#1e1b4b", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "right" },
  ]);

  // Crabs — criaturas exclusivas da praia do Norte (North Map)
  const crabsRef = useRef<GameCreature[]>([
    { id: "crab1", name: "Crab", x: 15, y: 26, targetX: 15, targetY: 26, isMoving: false, frame: 0, color: "#dc2626", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "right" },
    { id: "crab2", name: "Crab", x: 25, y: 24, targetX: 25, targetY: 24, isMoving: false, frame: 0, color: "#f97316", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "left" },
    { id: "crab3", name: "Crab", x: 35, y: 26, targetX: 35, targetY: 26, isMoving: false, frame: 0, color: "#b91c1c", level: 9, hp: 500, maxHp: 500, bounceOffset: 0, dir: "right" },
    { id: "crab4", name: "Crab", x: 45, y: 24, targetX: 45, targetY: 24, isMoving: false, frame: 0, color: "#ea580c", level: 10, hp: 600, maxHp: 600, bounceOffset: 0, dir: "left" },
    { id: "crab5", name: "Crab", x: 30, y: 25, targetX: 30, targetY: 25, isMoving: false, frame: 0, color: "#991b1b", level: 10, hp: 600, maxHp: 600, bounceOffset: 0, dir: "right" },
    { id: "crab6", name: "Crab", x: 4, y: 8, targetX: 4, targetY: 8, isMoving: false, frame: 0, color: "#7f1d1d", level: 10, hp: 600, maxHp: 600, bounceOffset: 0, dir: "right" },
    { id: "crab7", name: "Crab", x: 56, y: 8, targetX: 56, targetY: 8, isMoving: false, frame: 0, color: "#7f1d1d", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "left" },
    { id: "crab8", name: "Crab", x: 4, y: 52, targetX: 4, targetY: 52, isMoving: false, frame: 0, color: "#450a0a", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "right" },
    { id: "crab9", name: "Crab", x: 56, y: 52, targetX: 56, targetY: 52, isMoving: false, frame: 0, color: "#450a0a", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "left" },
    { id: "crab10", name: "Crab", x: 30, y: 5, targetX: 30, targetY: 5, isMoving: false, frame: 0, color: "#1a2e05", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "right" },
  ]);

  // Bees — criaturas exclusivas do jardim do Oeste (West Map)
  const processedLevelUpRef = useRef<boolean>(false);
  const beesRef = useRef<GameCreature[]>([
    { id: "bee1", name: "Bee", x: 10, y: 25, targetX: 10, targetY: 25, isMoving: false, frame: 0, color: "#facc15", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "right" },
    { id: "bee2", name: "Bee", x: 50, y: 30, targetX: 50, targetY: 30, isMoving: false, frame: 0, color: "#eab308", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "left" },
    { id: "bee3", name: "Bee", x: 10, y: 35, targetX: 10, targetY: 35, isMoving: false, frame: 0, color: "#fef08a", level: 11, hp: 700, maxHp: 700, bounceOffset: 0, dir: "right" },
    { id: "bee4", name: "Bee", x: 50, y: 35, targetX: 50, targetY: 35, isMoving: false, frame: 0, color: "#ca8a04", level: 12, hp: 800, maxHp: 800, bounceOffset: 0, dir: "left" },
    { id: "bee5", name: "Bee", x: 30, y: 22, targetX: 30, targetY: 22, isMoving: false, frame: 0, color: "#fde047", level: 12, hp: 800, maxHp: 800, bounceOffset: 0, dir: "right" },
    { id: "bee6", name: "Bee", x: 5, y: 5, targetX: 5, targetY: 5, isMoving: false, frame: 0, color: "#a16207", level: 12, hp: 800, maxHp: 800, bounceOffset: 0, dir: "right" },
    { id: "bee7", name: "Bee", x: 55, y: 5, targetX: 55, targetY: 5, isMoving: false, frame: 0, color: "#854d0e", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "left" },
    { id: "bee8", name: "Bee", x: 5, y: 55, targetX: 5, targetY: 55, isMoving: false, frame: 0, color: "#713f12", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "right" },
    { id: "bee9", name: "Bee", x: 55, y: 55, targetX: 55, targetY: 55, isMoving: false, frame: 0, color: "#422006", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "left" },
    { id: "bee10", name: "Bee", x: 30, y: 55, targetX: 30, targetY: 55, isMoving: false, frame: 0, color: "#b45309", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "right" },
  ]);

  // Snakes — criaturas exclusivas do santuário do Sul (South Map)
  const snakesRef = useRef<GameCreature[]>([
    { id: "snake1", name: "Snake", x: 15, y: 15, targetX: 15, targetY: 15, isMoving: false, frame: 0, color: "#16a34a", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "right" },
    { id: "snake2", name: "Snake", x: 45, y: 15, targetX: 45, targetY: 15, isMoving: false, frame: 0, color: "#15803d", level: 13, hp: 950, maxHp: 950, bounceOffset: 0, dir: "left" },
    { id: "snake3", name: "Snake", x: 15, y: 45, targetX: 15, targetY: 45, isMoving: false, frame: 0, color: "#22c55e", level: 14, hp: 1200, maxHp: 1200, bounceOffset: 0, dir: "right" },
    { id: "snake4", name: "Snake", x: 45, y: 45, targetX: 45, targetY: 45, isMoving: false, frame: 0, color: "#166534", level: 14, hp: 1200, maxHp: 1200, bounceOffset: 0, dir: "left" },
    { id: "snake5", name: "Snake", x: 30, y: 35, targetX: 30, targetY: 35, isMoving: false, frame: 0, color: "#4ade80", level: 14, hp: 1200, maxHp: 1200, bounceOffset: 0, dir: "right" },
    { id: "snake6", name: "Snake", x: 6, y: 6, targetX: 6, targetY: 6, isMoving: false, frame: 0, color: "#065f46", level: 15, hp: 1500, maxHp: 1500, bounceOffset: 0, dir: "right" },
    { id: "snake7", name: "Snake", x: 54, y: 6, targetX: 54, targetY: 6, isMoving: false, frame: 0, color: "#064e3b", level: 15, hp: 1500, maxHp: 1500, bounceOffset: 0, dir: "left" },
    { id: "snake8", name: "Snake", x: 6, y: 54, targetX: 6, targetY: 54, isMoving: false, frame: 0, color: "#022c22", level: 15, hp: 1500, maxHp: 1500, bounceOffset: 0, dir: "right" },
    { id: "snake9", name: "Snake", x: 54, y: 54, targetX: 54, targetY: 54, isMoving: false, frame: 0, color: "#14532d", level: 15, hp: 1500, maxHp: 1500, bounceOffset: 0, dir: "left" },
    { id: "snake10", name: "Snake", x: 30, y: 5, targetX: 30, targetY: 5, isMoving: false, frame: 0, color: "#065f46", level: 15, hp: 1500, maxHp: 1500, bounceOffset: 0, dir: "right" },
  ]);

  // --- BATTLE SYSTEM REFS ---
  const lastAttackTimeRef = useRef<number>(0);
  const monsterLastAttackTimeRef = useRef<number>(0);
  const combatTextsRef = useRef<import('../types').CombatText[]>([]);
  // Regen passiva de HP e MP (1/seg cada)
  const lastRegenTimeRef = useRef<number>(0);
  const processedAnimsRef = useRef<Set<string>>(new Set());
  // Timestamp do último sinal de Exhaustion do store — usado para evitar push duplicado
  const lastExhaustionShownRef = useRef<number>(0);
  // --------------------------
  // MMO Other Players walking around the 60x60 map in real time!
  const otherPlayersRef = useRef<any[]>([
    {
      id: "mmo1",
      name: "StellarGiga",
      x: 28,
      y: 28,
      targetX: 28,
      targetY: 28,
      dir: "down",
      isMoving: false,
      frame: 0,
      headColor: "#ec4899",
      torsoColor: "#1e293b",
      legsColor: "#10b981",
      shoesColor: "#1e293b",
      headType: "beanie",
      torsoType: "striped",
      skinColor: "#f1c27d",
      faceType: "glasses",
      accessoryType: "sword",
      bubbleText: t('otherPlayers.bot1.bubble'),
      bubbleTimer: 5000,
    },
    {
      id: "mmo2",
      name: "SorobanWizard",
      x: 7,
      y: 28,
      targetX: 7,
      targetY: 28,
      dir: "left",
      isMoving: false,
      frame: 0,
      headColor: "#8b5cf6",
      torsoColor: "#8b5cf6",
      legsColor: "#1e293b",
      shoesColor: "#f8fafc",
      headType: "beanie",
      torsoType: "suit",
      skinColor: "#ffdbac",
      faceType: "glasses",
      accessoryType: "cape",
      bubbleText: t('otherPlayers.bot2.bubble'),
      bubbleTimer: 4000,
    },
    {
      id: "mmo3",
      name: "LuminaXLM",
      x: 52,
      y: 29,
      targetX: 52,
      targetY: 29,
      dir: "right",
      isMoving: false,
      frame: 0,
      headColor: "#38bdf8",
      torsoColor: "#10b981",
      legsColor: "#ec4899",
      shoesColor: "#1e293b",
      headType: "helmet",
      torsoType: "hoodie",
      skinColor: "#ffdbac",
      faceType: "smile",
      accessoryType: "backpack",
      bubbleText: t('otherPlayers.bot3.bubble'),
      bubbleTimer: 6000,
    },
    {
      id: "mmo4",
      name: "CrypticHero",
      x: 29,
      y: 9,
      targetX: 29,
      targetY: 9,
      dir: "up",
      isMoving: false,
      frame: 0,
      headColor: "#f97316",
      torsoColor: "#ef4444",
      legsColor: "#2563eb",
      shoesColor: "#1e293b",
      headType: "horns",
      torsoType: "plain",
      skinColor: "#ffdbac",
      faceType: "eyepatch",
      accessoryType: "cape",
      bubbleText: t('otherPlayers.bot4.bubble'),
      bubbleTimer: 4500,
    },
    {
      id: "mmo5",
      name: "StellarGoldHolder",
      x: 32,
      y: 52,
      targetX: 32,
      targetY: 52,
      dir: "down",
      isMoving: false,
      frame: 0,
      headColor: "#fcd34d",
      torsoColor: "#f97316",
      legsColor: "#1e293b",
      shoesColor: "#1e293b",
      headType: "horns",
      torsoType: "hoodie",
      skinColor: "#e0ac69",
      faceType: "smile",
      accessoryType: "backpack",
      bubbleText: t('otherPlayers.bot5.bubble'),
      bubbleTimer: 7000,
    }
  ]);

  // Magic portal fullscreen flash trigger ref
  const teleportFlashRef = useRef<number>(0);

  // Handle responsive canvas resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Use actual height if available, otherwise fallback to window height minus top header bar (44px)
      const calculatedHeight = height > 0 ? height : (window.innerHeight - 44);
      setDimensions({
        width: Math.floor(width),
        height: Math.floor(calculatedHeight),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Horde Manager
  useEffect(() => {
    if (!gameState.isWaveActive) return;

    // Inicializa os status do evento se ainda não configurados
    if (useGameStore.getState().stellarNucleusHp === undefined) {
      useGameStore.getState().setGameState({ stellarNucleusHp: 10000, waveMonstersKilled: 0 });
    }

    let timeElapsed = 0;
    const interval = setInterval(() => {
      const currentGameState = useGameStore.getState();
      if (!currentGameState.isWaveActive) {
        clearInterval(interval);
        return;
      }
      
      timeElapsed += 2000;
      
      // Checa se sobreviveu por 60 segundos
      if (timeElapsed >= 60000) {
        clearInterval(interval);
        useGameStore.getState().setGameState({ isWaveActive: false });
        // Recompensa Global (exemplo: dá 500 XP e 50 GameFi Tokens para o player local)
        useGameStore.getState().addExperience(500);
        useGameStore.getState().addItemToInventory("gamefi_token", "currency", 50);
        alert(typeof t === "function" ? t('alerts.victory', "Victory! The Stellar Nucleus is protected. You received +500 XP and 50 GameFi Tokens!") : "Victory! The Stellar Nucleus is protected. You received +500 XP and 50 GameFi Tokens!");
        // Limpa os monstros do evento
        creaturesRef.current = creaturesRef.current.filter(c => c.name !== "Corruptor");
        return;
      }

      // Checa se o núcleo foi destruído
      if ((currentGameState.stellarNucleusHp || 0) <= 0) {
        clearInterval(interval);
        useGameStore.getState().setGameState({ isWaveActive: false });
        alert(typeof t === "function" ? t('alerts.defeat', "The Stellar Nucleus was destroyed! End of Wave.") : "The Stellar Nucleus was destroyed! End of Wave.");
        // Limpa os monstros do evento
        creaturesRef.current = creaturesRef.current.filter(c => c.name !== "Corruptor");
        return;
      }

      const creatures = creaturesRef.current;
      // Spawna um monstro por intervalo, se houver menos de 15 monstros no total
      if (creatures.filter(c => c.hp > 0).length < 20) {
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;
        if (side === 0) { sx = 3; sy = 3; } // top left
        else if (side === 1) { sx = 56; sy = 3; } // top right
        else if (side === 2) { sx = 3; sy = 56; } // bot left
        else { sx = 56; sy = 56; } // bot right
        
        creatures.push({
          id: `corruptor_${Date.now()}_${Math.random()}`,
          name: "Corruptor",
          x: sx, y: sy,
          targetX: sx, targetY: sy,
          dir: "down", isMoving: false, frame: 0, bounceOffset: 0,
          color: "#991b1b", // red-800
          hp: 150, maxHp: 150,
          level: 10,
        });
      }
    }, 2000); // 1 monstro a cada 2 segundos

    return () => clearInterval(interval);
  }, [gameState.isWaveActive]);

  // Keyboard Event Listeners for Movement and Interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement && (
        document.activeElement.tagName === "INPUT" || 
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.getAttribute("contenteditable") === "true"
      );

      if (isMovementBlocked || isTyping) {
        return;
      }

      const key = e.key.toLowerCase();
      if (
        ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        e.preventDefault();
      }
      keysPressed.current[key] = true;

      if (key === " ") {
        triggerInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    // Auto-focus para ambientes como iframes (Vercel)
    const handleFocus = () => {
      window.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleFocus);
    window.addEventListener("touchstart", handleFocus);
    
    // Forçar o foco inicial
    window.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleFocus);
      window.removeEventListener("touchstart", handleFocus);
    };
  }, [playerPos, npcs, gameState, isMovementBlocked]);

  useEffect(() => {
    if (isMovementBlocked) {
      keysPressed.current = {};
    }
  }, [isMovementBlocked]);

  // Mouse/Pointer click on canvas to handle Battle Mode target lock
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Sempre tentar interagir normalmente primeiro
    triggerInteraction();

    if (!latestGameState.current.isBattleModeActive) {
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dims = latestDimensions.current;
    const defaultZoom = dims.width < 768 ? 2.5 : 3.5;
    const currentZoomLevel = latestGameState.current.mapZoomLevel !== undefined ? latestGameState.current.mapZoomLevel : defaultZoom;

    const playerWorldX = latestPlayerPos.current.x * TILE_SIZE + TILE_SIZE / 2;
    const playerWorldY = latestPlayerPos.current.y * TILE_SIZE + TILE_SIZE / 2;

    const worldX = (clickX - dims.width / 2) / currentZoomLevel + playerWorldX;
    const worldY = (clickY - dims.height / 2) / currentZoomLevel + playerWorldY;

    const gridX = Math.floor(worldX / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);

    const currentRegion = latestPlayerPos.current.mapId || "center";
    let clickedCreature = null;

    if (currentRegion === "center") {
      clickedCreature = creaturesRef.current.find(c => Math.abs(c.x - gridX) <= 1 && Math.abs(c.y - gridY) <= 1);
    } else if (currentRegion === "east") {
      clickedCreature = wormsRef.current.find(c => Math.abs(c.x - gridX) <= 1 && Math.abs(c.y - gridY) <= 1);
    } else if (currentRegion === "north") {
      clickedCreature = crabsRef.current.find(c => Math.abs(c.x - gridX) <= 1 && Math.abs(c.y - gridY) <= 1);
    } else if (currentRegion === "west") {
      clickedCreature = beesRef.current.find(c => Math.abs(c.x - gridX) <= 1 && Math.abs(c.y - gridY) <= 1);
    } else if (currentRegion === "south") {
      clickedCreature = snakesRef.current.find(c => Math.abs(c.x - gridX) <= 1 && Math.abs(c.y - gridY) <= 1);
    }

    if (clickedCreature) {
      useGameStore.getState().setLockedTarget(clickedCreature.id);
    } else {
      useGameStore.getState().setLockedTarget(null);
    }
  };

  // Helper to trigger interaction with nearby NPC or terminal
  const triggerInteraction = () => {
    // Prevent starting or restarting NPC dialogue if a dialogue is currently active
    if (latestGameState.current.activeDialog) {
      return;
    }

    const { targetX, targetY, dir } = latestPlayerPos.current;
    
    let checkX = targetX;
    let checkY = targetY;
    if (dir === "up") checkY -= 1;
    if (dir === "down") checkY += 1;
    if (dir === "left") checkX -= 1;
    if (dir === "right") checkX += 1;

    const adjacentNPC = latestNpcs.current.find((n) => n.x === checkX && n.y === checkY);
    if (adjacentNPC) {
      onTalkToNPC(adjacentNPC);
      return;
    }

    const exactNPC = latestNpcs.current.find((n) => n.x === targetX && n.y === targetY);
    if (exactNPC) {
      onTalkToNPC(exactNPC);
      return;
    }
    
    // Check for Mining nodes
    const mapDecorations = getMapDecorations(latestPlayerPos.current.mapId || "center");
    const mineNode = mapDecorations.find(d => d.x === checkX && d.y === checkY && d.type === "mine");
    if (mineNode) {
      if (latestGameState.current.miningEndTimestamp) {
        // Já está minerando!
        return;
      }
      
      // Abre o modal de mineração para o usuário confirmar
      useGameStore.getState().setGameState({
        activeModal: "mining_node",
        currentMineRarity: mineNode.mineRarity
      });
      return;
    }
    
    // Check for Stellar Nucleus (Start Wave Event)
    const nucleusNode = mapDecorations.find(d => 
      d.type === "stellar_nucleus" && 
      checkX >= d.x && checkX < d.x + (d.width || 1) && 
      checkY >= d.y && checkY < d.y + (d.height || 1)
    );
    if (nucleusNode) {
      // O núcleo por enquanto não exibe os diálogos de iniciar purificação
      // (a ação de 'iniciar wave' será refeita com banners adequados futuramente).
      return;
    }

    // Interact with notebook on the GAMEFINOW stand
    if (playerPos.mapId === "center" && checkX === 22 && checkY === 32) {
      onTalkToNPC({
        id: "gamefinow_info",
        name: "GAMEFINOW INFO",
        x: 22,
        y: 32,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.welcome_center') : "Welcome to GameFiNow!",
          "Somos um ecossistema que conecta finanças descentralizadas (DeFi) com a diversão dos jogos (GameFi).",
          "Nossa missão é educar e integrar usuários à rede Stellar através de gamificação e recompensas on-chain."
        ]
      });
      return;
    }

    // Interact with notebook on the DUPPLY stand
    if (playerPos.mapId === "center" && checkX === 12 && checkY === 32) {
      onTalkToNPC({
        id: "dupply_info",
        name: "DUPPLY INFO",
        x: 12,
        y: 32,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.dupply_desc1') : "Digitizes invoice financing from end to end.",
          typeof t === 'function' ? t('canvas.dupply_desc2') : "We connect businesses seeking working capital with liquidity providers through automated workflows, risk analysis, traceability, and greater transparency at every stage of the transaction."
        ]
      });
      return;
    }

    // Interact with notebook on the DEFINDEX stand
    if (playerPos.mapId === "center" && checkX === 17 && checkY === 28) {
      onTalkToNPC({
        id: "defindex_info",
        name: "DEFINDEX INFO",
        x: 17,
        y: 28,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.welcome_south') : "Welcome to DEFINDEX!",
          "Nós construímos ferramentas incríveis e índices descentralizados no ecossistema Soroban.",
          typeof t === 'function' ? t('canvas.defindex_desc2') : "Explore our products to automate and optimize your DeFi yields!"
        ]
      });
      return;
    }

    // Interact with notebook on the WALLETNOW stand
    if (playerPos.mapId === "center" && checkX === 38 && checkY === 28) {
      onTalkToNPC({
        id: "walletnow_info",
        name: "WALLETNOW INFO",
        x: 38,
        y: 28,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.welcome_east') : "Welcome to WALLETNOW!",
          "A solução definitiva para o rastreamento e análise da sua carteira DeFi.",
          "Acompanhe seus ativos e rendimentos com segurança e inteligência através dos nossos painéis."
        ]
      });
      return;
    }

    // Interact with notebook on the PIGFI stand
    if (playerPos.mapId === "center" && checkX === 38 && checkY === 32) {
      onTalkToNPC({
        id: "pigfi_info",
        name: "PIGFI INFO",
        x: 38,
        y: 32,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.pigfi_desc1') : "Small amounts, a universe of possibilities.",
          typeof t === 'function' ? t('canvas.pigfi_desc2') : "The childhood piggy bank has evolved. With PigFi, your family can start saving dollars starting from R\ via Pix in a simple, visual, and fun way."
        ]
      });
      return;
    }

    // Interact with notebook on the WAVE stand
    if (playerPos.mapId === "center" && checkX === 17 && checkY === 32) {
      onTalkToNPC({
        id: "wave_info",
        name: "WAVE INFO",
        x: 17,
        y: 32,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.wave_desc1') : "Condominium administration and governance with transparency and security.",
          typeof t === 'function' ? t('canvas.wave_desc2') : "Streamlining property management, financial tracking, and community decision-making on the Stellar blockchain."
        ]
      });
      return;
    }

    // Interact with notebook on the SOROSWAP stand
    if (playerPos.mapId === "center" && checkX === 32 && checkY === 18) {
      onTalkToNPC({
        id: "soroswap_info",
        name: "SOROSWAP INFO",
        x: 32,
        y: 18,
        dir: "down",
        dialogs: [
          "Bem-vindo à SOROSWAP!",
          "A exchange descentralizada líder no ecossistema Soroban.",
          "Troque tokens de forma rápida, barata e segura utilizando nossos pools de liquidez."
        ]
      });
      return;
    }

    // Interact with notebook on the NEARX stand
    if (playerPos.mapId === "center" && checkX === 27 && checkY === 45) {
      onTalkToNPC({
        id: "nearx_info",
        name: "NEARX INFO",
        x: 27,
        y: 45,
        dir: "down",
        dialogs: [
          "Bem-vindo à NEARX!",
          "Inovação e escalabilidade de ponta para a Web3.",
          "Conheça nossas soluções para impulsionar a tecnologia de contratos inteligentes no ecossistema."
        ]
      });
      return;
    }

    // Interact with notebook on the AUTOFIN stand
    if (playerPos.mapId === "center" && checkX === 43 && checkY === 32) {
      onTalkToNPC({
        id: "autofin_info",
        name: "AUTOFIN INFO",
        x: 43,
        y: 32,
        dir: "down",
        dialogs: [
          typeof t === 'function' ? t('canvas.autofin_desc1') : "Welcome to AUTOFIN!",
          typeof t === 'function' ? t('canvas.autofin_desc2') : "Automate your financial infrastructure. Connect banking APIs, DeFi protocols, and wallets in a single visual workflow.",
          typeof t === 'function' ? t('canvas.autofin_desc3') : "Visit https://automated.finance for more information."
        ]
      });
      return;
    }

    // Interact with notebook on the NIDO stand
    if (playerPos.mapId === "center" && checkX === 48 && checkY === 32) {
      onTalkToNPC({
        id: "nido_info",
        name: "NIDO INFO",
        x: 48,
        y: 32,
        dir: "down",
        dialogs: [
          "NIDO: Creator infrastructure. Pay for results, not promises.",
          "Your brand only releases payment when the campaign delivers. No agency in the middle, no red tape.",
          "Scale and win users in the era of influencer marketing."
        ]
      });
      return;
    }

    // Interact with notebook on the TROQPAY stand
    if (playerPos.mapId === "center" && checkX === 27 && checkY === 21) {
      onTalkToNPC({
        id: "troqpay_info",
        name: "TROQPAY INFO",
        x: 27,
        y: 21,
        dir: "down",
        dialogs: [
          "Where you start doesn't define your market.",
          "Sell locally. Get paid globally. Turn global demand into sales.",
          "Without rebuilding your operation country by country."
        ]
      });
      return;
    }

    // Interact with notebook on the VELLORA stand
    if (playerPos.mapId === "center" && checkX === 27 && checkY === 15) {
      onTalkToNPC({
        id: "vellora_info",
        name: "VELLORA INFO",
        x: 27,
        y: 15,
        dir: "down",
        dialogs: [
          "The crypto market in the palm of your hand.",
          "Buy and sell Bitcoin, Ethereum, Solana and most cryptocurrencies — across 100+ blockchains — plus tokenized real-world assets, all via PIX.",
          "No addresses to memorize, no networks to choose, no jargon — the app handles the complexity for you."
        ]
      });
      return;
    }

    // Interact with notebook on the MUTAV stand
    if (playerPos.mapId === "center" && checkX === 12 && checkY === 28) {
      onTalkToNPC({
        id: "mutav_info",
        name: "MUTAV INFO",
        x: 12,
        y: 28,
        dir: "down",
        dialogs: [
          "Access the $10B Brazilian Rental Guarantee Market.",
          "The on-chain rental guarantee fund.",
          "Opening real assets with real yield to investors through onchain guarantee funds."
        ]
      });
      return;
    }

    // Interact with notebook on the WEB3EDU stand
    if (playerPos.mapId === "center" && checkX === 32 && checkY === 42) {
      onTalkToNPC({
        id: "web3edu_info",
        name: "WEB3EDU INFO",
        x: 32,
        y: 42,
        dir: "down",
        dialogs: [
          "Transforming people through education in Web3, blockchain, and emerging technologies.",
          "Building a more decentralized, inclusive, and sustainable future through education."
        ]
      });
      return;
    }

    // Interact with notebook on the PARADEVS stand
    if (playerPos.mapId === "center" && checkX === 32 && checkY === 48) {
      onTalkToNPC({
        id: "paradevs_info",
        name: "PARADEVS INFO",
        x: 32,
        y: 48,
        dir: "down",
        dialogs: [
          "Beyond providing educational opportunities for developers, ParaDevs aims to connect our developer ecosystem with the blockchains with which we are establishing partnerships."
        ]
      });
      return;
    }

    // Interact with notebook on the ENERGYPAY stand
    if (playerPos.mapId === "center" && checkX === 53 && checkY === 32) {
      onTalkToNPC({
        id: "energypay_info",
        name: "ENERGYPAY INFO",
        x: 53,
        y: 32,
        dir: "down",
        dialogs: [
          "One programmable rail from obligation to on-chain finality.",
          "EnergyPay turns bilateral energy obligations into programmable settlement instructions, executes them on Stellar Mainnet, and reconciles automatically against the resulting on-chain receipts — giving every counterparty the same verifiable truth."
        ]
      });
      return;
    }



    checkTerminalProximity(targetX, targetY, playerPos.mapId || "center");
  };

  // Helper to check and notify proximity to terminals
  const checkTerminalProximity = (x: number, y: number, currentMapId: string) => {
    const state = latestGameState.current;

    if (currentMapId === "center") {
      if (Math.abs(x - 33) <= 2 && Math.abs(y - 28) <= 2) {
        onNearTerminal("atf");
        return;
      }
      // Loja P2P Store (6 sqms no norte da rua: x=21..23, y=27..28)
      if (x >= 20 && x <= 24 && y >= 26 && y <= 30) {
        onNearTerminal("p2p_store");
        return;
      }
      // Loja OUTFIT STORE (6 sqms no norte da rua: x=46..48, y=27..28)
      if (x >= 45 && x <= 49 && y >= 26 && y <= 30) {
        onNearTerminal("outfit_shop");
        return;
      }
      // Altar de Queima Eterna (4 sqms: x=41..42, y=27..28)
      if (x >= 40 && x <= 43 && y >= 26 && y <= 29) {
        onNearTerminal("burn_altar");
        return;
      }
      // Fonte Faucet (2 sqms: x=28, y=24..25 -> pé no y=25)
      if (Math.abs(x - 28) <= 1 && y >= 23 && y <= 25) {
        onNearTerminal("gamefi_faucet");
        return;
      }
    } else if (currentMapId === "east") {
      if (Math.abs(x - 35) <= 2 && Math.abs(y - 28) <= 2) {
        onNearTerminal("wallet");
        return;
      }
    } else if (currentMapId === "north") {
      if (Math.abs(x - 31) <= 2 && Math.abs(y - 24) <= 2) {
        onNearTerminal("onramp");
        return;
      }
    } else if (currentMapId === "west") {
      if (Math.abs(x - 31) <= 2 && Math.abs(y - 27) <= 2) {
        onNearTerminal("soroban");
        return;
      }
      if (Math.abs(x - 47) <= 2 && Math.abs(y - 28) <= 2) {
        onNearTerminal("atf");
        return;
      }
    } else if (currentMapId === "south") {
      if (Math.abs(x - 33) <= 2 && Math.abs(y - 24) <= 2) {
        onNearTerminal("hold");
        return;
      }
    }
    const mapDecorations = getMapDecorations(currentMapId as MapId);
    const mineNode = mapDecorations.find(d => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1 && d.type === "mine");
    if (mineNode) {
      onNearTerminal("mine");
      return;
    }

    onNearTerminal(null);
  };

  // Main game update loop for movement ticks and interpolation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Update teleport flash intensity
      if (teleportFlashRef.current > 0) {
        teleportFlashRef.current = Math.max(0, teleportFlashRef.current - 0.05);
      }

      // Update passive bouncing slimes
      updateCreatures(delta);

      // Update cave worms (East map only, safe to run always)
      updateWorms(delta);
      
      // Update crabs (North map)
      updateCrabs(delta);

      // Update bees (West map)
      updateBees(delta);

      // Update snakes (South map)
      updateSnakes(delta);

      // Update MMO other players
      updateOtherPlayers(delta);

      updatePlayer(delta);
      updateCombat(time);
      drawGame();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Update passive slime animations & random hopping
  const updateCreatures = (delta: number) => {
    const creatures = creaturesRef.current;
    const speed = 0.07 * (delta / 16.66);

    creatures.forEach((c) => {
      if (c.hp <= 0) return;
      if (c.isMoving) {
        let newX = c.x;
        let newY = c.y;

        if (c.x < c.targetX) {
          newX = Math.min(c.targetX, c.x + speed);
        } else if (c.x > c.targetX) {
          newX = Math.max(c.targetX, c.x - speed);
        }

        if (c.y < c.targetY) {
          newY = Math.min(c.targetY, c.y + speed);
        } else if (c.y > c.targetY) {
          newY = Math.max(c.targetY, c.y - speed);
        }

        c.x = newX;
        c.y = newY;
        c.frame = (c.frame + 0.15) % 2;
        c.bounceOffset = Math.abs(Math.sin(c.frame * Math.PI)) * 10;

        if (newX === c.targetX && newY === c.targetY) {
          c.isMoving = false;
          c.frame = 0;
          c.bounceOffset = 0;
        }
      } else {
        const isWaveActive = latestGameState.current.isWaveActive;
        
        if (isWaveActive) {
          // Evento de onda: ignora movimento aleatório, marcha para (29,29)
          let nextX = Math.round(c.x);
          let nextY = Math.round(c.y);
          
          if (nextX < 29) { nextX++; c.dir = "right"; }
          else if (nextX > 29) { nextX--; c.dir = "left"; }
          else if (nextY < 29) { nextY++; }
          else if (nextY > 29) { nextY--; }
          
          if (nextX === 29 && nextY === 29) {
            // Kamikaze attack!
            c.hp = 0;
            useGameStore.getState().setGameState(prev => ({
              stellarNucleusHp: Math.max(0, (prev.stellarNucleusHp ?? 10000) - 200)
            }));
          } else {
            const tile = mapGridRef.current[nextY][nextX];
            if (!isCollidable(tile) || tile === TileType.WATER) { // They can traverse water to reach core!
              c.targetX = nextX;
              c.targetY = nextY;
              c.isMoving = true;
              c.frame = 0;
            }
          }
        } else {
          // Comportamento normal: Movimento aleatório e pacífico
          if (Math.random() < 0.007) {
            const dirChoice = Math.random();
            let nextX = Math.round(c.x);
            let nextY = Math.round(c.y);
  
            if (dirChoice < 0.25) {
              nextY -= 1;
            } else if (dirChoice < 0.5) {
              nextY += 1;
            } else if (dirChoice < 0.75) {
              nextX -= 1;
              c.dir = "left";
            } else {
              nextX += 1;
              c.dir = "right";
            }
  
            if (nextX >= 20 && nextX <= 40 && nextY >= 20 && nextY <= 40) {
              const tile = mapGridRef.current[nextY][nextX];
              if (tile === TileType.GRASS) {
                c.targetX = nextX;
                c.targetY = nextY;
                c.isMoving = true;
                c.frame = 0;
              }
            }
          }
        }
      }
    });
  };

  // Update cave worms in the East map — movem-se em qualquer tile nao-colisavel da caverna
  const updateWorms = (delta: number) => {
    const worms = wormsRef.current;
    // Worms sao mais rapidos e implacaveis que os slimes
    const speed = 0.14 * (delta / 16.66);

    worms.forEach((w) => {
      if (w.hp <= 0) return;
      if (w.isMoving) {
        let newX = w.x;
        let newY = w.y;

        if (w.x < w.targetX) newX = Math.min(w.targetX, w.x + speed);
        else if (w.x > w.targetX) newX = Math.max(w.targetX, w.x - speed);
        if (w.y < w.targetY) newY = Math.min(w.targetY, w.y + speed);
        else if (w.y > w.targetY) newY = Math.max(w.targetY, w.y - speed);

        w.x = newX;
        w.y = newY;
        w.frame = (w.frame + 0.2) % 4;
        w.bounceOffset = Math.sin(w.frame * Math.PI * 0.5) * 3;

        if (newX === w.targetX && newY === w.targetY) {
          w.isMoving = false;
          w.frame = 0;
          w.bounceOffset = 0;
        }
      } else {
        // Worms se movem mais frequentemente (0.015 vs 0.007 dos blobs)
        if (Math.random() < 0.015) {
          const dirs = [
            { dx: 0, dy: -1, d: "left" as const },
            { dx: 0, dy: 1, d: "right" as const },
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
            // Worms tem tendencia horizontal (deslizam mais pros lados)
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
          ];
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = Math.round(w.x) + chosen.dx;
          const nextY = Math.round(w.y) + chosen.dy;

          // Bounds da cave do leste (entre as paredes r=15 e r=45, c=4..57)
          const inCaveBounds = nextX >= 4 && nextX <= 57 && nextY >= 4 && nextY <= 55;
          // Evita as paredes particionantes do leste (r=15 e r=45)
          const notOnWall = nextY !== 15 && nextY !== 45;

          if (inCaveBounds && notOnWall && nextX >= 0 && nextX < GRID_COLS && nextY >= 0 && nextY < GRID_ROWS) {
            const tile = mapGridRef.current[nextY][nextX];
            if (!isCollidable(tile)) {
              w.targetX = nextX;
              w.targetY = nextY;
              w.dir = chosen.d;
              w.isMoving = true;
              w.frame = 0;
            }
          }
        }
      }
    });
  };

  const updateCrabs = (delta: number) => {
    const crabs = crabsRef.current;
    const speed = 0.08 * (delta / 16.66);

    crabs.forEach((c) => {
      if (c.hp <= 0) return;
      if (c.isMoving) {
        let newX = c.x;
        let newY = c.y;

        if (c.x < c.targetX) newX = Math.min(c.targetX, c.x + speed);
        else if (c.x > c.targetX) newX = Math.max(c.targetX, c.x - speed);
        if (c.y < c.targetY) newY = Math.min(c.targetY, c.y + speed);
        else if (c.y > c.targetY) newY = Math.max(c.targetY, c.y - speed);

        c.x = newX;
        c.y = newY;
        c.frame = (c.frame + 0.3) % 4;
        c.bounceOffset = Math.abs(Math.sin(c.frame * Math.PI)) * 2;

        if (newX === c.targetX && newY === c.targetY) {
          c.isMoving = false;
          c.frame = 0;
          c.bounceOffset = 0;
        }
      } else {
        // Crabs tend to move mostly sideways
        if (Math.random() < 0.01) {
          const dirs = [
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
            { dx: 0, dy: -1, d: "left" as const },
            { dx: 0, dy: 1, d: "right" as const },
          ];
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = Math.round(c.x) + chosen.dx;
          const nextY = Math.round(c.y) + chosen.dy;

          // North map safe bounds (Sandy shore / docks)
          const inBounds = nextX >= 2 && nextX <= 57 && nextY >= 23 && nextY <= 50;

          if (inBounds) {
            const tile = mapGridRef.current[nextY][nextX];
            if (!isCollidable(tile)) {
              c.targetX = nextX;
              c.targetY = nextY;
              c.dir = chosen.d;
              c.isMoving = true;
              c.frame = 0;
            }
          }
        }
      }
    });
  };

  const updateBees = (delta: number) => {
    const bees = beesRef.current;
    const speed = 0.12 * (delta / 16.66); // bees are fast

    bees.forEach((b) => {
      if (b.hp <= 0) return;
      if (b.isMoving) {
        let newX = b.x;
        let newY = b.y;

        if (b.x < b.targetX) newX = Math.min(b.targetX, b.x + speed);
        else if (b.x > b.targetX) newX = Math.max(b.targetX, b.x - speed);
        if (b.y < b.targetY) newY = Math.min(b.targetY, b.y + speed);
        else if (b.y > b.targetY) newY = Math.max(b.targetY, b.y - speed);

        b.x = newX;
        b.y = newY;
        b.frame = (b.frame + 0.4) % 4; // fast wing flap
        // Bees fly and bob up and down (slower bob than wing flap)
        b.bounceOffset = 6 + Math.sin(b.frame * Math.PI * 0.5) * 2; 

        if (newX === b.targetX && newY === b.targetY) {
          b.isMoving = false;
        }
      } else {
        // Keeps bobbing even when still
        b.frame = (b.frame + 0.4) % 4;
        b.bounceOffset = 6 + Math.sin(b.frame * Math.PI * 0.5) * 2; 

        if (Math.random() < 0.02) {
          const dirs = [
            { dx: 0, dy: -1, d: "left" as const },
            { dx: 0, dy: 1, d: "right" as const },
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
            { dx: -1, dy: -1, d: "left" as const },
            { dx: 1, dy: 1, d: "right" as const },
            { dx: -1, dy: 1, d: "left" as const },
            { dx: 1, dy: -1, d: "right" as const },
          ];
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = Math.round(b.x) + chosen.dx;
          const nextY = Math.round(b.y) + chosen.dy;

          const inBounds = nextX >= 2 && nextX <= 57 && nextY >= 4 && nextY <= 55;

          if (inBounds) {
            const tile = mapGridRef.current[nextY][nextX];
            // Bees can fly over water and hedges, but not walls
            if (tile !== TileType.WALL) {
              b.targetX = nextX;
              b.targetY = nextY;
              if (chosen.dx !== 0) b.dir = chosen.d;
              b.isMoving = true;
            }
          }
        }
      }
    });
  };

  const updateSnakes = (delta: number) => {
    const snakes = snakesRef.current;
    const speed = 0.06 * (delta / 16.66); // snakes are sneaky and slower

    snakes.forEach((s) => {
      if (s.hp <= 0) return;
      if (s.isMoving) {
        let newX = s.x;
        let newY = s.y;

        if (s.x < s.targetX) newX = Math.min(s.targetX, s.x + speed);
        else if (s.x > s.targetX) newX = Math.max(s.targetX, s.x - speed);
        if (s.y < s.targetY) newY = Math.min(s.targetY, s.y + speed);
        else if (s.y > s.targetY) newY = Math.max(s.targetY, s.y - speed);

        s.x = newX;
        s.y = newY;
        s.frame = (s.frame + 0.15) % 4; // slither slowly
        s.bounceOffset = 0; // they stay flat on the ground

        if (newX === s.targetX && newY === s.targetY) {
          s.isMoving = false;
          s.frame = 0;
        }
      } else {
        if (Math.random() < 0.01) {
          const dirs = [
            { dx: 0, dy: -1, d: "left" as const },
            { dx: 0, dy: 1, d: "right" as const },
            { dx: -1, dy: 0, d: "left" as const },
            { dx: 1, dy: 0, d: "right" as const },
          ];
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = Math.round(s.x) + chosen.dx;
          const nextY = Math.round(s.y) + chosen.dy;

          const inBounds = nextX >= 2 && nextX <= 57 && nextY >= 4 && nextY <= 55;

          if (inBounds) {
            const tile = mapGridRef.current[nextY][nextX];
            if (!isCollidable(tile)) {
              s.targetX = nextX;
              s.targetY = nextY;
              s.dir = chosen.d;
              s.isMoving = true;
            }
          }
        }
      }
    });
  };

  // Update MMO other players walking around the map
  const updateOtherPlayers = (delta: number) => {
    const players = otherPlayersRef.current;
    const speed = 0.15 * (delta / 16.66); // Slightly slower than main player for elegance

    players.forEach((p) => {
      // 1. Process movement
      if (p.isMoving) {
        let newX = p.x;
        let newY = p.y;

        if (p.x < p.targetX) {
          newX = Math.min(p.targetX, p.x + speed);
        } else if (p.x > p.targetX) {
          newX = Math.max(p.targetX, p.x - speed);
        }

        if (p.y < p.targetY) {
          newY = Math.min(p.targetY, p.y + speed);
        } else if (p.y > p.targetY) {
          newY = Math.max(p.targetY, p.y - speed);
        }

        p.x = newX;
        p.y = newY;
        p.frame = (p.frame + 0.15) % 4;

        if (newX === p.targetX && newY === p.targetY) {
          p.isMoving = false;
        }
      } else {
        // Occasionally initiate random movement (e.g., 0.8% chance per frame if not moving)
        if (Math.random() < 0.008) {
          const dirs = [
            { dx: 0, dy: -1, d: "up" },
            { dx: 0, dy: 1, d: "down" },
            { dx: -1, dy: 0, d: "left" },
            { dx: 1, dy: 0, d: "right" }
          ];
          const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
          const nextX = p.x + randomDir.dx;
          const nextY = p.y + randomDir.dy;

          // Stay within safe bounds of their map
          let regionOk = false;
          const activeMap = playerPos.mapId || "center";
          if (p.id === "mmo1" && activeMap === "center") regionOk = true;
          else if (p.id === "mmo2" && activeMap === "west") regionOk = true;
          else if (p.id === "mmo3" && activeMap === "east") regionOk = true;
          else if (p.id === "mmo4" && activeMap === "north") regionOk = true;
          else if (p.id === "mmo5" && activeMap === "south") regionOk = true;

          if (
            regionOk &&
            nextX >= 0 && nextX < GRID_COLS &&
            nextY >= 0 && nextY < GRID_ROWS &&
            !isCollidable(mapGridRef.current[nextY][nextX])
          ) {
            p.targetX = nextX;
            p.targetY = nextY;
            p.dir = randomDir.d;
            p.isMoving = true;
          }
        }
      }

      // 2. Chat bubbles handling
      if (p.bubbleText) {
        p.bubbleTimer -= delta;
        if (p.bubbleTimer <= 0) {
          p.bubbleText = undefined;
        }
      } else {
        // 0.2% chance per frame to shout something funny/useful
        if (Math.random() < 0.002) {
          const PHRASES = mmoPhrasesRef.current;
          if (PHRASES && PHRASES.length > 0) {
            p.bubbleText = PHRASES[Math.floor(Math.random() * PHRASES.length)];
          } else {
            p.bubbleText = "Hello!";
          }
          p.bubbleTimer = 4000 + Math.random() * 3000;
        }
      }
    });
  };

  const handleTargetDeath = (targetCreature: any, time: number) => {
    const MOB_STATS: Record<string, any> = {
      "Slime": { xp: 15, tokenChance: 0.20, minToken: 0.1, maxToken: 0.3 },
      "Cave Worm": { xp: 45, tokenChance: 0.18, minToken: 0.5, maxToken: 1.2 },
      "Crab": { xp: 80, tokenChance: 0.15, minToken: 1.0, maxToken: 1.5 },
      "Bee": { xp: 185, tokenChance: 0.30, minToken: 1.5, maxToken: 3.0 },
      "Snake": { xp: 350, tokenChance: 0.40, minToken: 2.0, maxToken: 5.0 }
    };
    const monsterKey = targetCreature.name === "Blob" ? "Slime" : targetCreature.name;
    const stats = MOB_STATS[monsterKey] || MOB_STATS["Slime"];

    const pLevel = latestGameState.current.level || 1;
    const mLevel = targetCreature.level || 1;
    const levelDiff = mLevel - pLevel;
    
    // XP Multiplier: +25% per level above, -25% per level below (min 10%)
    const xpMultiplier = Math.max(0.1, 1 + (levelDiff * 0.25)); 

    const finalXP = Math.floor(stats.xp * xpMultiplier * (0.85 + Math.random() * 0.3));
    useGameStore.getState().addExperience(finalXP);
    
    combatTextsRef.current.push({
      id: Math.random().toString(),
      text: `+${finalXP} XP`,
      x: targetCreature.x,
      y: targetCreature.y - 1.0,
      color: "#facc15",
      timestamp: time
    });

    // ── Kill Quests Tracking ──
    const currentMapId = latestPlayerPos.current.mapId || "center";
    const questRes = useGameStore.getState().registerKill(targetCreature.name, currentMapId);
    if (questRes.questCompleted && questRes.xpGained) {
      combatTextsRef.current.push({
        id: Math.random().toString(),
        text: typeof t === "function" ? t('quest.completed', { xp: questRes.xpGained, defaultValue: `Quest Completed! +${questRes.xpGained} XP` }) : `Quest Completed! +${questRes.xpGained} XP`,
        x: targetCreature.x,
        y: targetCreature.y - 1.5,
        color: "#facc15",
        timestamp: time + 500
      });
      if (questRes.dropItemId) {
        combatTextsRef.current.push({
          id: Math.random().toString(),
          text: `+Drop Raro!`,
          x: targetCreature.x,
          y: targetCreature.y - 2.0,
          color: "#e879f9",
          timestamp: time + 1000
        });
      }
    }

    if (Math.random() < stats.tokenChance) {
      const droppedTokens = Math.max(1, Math.ceil(stats.minToken + Math.random() * (stats.maxToken - stats.minToken)));
      useGameStore.getState().addItemToInventory("gamefi_token", "currency", droppedTokens);
      
      const currentWallet = useGameStore.getState().wallet;
      useGameStore.getState().updateWallet({
        gamefiBalance: (currentWallet.gamefiBalance || 0) + droppedTokens
      });
      
      combatTextsRef.current.push({
        id: Math.random().toString(),
        text: `+${droppedTokens} GFN`,
        x: targetCreature.x,
        y: targetCreature.y - 1.5,
        color: "#10b981",
        timestamp: time + 100
      });
    }

    if (Math.random() < 0.05) {
      useGameStore.getState().addItemToInventory("ruby_gem", "material", 1);
      
      combatTextsRef.current.push({
        id: Math.random().toString(),
        text: `+1 Gema!`,
        x: targetCreature.x,
        y: targetCreature.y - 2.0,
        color: "#e879f9",
        timestamp: time + 200
      });
    }

    useGameStore.getState().setLockedTarget(null);

    targetCreature.isMoving = false;
    const deadCreature = targetCreature;
    setTimeout(() => {
      const spawnX = Math.round(Math.max(2, Math.min(57, deadCreature.x + Math.floor(Math.random() * 8) - 4)));
      const spawnY = Math.round(Math.max(4, Math.min(55, deadCreature.y + Math.floor(Math.random() * 8) - 4)));
      deadCreature.x = spawnX;
      deadCreature.y = spawnY;
      deadCreature.targetX = spawnX;
      deadCreature.targetY = spawnY;
      deadCreature.hp = deadCreature.maxHp;
    }, 15000);
  };

  // Update Combat Logic (Auto-Attack & Cooldowns)
  const updateCombat = (time: number) => {
    // Remove textos expirados
    combatTextsRef.current = combatTextsRef.current.filter((t) => time - t.timestamp < 1500);

    const player = latestPlayerPos.current;
    const completedQuests = (Object.values(latestGameState.current.quests || {}) as Quest[]).filter((q) => q && q.status === "completed").length;
    const effectiveStats = calculateEffectiveStats(
      completedQuests,
      player.playerClass || latestGameState.current.playerClass,
      latestGameState.current.activeBuffs || []
    );

    // --- Regen passiva de HP e MP com bônus de status e buffs: +1/seg base + bônus ---
    if (time - lastRegenTimeRef.current >= 1000) {
      lastRegenTimeRef.current = time;
      if (!latestGameState.current.isBattleModeActive) {
        const maxHp = player.maxHp ?? 100;
        const maxMp = player.maxMp ?? 50;
        const currentHp = player.hp ?? 100;
        const currentMp = player.mp ?? 50;
        const newHp = Math.min(maxHp, currentHp + 1 + effectiveStats.hpRegenBonus);
        const newMp = Math.min(maxMp, currentMp + 1 + effectiveStats.mpRegenBonus);
        if (newHp !== currentHp || newMp !== currentMp) {
          useGameStore.getState().setPlayerPos({ hp: newHp, mp: newMp });
        }
      }
    }

    if (latestGameState.current.pendingLevelUp) {
      if (!processedLevelUpRef.current) {
        processedLevelUpRef.current = true;
        combatTextsRef.current.push({
          id: Math.random().toString(),
          text: `LEVEL UP!`,
          x: latestPlayerPos.current.x,
          y: latestPlayerPos.current.y - 2.0,
          color: "#facc15",
          timestamp: time + 3000
        });
        playSynthSound("success");
      }
    } else {
      processedLevelUpRef.current = false;
    }

    if (!latestGameState.current.isBattleModeActive) return;

    // ── Efeito visual de Exhaustion ──────────────────────────────────────────
    // Quando castMagic/usePotion é bloqueado pelo GCD, o store sinaliza via
    // lastBlockedCastTime. O canvas lê esse sinal e exibe a fumaça de exaustão.
    const blockedCastTime = latestGameState.current.lastBlockedCastTime ?? 0;
    if (blockedCastTime > 0 && blockedCastTime !== lastExhaustionShownRef.current) {
      lastExhaustionShownRef.current = blockedCastTime;
      const player = latestPlayerPos.current;
      // Texto de fumaça — exibe por 1.2s
      combatTextsRef.current.push({
        id: `exhaust_${blockedCastTime}`,
        text: "💨 Exausto!",
        x: player.x,
        y: player.y - 1.2,
        color: "#9ca3af",
        timestamp: time
      });
    }

    // ── Processa dano de magia (animations) ─────────────────────────────────
    const activeAnims = latestGameState.current.activeAnimations || [];
    activeAnims.forEach(anim => {
      if (anim.targetId && anim.type !== "heal" && !processedAnimsRef.current.has(anim.id)) {
        processedAnimsRef.current.add(anim.id);
        
        if (Date.now() - anim.timestamp > 1500) {
          return;
        }
        
        // Encontra o alvo
        let spellTarget: any = null;
        [creaturesRef.current, wormsRef.current, crabsRef.current, beesRef.current, snakesRef.current].forEach(list => {
          const found = list.find(c => c.id === anim.targetId);
          if (found) spellTarget = found;
        });

        if (spellTarget && spellTarget.hp > 0) {
          const player = latestPlayerPos.current;

          // ── RANGE CHECK DE MAGIA ────────────────────────────────────────────
          // O jogador DEVE estar dentro do raio SPELL_MAX_RANGE (4.0 tiles) para
          // que o dano seja aplicado. Se estiver fora, a animação é consumida mas
          // sem dano e sem XP — eliminando o exploit de atacar de longe com segurança.
          const spellDist = Math.hypot(player.x - spellTarget.x, player.y - spellTarget.y);
          if (spellDist > SPELL_MAX_RANGE) {
            // Fora de alcance: descarta animação sem causar efeito
            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: "Fora de alcance!",
              x: player.x,
              y: player.y - 0.8,
              color: "#6b7280",
              timestamp: time
            });
            return;
          }

          const { atkMultiplier, critChanceMultiplier } = getEquipmentBonuses(player);
          const pLevel = latestGameState.current.level || 1;
          let baseDmg = 10 + (pLevel * 2); // Heal e base spells normais
          if (anim.type === "fire") baseDmg = (25 + pLevel * 3) * atkMultiplier;
          if (anim.type === "lightning") baseDmg = (45 + pLevel * 4) * atkMultiplier;
          
          let finalDmg = Math.floor(baseDmg * (0.85 + Math.random() * 0.3));
          
          const isCrit = (anim.type === "fire" || anim.type === "lightning") && Math.random() < critChanceMultiplier;
          if (isCrit) finalDmg *= 2;
          
          spellTarget.hp -= finalDmg;

          combatTextsRef.current.push({
            id: Math.random().toString(),
            text: isCrit ? `CRIT -${finalDmg}!` : `-${finalDmg}`,
            x: spellTarget.x,
            y: spellTarget.y - 0.5,
            color: isCrit ? "#fbbf24" : (anim.type === "fire" ? "#f97316" : "#a855f7"),
            timestamp: time
          });

          if (spellTarget.hp <= 0) {
            handleTargetDeath(spellTarget, time);
          }
        }
      }
    });

    // Processamento de auto-ataque e engajamento
    if (latestGameState.current.isBattleModeActive && latestGameState.current.lockedTargetId) {
      const targetId = latestGameState.current.lockedTargetId;
      let targetCreature: any = null;
      [creaturesRef.current, wormsRef.current, crabsRef.current, beesRef.current, snakesRef.current].forEach(list => {
        const found = list.find((c) => c.id === targetId);
        if (found) targetCreature = found;
      });

      if (!targetCreature || targetCreature.hp <= 0) {
        useGameStore.getState().setBattleMode(false);
        useGameStore.getState().setLockedTarget(null);
        return;
      }

      const dist = Math.hypot(player.x - targetCreature.x, player.y - targetCreature.y);

      // Auto-attack físico corpo-a-corpo (distância <= 2.0)
      if (dist <= 2.0) {
        if (time - lastAttackTimeRef.current > 1200) {
          lastAttackTimeRef.current = time;

          const pMiss = Math.random() < 0.05;
          if (pMiss) {
            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: "MISS",
              x: targetCreature.x,
              y: targetCreature.y - 0.5,
              color: "#9ca3af",
              timestamp: time
            });
          } else {
            // Damage Formula com STR e multiplicadores de armas/buffs
            const { atkMultiplier, critChanceMultiplier } = getEquipmentBonuses(player);
            const pLevel = latestGameState.current.level || 1;
            const baseDmg = (8 + (effectiveStats.str * 0.7) + (pLevel * 1.5)) * atkMultiplier;
            let finalDmg = Math.floor(baseDmg * (0.85 + Math.random() * 0.3));

            const totalCritChance = critChanceMultiplier + (effectiveStats.str * 0.002) + (effectiveStats.agi * 0.003);
            const isCrit = Math.random() < totalCritChance;
            if (isCrit) finalDmg *= 2;

            targetCreature.hp -= finalDmg;

            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: isCrit ? `CRIT -${finalDmg}!` : `-${finalDmg}`,
              x: targetCreature.x,
              y: targetCreature.y - 0.5,
              color: isCrit ? "#fbbf24" : "#ef4444",
              timestamp: time
            });

            if (targetCreature.hp <= 0) {
              handleTargetDeath(targetCreature, time);
              return;
            }
          }
        }
      }

      // ── Retaliação do monstro (Range 4.0) ──
      if (dist <= SPELL_MAX_RANGE) {
        if (time - monsterLastAttackTimeRef.current > 1200) {
          monsterLastAttackTimeRef.current = time;

          // Evasão baseada em AGI do jogador
          const evasionChance = Math.min(0.40, 0.15 + (effectiveStats.agi * 0.003));
          const mMiss = Math.random() < evasionChance;

          if (mMiss) {
            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: "MISS",
              x: player.x,
              y: player.y - 0.5,
              color: "#9ca3af",
              timestamp: time
            });
          } else if (effectiveStats.isInvulnerable) {
            // Jogador com escudo protetor de invulnerabilidade ativo!
            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: "IMUNE!",
              x: player.x,
              y: player.y - 0.5,
              color: "#38bdf8",
              timestamp: time
            });
          } else {
            const { defMultiplier, blockChanceMultiplier } = getEquipmentBonuses(player);
            
            if (Math.random() < blockChanceMultiplier) {
              combatTextsRef.current.push({
                id: Math.random().toString(),
                text: "BLOCKED!",
                x: player.x,
                y: player.y - 0.5,
                color: "#60a5fa",
                timestamp: time
              });
              return;
            }

            const mBaseDmg = ((targetCreature.level || 1) * 4) * 1.10;
            const resReduction = Math.min(0.50, effectiveStats.res * 0.003);
            const totalReduction = Math.min(0.90, (1 - defMultiplier) + resReduction + (effectiveStats.damageReduction || 0));
            const mFinalDmg = Math.max(1, Math.floor(mBaseDmg * (1 - totalReduction) * (0.85 + Math.random() * 0.3)));
            
            const currentHp = latestPlayerPos.current.hp ?? 100;
            const newHp = Math.max(0, currentHp - mFinalDmg);
            
            useGameStore.getState().setPlayerPos({ hp: newHp });

            combatTextsRef.current.push({
              id: Math.random().toString(),
              text: `-${mFinalDmg}`,
              x: player.x,
              y: player.y - 0.5,
              color: "#dc2626",
              timestamp: time
            });

            if (newHp <= 0) {
              useGameStore.getState().killPlayer(targetCreature.name, mFinalDmg);
            }
          }
        }
      }
    }
  };

  // Update Player position (Snappy & continuous WASD interpolation)
  const updatePlayer = (delta: number) => {
    if (latestGameState.current.activeDialog) return;

    setPlayerPos((prev) => {
      let { x, y, targetX, targetY, dir, isMoving, frame } = prev;

      if (isMoving) {
        const completedQuests = (Object.values(latestGameState.current.quests || {}) as Quest[]).filter((q) => q && q.status === "completed").length;
        const effectiveStats = calculateEffectiveStats(
          completedQuests,
          prev.playerClass || latestGameState.current.playerClass,
          latestGameState.current.activeBuffs || []
        );

        const hasSpeedBuff = latestGameState.current.quests.onramp.status === "completed";
        const speedBonusFactor = (effectiveStats.speedMultiplier || 1.0) * (1 + (effectiveStats.agi - 10) * 0.003);
        const baseSpeed = (hasSpeedBuff ? 0.22 * 1.10 : 0.22) * speedBonusFactor;
        const speed = baseSpeed * (delta / 16.66);
        
        let newX = x;
        let newY = y;

        if (x < targetX) {
          newX = Math.min(targetX, x + speed);
        } else if (x > targetX) {
          newX = Math.max(targetX, x - speed);
        }

        if (y < targetY) {
          newY = Math.min(targetY, y + speed);
        } else if (y > targetY) {
          newY = Math.max(targetY, y - speed);
        }

        const newFrame = (frame + 0.15) % 4;

        if (newX === targetX && newY === targetY) {
          // Finished moving to cell, check portal teleportation instantly!
          const safeTargetX = Math.round(targetX);
          const safeTargetY = Math.round(targetY);
          const tile = mapGridRef.current[safeTargetY][safeTargetX];
          let finalX = safeTargetX;
          let finalY = safeTargetY;
          let triggeredTeleport = false;
          let nextMapId: "center" | "east" | "west" | "north" | "south" = prev.mapId || "center";

          if (tile === TileType.PORTAL_EAST) {
            nextMapId = "east";
            // Nasce perto do portal de retorno (lado esquerdo do mapa Leste)
            finalX = 4;
            finalY = 29;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_WEST) {
            nextMapId = "west";
            // Nasce perto do portal de retorno (lado direito do mapa Oeste)
            finalX = 55;
            finalY = 29;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_NORTH) {
            nextMapId = "north";
            // Nasce perto do portal de retorno (lado sul do mapa Norte)
            finalX = 29;
            finalY = 55;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_SOUTH) {
            nextMapId = "south";
            // Nasce perto do portal de retorno (lado norte do mapa Sul)
            finalX = 29;
            finalY = 4;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_CENTER) {
            nextMapId = "center";
            triggeredTeleport = true;
            // Nasce dentro da praça central, perto da entrada correspondente
            if (prev.mapId === "east") {
              finalX = 55;
              finalY = 29;
            } else if (prev.mapId === "west") {
              finalX = 4;
              finalY = 29;
            } else if (prev.mapId === "north") {
              finalX = 29;
              finalY = 4;
            } else if (prev.mapId === "south") {
              finalX = 29;
              finalY = 55;
            } else if (prev.mapId === "guildhouse" || prev.mapId === "amphitheater") {
              finalX = 30;
              finalY = 32; // Em frente à Fonte Sagrada na praça central
            } else {
              finalX = 30;
              finalY = 30;
            }
          }

          if (triggeredTeleport) {
            teleportFlashRef.current = 1.0;
            checkTerminalProximity(finalX, finalY, nextMapId);
            return {
              ...prev,
              x: finalX,
              y: finalY,
              targetX: finalX,
              targetY: finalY,
              isMoving: false,
              frame: 0,
              mapId: nextMapId,
            };
          }

          checkTerminalProximity(safeTargetX, safeTargetY, prev.mapId || "center");
          return {
            ...prev,
            x: safeTargetX,
            y: safeTargetY,
            isMoving: false,
            frame: 0,
          };
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          frame: newFrame,
        };
      } else {
        const isTyping = document.activeElement && (
          document.activeElement.tagName === "INPUT" || 
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.getAttribute("contenteditable") === "true"
        );
        if (isMovementBlocked || isTyping) {
          return prev;
        }

        let nextTargetX = Math.round(targetX);
        let nextTargetY = Math.round(targetY);
        let nextDir = dir;
        let wantToMove = false;

        if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
          nextTargetY = targetY - 1;
          nextDir = "up";
          wantToMove = true;
        } else if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
          nextTargetY = targetY + 1;
          nextDir = "down";
          wantToMove = true;
        } else if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
          nextTargetX = targetX - 1;
          nextDir = "left";
          wantToMove = true;
        } else if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
          nextTargetX = targetX + 1;
          nextDir = "right";
          wantToMove = true;
        }

        if (wantToMove) {
          if (
            Number.isNaN(nextTargetX) ||
            Number.isNaN(nextTargetY) ||
            nextTargetX < 0 ||
            nextTargetX >= GRID_COLS ||
            nextTargetY < 0 ||
            nextTargetY >= GRID_ROWS
          ) {
            return { ...prev, dir: nextDir };
          }

          const targetRow = mapGridRef.current[nextTargetY];
          if (!targetRow) {
            console.warn(`[GameCanvas] Linha de grid não encontrada para nextTargetY=${nextTargetY}. Prevenindo crash.`);
            return { ...prev, dir: nextDir };
          }
          
          const targetTile = targetRow[nextTargetX];
          if (targetTile === undefined || isCollidable(targetTile)) {
            return { ...prev, dir: nextDir };
          }

          const currentRegionDecs = getMapDecorations(playerPos.mapId || "center");
          const hitsMine = currentRegionDecs.some(d => d.type === "mine" && d.x === nextTargetX && d.y === nextTargetY);
          if (hitsMine) {
            return { ...prev, dir: nextDir };
          }

          const bridgeBlock = isGateBlocked(playerPos.mapId || "center", nextTargetX, nextTargetY, latestGameState.current.quests);
          if (bridgeBlock.blocked) {
            return { ...prev, dir: nextDir };
          }

          const hitsNPC = latestNpcs.current.some((n) => n.x === nextTargetX && n.y === nextTargetY);
          if (hitsNPC) {
            return { ...prev, dir: nextDir };
          }
          
          // Se o jogador começou a se mover, cancela a mineração ativa
          if (latestGameState.current.miningEndTimestamp) {
            useGameStore.getState().setGameState({
              miningEndTimestamp: undefined,
              miningTotalDuration: undefined,
              miningRarity: undefined
            });
            // Aviso visual: speech bubble por 3 segundos
            useGameStore.getState().setPlayerPos({
              bubbleText: "⛏️ Mineração cancelada!",
              bubbleTimer: Date.now() + 3000,
            });
          }

          return {
            ...prev,
            targetX: nextTargetX,
            targetY: nextTargetY,
            dir: nextDir,
            isMoving: true,
            frame: 0,
          };
        }
      }

      return prev;
    });
  };



  // Rendering engine
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const playerPosVal = latestPlayerPos.current;
    const currentRegion = playerPosVal.mapId || "center";
    const dims = latestDimensions.current;
    const calculatedWaveOffset = Math.floor(performance.now() / 250) % 16;

    // Dynamic zoom level: 6.5 for desktop, 2.5 for mobile
    // If latestGameState.current.mapZoomLevel is defined, we use it directly, scaling appropriately depending on device.
    const defaultZoom = dims.width < 768 ? 2.5 : 3.5;
    const currentZoomLevel = latestGameState.current.mapZoomLevel !== undefined ? latestGameState.current.mapZoomLevel : defaultZoom;

    // Background base
    ctx.fillStyle = "#0f172a"; // Deep rich dark background
    ctx.fillRect(0, 0, dims.width, dims.height);

    const playerWorldX = playerPosVal.x * TILE_SIZE + TILE_SIZE / 2;
    const playerWorldY = playerPosVal.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    
    // Translate and center camera on player
    ctx.translate(dims.width / 2, dims.height / 2);
    ctx.scale(currentZoomLevel, currentZoomLevel);
    ctx.translate(-playerWorldX, -playerWorldY);

    // Viewport bounds for culling
    const halfW = (dims.width / 2) / currentZoomLevel;
    const halfH = (dims.height / 2) / currentZoomLevel;
    const leftBound = playerWorldX - halfW - TILE_SIZE;
    const rightBound = playerWorldX + halfW + TILE_SIZE;
    const topBound = playerWorldY - halfH - TILE_SIZE;
    const bottomBound = playerWorldY + halfH + TILE_SIZE;

    // 1. Draw Map Tiles
    drawMapTiles(ctx, mapGridRef.current, currentRegion as MapId, leftBound, rightBound, topBound, bottomBound, calculatedWaveOffset, TILE_SIZE, GRID_ROWS, GRID_COLS);

    // 2. Render Bridges Gate Barriers (Lock indications) - Removed for free unrestricted access
    // All portals are open and freely accessible!

    // 3. Render Special Terminals
    drawSpecialTerminals(ctx, currentRegion as MapId, playerPosVal, TILE_SIZE);

    // 4. Render Decorative Objects
    drawMapDecorations(ctx, currentRegion as MapId, leftBound, rightBound, topBound, bottomBound, TILE_SIZE, playerPosVal);

    // 5. Render Passive Slime Blobs
    creaturesRef.current.forEach((slime) => {
      if (slime.hp <= 0) return;
      if (currentRegion !== "center") {
        return;
      }

      const worldX = slime.x * TILE_SIZE;
      const worldY = slime.y * TILE_SIZE - slime.bounceOffset;

      if (
        worldX < leftBound ||
        worldX > rightBound ||
        worldY < topBound ||
        worldY > bottomBound
      ) {
        return;
      }

      const shadowRadius = Math.max(4, 9 - slime.bounceOffset / 2);
      ctx.beginPath();
      ctx.ellipse(slime.x * TILE_SIZE + 16, slime.y * TILE_SIZE + 28, shadowRadius, shadowRadius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fill();

      let stretchW = 0;
      let stretchH = 0;
      if (slime.bounceOffset > 1) {
        stretchW = -3;
        stretchH = 3.5;
      } else if (slime.isMoving) {
        stretchW = 2.5;
        stretchH = -1.5;
      }

      ctx.fillStyle = slime.color;
      ctx.beginPath();
      ctx.ellipse(worldX + 16, worldY + 22, 11 + stretchW, 8 + stretchH, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(worldX + 10, worldY + 20, 2, 2);
      ctx.fillRect(worldX + 20, worldY + 20, 2, 2);
      
      ctx.fillStyle = "#ffffff";
      let eyeX = worldX + 11;
      let eyeY = worldY + 17;
      if (slime.dir === "right") eyeX += 2;
      ctx.fillRect(eyeX, eyeY, 2.5, 2.5);
      ctx.fillRect(eyeX + 6, eyeY, 2.5, 2.5);
      ctx.fillStyle = "#000000";
      ctx.fillRect(eyeX + 0.5, eyeY + 0.5, 1.5, 1.5);
      ctx.fillRect(eyeX + 6.5, eyeY + 0.5, 1.5, 1.5);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(eyeX + 3.5, eyeY + 4);
      ctx.lineTo(eyeX + 5, eyeY + 5);
      ctx.lineTo(eyeX + 6.5, eyeY + 4);
      ctx.stroke();

      // Health bars & Levels HUD over blobs
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.fillRect(worldX - 10, worldY - 14, 52, 11);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(worldX - 10, worldY - 14, 52, 11);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`BLOB (LV.${slime.level})`, worldX + 16, worldY - 9);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(worldX - 7, worldY - 6, 46, 2);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(worldX - 7, worldY - 6, 46 * (slime.hp / slime.maxHp), 2);
    });

    // 5.5 Render Cave Worms (exclusivos do mapa Leste)
    if (currentRegion === "east") {
      wormsRef.current.forEach((worm) => {
        if (worm.hp <= 0) return;
        const wx = worm.x * TILE_SIZE;
        const wy = worm.y * TILE_SIZE + worm.bounceOffset;

        // Culling
        if (wx < leftBound || wx > rightBound || wy < topBound || wy > bottomBound) return;

        const facing = worm.dir === "right" ? 1 : -1;
        // Ondula\u00e7\u00e3o sinuosa do corpo baseada no frame
        const wiggle = Math.sin(worm.frame * Math.PI) * 2.5;

        // Sombra
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 27, 14, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();

        // Corpo principal: 4 segmentos sobrepostos (calda -> cabe\u00e7a)
        const segments = [
          { ox: -facing * 18, oy: wiggle * 0.4, r: 6 },
          { ox: -facing * 9,  oy: wiggle * 0.7, r: 7 },
          { ox: facing * 1,   oy: wiggle,        r: 8 },
          { ox: facing * 10,  oy: wiggle * 0.5,  r: 7.5 },  // cabe\u00e7a
        ];

        segments.forEach((seg, i) => {
          // Gradiente de cor: mais escuro na calda, mais brilhante na cabe\u00e7a
          const brightness = 0.6 + i * 0.15;
          ctx.save();
          ctx.globalAlpha = 1;

          // Escamas: c\u00edrculos ligeiramente mais escuros no corpo
          ctx.beginPath();
          ctx.ellipse(wx + 16 + seg.ox, wy + 20 + seg.oy, seg.r, seg.r * 0.65, 0, 0, Math.PI * 2);
          ctx.fillStyle = worm.color;
          ctx.globalAlpha = brightness;
          ctx.fill();

          // Linha de escama (detalhe)
          if (i < 3) {
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(wx + 16 + seg.ox, wy + 20 + seg.oy, seg.r * 0.55, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        });

        // Cabe\u00e7a com detalhes
        const headX = wx + 16 + facing * 10;
        const headY = wy + 20 + wiggle * 0.5;

        // Chifrinhos / antenas
        ctx.strokeStyle = worm.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(headX + facing * 4, headY - 4);
        ctx.lineTo(headX + facing * 7, headY - 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(headX + facing * 3, headY - 5);
        ctx.lineTo(headX + facing * 6, headY - 10);
        ctx.stroke();

        // Olhos brilhantes (vermelhos)
        ctx.fillStyle = "#ff2222";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(headX + facing * 3.5, headY - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Pupila
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(headX + facing * 3.5, headY - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // HUD — nome e HP
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(wx - 8, wy - 18, 52, 11);
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(wx - 8, wy - 18, 52, 11);

        ctx.fillStyle = "#fca5a5";
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`WORM (LV.${worm.level})`, wx + 18, wy - 12);

        // Barra de HP — vermelho escuro
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(wx - 5, wy - 9, 46, 2);
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(wx - 5, wy - 9, 46 * (worm.hp / worm.maxHp), 2);
      });
    }

    // 5.6 Render Crabs (exclusivos do mapa Norte)
    if (currentRegion === "north") {
      crabsRef.current.forEach((crab) => {
        if (crab.hp <= 0) return;
        const wx = crab.x * TILE_SIZE;
        const wy = crab.y * TILE_SIZE - crab.bounceOffset;

        if (wx < leftBound || wx > rightBound || wy < topBound || wy > bottomBound) return;

        // Sombra
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 26, 12, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();

        // Patas laterais
        ctx.fillStyle = "#7f1d1d";
        const legWiggle = crab.isMoving ? Math.sin(crab.frame * Math.PI) * 2 : 0;
        ctx.fillRect(wx + 4 - legWiggle, wy + 20, 4, 2);
        ctx.fillRect(wx + 6 + legWiggle, wy + 23, 4, 2);
        ctx.fillRect(wx + 24 + legWiggle, wy + 20, 4, 2);
        ctx.fillRect(wx + 22 - legWiggle, wy + 23, 4, 2);

        // Corpo
        ctx.fillStyle = crab.color;
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 18, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Garras (Claws)
        ctx.fillStyle = crab.color;
        const clawRaise = crab.isMoving ? Math.abs(Math.sin(crab.frame * Math.PI)) * 3 : 0;
        ctx.beginPath();
        ctx.arc(wx + 7, wy + 14 - clawRaise, 4, 0, Math.PI * 2);
        ctx.arc(wx + 25, wy + 14 - clawRaise, 4, 0, Math.PI * 2);
        ctx.fill();

        // Olhinhos arregalados (stalks)
        ctx.fillStyle = crab.color;
        ctx.fillRect(wx + 11, wy + 9, 2, 4);
        ctx.fillRect(wx + 19, wy + 9, 2, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(wx + 10.5, wy + 7, 3, 3);
        ctx.fillRect(wx + 18.5, wy + 7, 3, 3);
        ctx.fillStyle = "#000000";
        ctx.fillRect(wx + 11, wy + 7.5, 1.5, 1.5);
        ctx.fillRect(wx + 19, wy + 7.5, 1.5, 1.5);

        // Name tag & HP bar
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(wx - 8, wy - 18, 48, 11);
        ctx.strokeStyle = "#991b1b";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(wx - 8, wy - 18, 48, 11);

        ctx.fillStyle = "#fb923c";
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`CRAB (LV.${crab.level})`, wx + 16, wy - 12);

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(wx - 5, wy - 9, 42, 2);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(wx - 5, wy - 9, 42 * (crab.hp / crab.maxHp), 2);
      });
    }

    // 5.7 Render Bees (West Map)
    if (currentRegion === "west") {
      beesRef.current.forEach((bee) => {
        if (bee.hp <= 0) return;
        const wx = bee.x * TILE_SIZE;
        const wy = bee.y * TILE_SIZE; // base y without bounce
        const bob = bee.bounceOffset;

        if (wx < leftBound || wx > rightBound || wy < topBound || wy > bottomBound) return;

        // Shadow (stable)
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 26, 10, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();

        const facing = bee.dir === "right" ? 1 : -1;

        // Wings (bobs)
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        const flap = Math.sin(bee.frame * Math.PI * 2) * 4;
        ctx.beginPath();
        ctx.ellipse(wx + 16 - facing * 2, wy + 14 - bob - flap, 4, 8, Math.PI / 6 * facing, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(wx + 16 + facing * 2, wy + 14 - bob + flap, 3, 6, -Math.PI / 8 * facing, 0, Math.PI * 2);
        ctx.fill();

        // Body (striped) (bobs)
        ctx.fillStyle = bee.color;
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 20 - bob, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1e293b"; // Black stripes
        ctx.fillRect(wx + 14 - facing * 2, wy + 15 - bob, 2, 9);
        ctx.fillRect(wx + 18 - facing * 2, wy + 15 - bob, 2, 9);

        // Stinger (bobs)
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(wx + 16 - facing * 8, wy + 20 - bob);
        ctx.lineTo(wx + 16 - facing * 12, wy + 20 - bob);
        ctx.lineTo(wx + 16 - facing * 8, wy + 22 - bob);
        ctx.fill();

        // Eye (bobs)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(wx + 16 + facing * 4, wy + 17 - bob, 3, 3);
        ctx.fillStyle = "#000000";
        ctx.fillRect(wx + 16 + facing * 5, wy + 17.5 - bob, 1.5, 1.5);

        // Name tag & HP bar (STABLE - no bob)
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(wx - 8, wy - 22, 48, 11);
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(wx - 8, wy - 22, 48, 11);

        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`BEE (LV.${bee.level})`, wx + 16, wy - 16);

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(wx - 5, wy - 13, 42, 2);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(wx - 5, wy - 13, 42 * (bee.hp / bee.maxHp), 2);
      });
    }

    // 5.8 Render Snakes (South Map)
    if (currentRegion === "south") {
      snakesRef.current.forEach((snake) => {
        if (snake.hp <= 0) return;
        const wx = snake.x * TILE_SIZE;
        const wy = snake.y * TILE_SIZE;

        if (wx < leftBound || wx > rightBound || wy < topBound || wy > bottomBound) return;

        const facing = snake.dir === "right" ? 1 : -1;
        const slither = Math.sin(snake.frame * Math.PI) * 3;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(wx + 16, wy + 28, 16, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();

        // Body segments (Tail to head)
        const segments = [
          { ox: -facing * 12, oy: -slither, r: 3 },
          { ox: -facing * 6, oy: slither, r: 4.5 },
          { ox: 0, oy: -slither, r: 5 },
          { ox: facing * 6, oy: slither, r: 5.5 },
          { ox: facing * 12, oy: -slither * 0.5 - 4, r: 5 }, // Raised head
        ];

        segments.forEach((seg, i) => {
          ctx.beginPath();
          ctx.arc(wx + 16 + seg.ox, wy + 26 + seg.oy, seg.r, 0, Math.PI * 2);
          ctx.fillStyle = i === segments.length - 1 ? "#14532d" : snake.color;
          ctx.fill();
        });

        // Eye
        const headX = wx + 16 + facing * 12;
        const headY = wy + 22 - slither * 0.5;
        ctx.fillStyle = "#fef08a"; // Yellow eye
        ctx.fillRect(headX + facing * 2, headY - 1, 2, 2);
        ctx.fillStyle = "#000000"; // Slit pupil
        ctx.fillRect(headX + facing * 2.5, headY - 1, 1, 2);

        // Tongue (flickering)
        if (Math.random() < 0.2) {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(headX + facing * 5, headY + 2, 3, 1);
        }

        // Name tag & HP bar
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(wx - 8, wy - 14, 48, 11);
        ctx.strokeStyle = "#14532d";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(wx - 8, wy - 14, 48, 11);

        ctx.fillStyle = "#86efac";
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`SNAKE (LV.${snake.level})`, wx + 16, wy - 8);

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(wx - 5, wy - 5, 42, 2);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(wx - 5, wy - 5, 42 * (snake.hp / snake.maxHp), 2);
      });
    }

    // 5.9 Target Lock & Aggro Indicator
    if (latestGameState.current.isBattleModeActive) {
      let activeCreatures: GameCreature[] = [];
      if (currentRegion === "center") activeCreatures = creaturesRef.current;
      else if (currentRegion === "east") activeCreatures = wormsRef.current;
      else if (currentRegion === "north") activeCreatures = crabsRef.current;
      else if (currentRegion === "west") activeCreatures = beesRef.current;
      else if (currentRegion === "south") activeCreatures = snakesRef.current;

      activeCreatures.forEach(creature => {
        if (creature.hp <= 0) return;
        const worldX = creature.x * TILE_SIZE;
        const worldY = creature.y * TILE_SIZE;

        if (worldX < leftBound || worldX > rightBound || worldY < topBound || worldY > bottomBound) return;

        // Draw Aggro Area
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY + 16, TILE_SIZE * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
        ctx.fill();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Target Lock
        if (latestGameState.current.lockedTargetId === creature.id) {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(worldX + 16, worldY + 16, 20, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(worldX + 16, worldY - 10);
          ctx.lineTo(worldX + 16, worldY + 42);
          ctx.moveTo(worldX - 10, worldY + 16);
          ctx.lineTo(worldX + 42, worldY + 16);
          ctx.stroke();
        }
      });
    }

    // 6. Render NPCs using the pixel character engine
    const npcsVal = latestNpcs.current;
    const gameStateVal = latestGameState.current;
    drawNPCs(ctx, npcsVal, gameStateVal, leftBound, rightBound, topBound, bottomBound);


    // 6.5. Render MMO Other Players on the map
    // Quando realOnlinePlayers esta definido (multiplayer ativo), desenha jogadores reais do Supabase
    if (realOnlinePlayers !== undefined) {
      const realPlayers = realOnlinePlayersRef.current;
      if (realPlayers.length > 0) {
        const mappedReal = realPlayers
          .filter((rp) => rp.map_id === (currentRegion || "center"))
          .map((rp) => ({
            id: rp.player_id,
            // player_id explícito para o stateKey do lerp em NPCManager
            player_id: rp.player_id,
            name: rp.name,
            x: rp.x,
            y: rp.y,
            targetX: rp.x,
            targetY: rp.y,
            dir: rp.dir,
            isMoving: rp.is_moving,
            frame: 0,
            updated_at: rp.updated_at,
            headColor: rp.head_color,
            torsoColor: rp.torso_color,
            legsColor: rp.legs_color,
            shoesColor: rp.shoes_color,
            skinColor: rp.skin_color,
            headType: rp.head_type,
            torsoType: rp.torso_type,
            shoesType: rp.shoes_type,
            faceType: rp.face_type,
            accessoryType: rp.accessory_type,
            activeTitle: rp.active_title,
            bubbleText: rp.bubbleText,
            bubbleTimer: rp.bubbleTimer,
            isGM: rp.isGM,
            level: rp.level,
          }));
        // Limpa estados de interpolação de players que saíram do mapa
        cleanupRenderStates(mappedReal);
        drawOtherPlayers(ctx, mappedReal, currentRegion as MapId);
      }
    } else {
      // Fallback: bots demo apenas se o multiplayer estiver desativado por flag
      drawOtherPlayers(ctx, otherPlayersRef.current, currentRegion as MapId);
    }

    // 7. Render Player using the character engine
    const playerScreenX = playerPosVal.x * TILE_SIZE;
    const playerScreenY = playerPosVal.y * TILE_SIZE;
    const isLegend = (Object.values(gameStateVal.quests) as Quest[]).every(q => q.status === "completed");

    drawPixelCharacter(
      ctx,
      playerScreenX,
      playerScreenY,
      playerPosVal,
      playerPosVal.isMoving,
      playerPosVal.frame,
      playerPosVal.dir,
      isLegend,
      playerPosVal.isGM === true,
      playerPosVal.bubbleText
    );

    // 7.5 Render Mining Progress Bar over Player
    if (gameStateVal.miningEndTimestamp && gameStateVal.miningTotalDuration) {
      const remainingTime = gameStateVal.miningEndTimestamp - Date.now();
      if (remainingTime > 0) {
        const progress = 1 - (remainingTime / gameStateVal.miningTotalDuration);

        // ── Timer MM:SS ──
        const totalSecs = Math.ceil(remainingTime / 1000);
        const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
        const secs = (totalSecs % 60).toString().padStart(2, "0");
        const timerText = `${mins}:${secs}`;

        // ── Cor por raridade ──
        let barColor = "#71717a";      // common  — cinza
        let rarityColor = "#94a3b8";
        if (gameStateVal.miningRarity === "uncommon") { barColor = "#22c55e"; rarityColor = "#22c55e"; }
        else if (gameStateVal.miningRarity === "rare") { barColor = "#3b82f6"; rarityColor = "#3b82f6"; }
        else if (gameStateVal.miningRarity === "epic") { barColor = "#a855f7"; rarityColor = "#a855f7"; }

        const cx = playerScreenX + 16; // centro horizontal do personagem

        ctx.save();

        // ── Fundo do painel (acima do nameplate) ──
        const panelW = 76;
        const panelH = 30;
        const panelX = cx - panelW / 2;
        const panelY = playerScreenY - 72; // bem acima do nome

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(panelX, panelY, panelW, panelH, 4);
        else ctx.rect(panelX, panelY, panelW, panelH);
        ctx.fill();
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Texto "⛏️ MINERANDO..." animado ──
        const dots = ".".repeat(Math.floor(Date.now() / 500) % 4);
        ctx.font = "bold 6px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = rarityColor;
        ctx.fillText(`⛏ MINERANDO${dots}`, cx, panelY + 10);

        // ── Timer MM:SS ──
        ctx.font = "bold 8px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(timerText, cx, panelY + 21);

        // ── Barra de progresso ──
        const barY = panelY + panelH + 2;
        const barW = panelW;
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.fillRect(panelX, barY, barW, 5);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(panelX, barY, barW, 5);
        ctx.fillStyle = barColor;
        ctx.fillRect(panelX + 1, barY + 1, (barW - 2) * progress, 3);

        ctx.restore();
      } else {
        // ── Mineração Concluída: Chamar endpoint on-chain ──
        const completedRarity = gameStateVal.miningRarity;
        const completedTotalDuration = gameStateVal.miningTotalDuration;

        setTimeout(async () => {
          const currentStoreState = useGameStore.getState();
          // Evita dupla execução
          if (
            !currentStoreState.miningEndTimestamp ||
            currentStoreState.miningTotalDuration !== completedTotalDuration
          ) return;

          // Limpa o estado de mineração imediatamente para evitar re-execução
          useGameStore.getState().setGameState({
            miningEndTimestamp: undefined,
            miningTotalDuration: undefined,
            miningRarity: undefined,
          });

          const walletAddress = currentStoreState.wallet?.publicKey;
          if (!walletAddress) return;

          try {
            const BACKEND_URL =
              (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:3001";

            const res = await fetch(`${BACKEND_URL}/api/mining/collect`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress, rarity: completedRarity }),
            });

            if (!res.ok) {
              // Fallback local se o servidor não estiver disponível
              console.warn("[Mining] Servidor offline — aplicando recompensa local.");
              const fallbackXp = completedRarity === "epic" ? 1000 :
                completedRarity === "rare" ? 400 :
                completedRarity === "uncommon" ? 150 : 50;
              const fallbackGems = completedRarity === "epic" ? 25 :
                completedRarity === "rare" ? 10 :
                completedRarity === "uncommon" ? 4 : 1;
              const fallbackGamefi = completedRarity === "epic" ? 40 :
                completedRarity === "rare" ? 11 :
                completedRarity === "uncommon" ? 3 : 0.75;

              useGameStore.getState().addExperience(fallbackXp);
              useGameStore.getState().addItemToInventory("ruby_gem", "material", fallbackGems);
              useGameStore.getState().setGameState({
                pendingMiningReward: {
                  txHash: "",
                  gems: fallbackGems,
                  gamefi: fallbackGamefi,
                  xp: fallbackXp,
                  rarity: completedRarity || "common",
                },
              });
              return;
            }

            const data = await res.json();
            const { txHash, gems, gamefi, xp } = data;

            // Aplica recompensas on-chain no estado local
            useGameStore.getState().addExperience(xp);
            useGameStore.getState().addItemToInventory("ruby_gem", "material", gems);
            useGameStore.getState().setGameState((prev) => ({
              wallet: {
                ...prev.wallet,
                gamefiBalance: (prev.wallet.gamefiBalance || 0) + gamefi,
              },
              pendingMiningReward: {
                txHash,
                gems,
                gamefi,
                xp,
                rarity: completedRarity || "common",
              },
            }));

            console.log(`[Mining] ✅ On-chain! Hash: ${txHash} | Gems: ${gems} | GAMEFI: ${gamefi} | XP: ${xp}`);
          } catch (err) {
            console.error("[Mining] Erro ao coletar recompensa:", err);
          }
        }, 0);
      }
    }

    // 7.2 Draw Curved HP and MP Bars (Somente no Modo Batalha)
    if (gameStateVal.isBattleModeActive) {
      const hp = playerPosVal.hp !== undefined ? playerPosVal.hp : 100;
      const maxHp = playerPosVal.maxHp || 100;
      const mp = playerPosVal.mp !== undefined ? playerPosVal.mp : 50;
      const maxMp = playerPosVal.maxMp || 50;
    
    const barRadius = 24;
    const barWidth = 6;
    
    const drawCurvedBar = (isLeft: boolean, ratio: number, color: string, bgColor: string) => {
      ctx.save();
      ctx.lineCap = "butt";
      
      let startAngle, endAngle, counterClockwise;
      if (isLeft) {
        startAngle = Math.PI * 0.70;
        endAngle = Math.PI * 1.30;
        counterClockwise = false;
      } else {
        startAngle = Math.PI * 0.30;
        endAngle = Math.PI * 1.70;
        counterClockwise = true;
      }
      
      const sweep = Math.PI * 0.60; // 1.30 - 0.70 = 0.60 PI

      // 1. Border
      ctx.lineWidth = barWidth + 2;
      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.arc(playerScreenX + 16, playerScreenY + 16, barRadius, startAngle, endAngle, counterClockwise);
      ctx.stroke();
      
      // 2. Background
      ctx.lineWidth = barWidth;
      ctx.strokeStyle = bgColor;
      ctx.beginPath();
      ctx.arc(playerScreenX + 16, playerScreenY + 16, barRadius, startAngle, endAngle, counterClockwise);
      ctx.stroke();
      
      // 3. Fill
      if (ratio > 0) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        let currentEndAngle;
        if (isLeft) {
           currentEndAngle = startAngle + sweep * ratio;
        } else {
           currentEndAngle = startAngle - sweep * ratio;
        }
        ctx.arc(playerScreenX + 16, playerScreenY + 16, barRadius, startAngle, currentEndAngle, counterClockwise);
        ctx.stroke();
      }
      
      // 4. Segment Lines (Retro blocks look)
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      for (let i = 1; i < 10; i++) {
         let segAngle;
         if (isLeft) {
            segAngle = startAngle + sweep * (i / 10);
         } else {
            segAngle = startAngle - sweep * (i / 10);
         }
         const innerRadius = barRadius - barWidth / 2;
         const outerRadius = barRadius + barWidth / 2;
         ctx.beginPath();
         ctx.moveTo(playerScreenX + 16 + Math.cos(segAngle) * innerRadius, playerScreenY + 16 + Math.sin(segAngle) * innerRadius);
         ctx.lineTo(playerScreenX + 16 + Math.cos(segAngle) * outerRadius, playerScreenY + 16 + Math.sin(segAngle) * outerRadius);
         ctx.stroke();
      }
      
      ctx.restore();
    };

    drawCurvedBar(true, Math.max(0, Math.min(1, hp / maxHp)), "#22c55e", "#14532d"); // Green HP
    drawCurvedBar(false, Math.max(0, Math.min(1, mp / maxMp)), "#3b82f6", "#1e3a8a"); // Blue MP
    }

    // Display Player name tag over their head with proper head clearance, dynamic formatting and neon effects
    const playerNameY = playerScreenY - 19;
    ctx.font = "bold 9px 'JetBrains Mono', 'Ubuntu', sans-serif";
    
    // Determine completed quest states
    const hasWallet = gameStateVal.quests.wallet.status === "completed";
    const hasOnramp = gameStateVal.quests.onramp.status === "completed";
    const hasSoroban = gameStateVal.quests.soroban.status === "completed";
    const hasHold = gameStateVal.quests.hold.status === "completed";

    let prefix = "";
    if (hasHold) {
      prefix = "⭐ ";
    }
    let namePart = playerPosVal.name || "Viajante";
    if (playerPosVal.guildTag) {
      namePart = `${playerPosVal.guildTag} ${namePart}`;
    }
    let suffix = "";
    if (hasWallet && gameStateVal.wallet.publicKey) {
      const last4 = gameStateVal.wallet.publicKey.slice(-4);
      suffix = ` [${last4}]`;
    }

    // Determine active title / style tier for overhead tag
    const completedCount = [hasWallet, hasOnramp, hasSoroban, hasHold].filter(Boolean).length;
    let currentTitle = playerPosVal.activeTitle;

    // Force automatic progression if player hasn't completed all 4 quests OR if activeTitle was auto-assigned earlier
    if (completedCount < 4 || !currentTitle || currentTitle === (typeof t === "function" ? t('title.newbie', "Newbie Castaway") : "Newbie Castaway") || (hasHold && currentTitle === (typeof t === "function" ? t('title.initiated', "Stellar Initiate") : "Stellar Initiate"))) {
      if (hasHold) currentTitle = typeof t === "function" ? t('title.legendary', "Legendary Stellar Hero") : "Legendary Stellar Hero";
      else if (hasSoroban) currentTitle = typeof t === "function" ? t('title.soroban', "Soroban Alchemist") : "Soroban Alchemist";
      else if (hasOnramp) currentTitle = typeof t === "function" ? t('title.onramp', "On-Ramp Operator") : "On-Ramp Operator";
      else if (hasWallet) currentTitle = typeof t === "function" ? t('title.initiated', "Stellar Initiate") : "Stellar Initiate";
      else currentTitle = typeof t === "function" ? t('title.newbie', "Newbie Castaway") : "Newbie Castaway";
    }

    let tagColor = "#ffffff";
    let tagShadowColor = "";
    let tagShadowBlur = 0;
    let borderStyle = "#cbd5e1";

    const isGM = playerPosVal.isGM === true;

    if (isGM) {
      prefix = "⭐ ";
      namePart = "[GM]";
      suffix = "";
      tagColor = "#ff0000";
      tagShadowColor = "";
      tagShadowBlur = 0;
      borderStyle = "#ff0000";
    } else if (currentTitle === (typeof t === "function" ? t('title.legendary', "Legendary Stellar Hero") : "Legendary Stellar Hero")) {
      // 5. Herói Lendário: Verde Matrix (#00ff66)
      tagColor = "#00ff66";
      tagShadowColor = "#00e676";
      tagShadowBlur = 8;
      borderStyle = "#00ff66";
    } else if (currentTitle === (typeof t === "function" ? t('title.soroban', "Soroban Alchemist") : "Soroban Alchemist")) {
      // 4. Alquimista Soroban: Roxo Místico (#e879f9)
      tagColor = "#e879f9";
      tagShadowColor = "#d946ef";
      tagShadowBlur = 6;
      borderStyle = "#e879f9";
    } else if (currentTitle === (typeof t === "function" ? t('title.onramp', "On-Ramp Operator") : "On-Ramp Operator")) {
      // 3. Operador On-Ramp: Dourado Nobre (#fbbf24)
      tagColor = "#fbbf24";
      tagShadowColor = "#f59e0b";
      tagShadowBlur = 6;
      borderStyle = "#fbbf24";
    } else if (currentTitle === (typeof t === "function" ? t('title.initiated', "Stellar Initiate") : "Stellar Initiate")) {
      // 2. Iniciado de Stellar: Amarelo Padrão (#ffc600)
      tagColor = "#ffc600";
      tagShadowColor = "";
      tagShadowBlur = 0;
      borderStyle = "#facc15";
    } else {
      // 1. Náufrago: Branco NPC (#ffffff)
      tagColor = "#ffffff";
      tagShadowColor = "";
      tagShadowBlur = 0;
      borderStyle = "#cbd5e1";
    }

    const part1 = prefix + namePart;
    const part2 = suffix;

    const part1Width = ctx.measureText(part1).width;
    const part2Width = ctx.measureText(part2).width;
    const totalWidth = part1Width + part2Width;
    const playerNameW = totalWidth + 8;
    const playerNameH = 13;

    // Draw background
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(playerScreenX + 16 - playerNameW / 2, playerNameY - 2, playerNameW, playerNameH);

    // Apply global shadow for border drawing
    if (tagShadowBlur > 0 && tagShadowColor) {
      ctx.shadowColor = tagShadowColor;
      ctx.shadowBlur = tagShadowBlur;
    }
    ctx.strokeStyle = borderStyle;
    ctx.lineWidth = 1;
    ctx.strokeRect(playerScreenX + 16 - playerNameW / 2, playerNameY - 2, playerNameW, playerNameH);
    ctx.shadowBlur = 0; // Turn off immediately for next drawing

    // Draw text parts
    const startX = playerScreenX + 16 - totalWidth / 2;
    const drawY = playerNameY + playerNameH / 2 - 2 + 0.5;

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // Draw Part 1 (Prefix + Name)
    if (tagShadowBlur > 0 && tagShadowColor) {
      ctx.shadowColor = tagShadowColor;
      ctx.shadowBlur = tagShadowBlur;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = tagColor;
    ctx.fillText(part1, startX, drawY);
    ctx.shadowBlur = 0;

    // Draw Part 2 (Wallet last4 Suffix)
    if (part2) {
      if (tagShadowBlur > 0 && tagShadowColor) {
        ctx.shadowColor = tagShadowColor;
        ctx.shadowBlur = tagShadowBlur;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = tagColor;
      ctx.fillText(part2, startX + part1Width, drawY);
      ctx.shadowBlur = 0;
    }

    // 7.4 Render Floating Combat Texts (FCT)
    const now = performance.now();
    combatTextsRef.current.forEach(ct => {
      const age = now - ct.timestamp;
      const alpha = Math.max(0, 1 - age / 1500);
      const floatY = (age / 1500) * 20; // Sobe 20px
      const cx = ct.x * TILE_SIZE + TILE_SIZE / 2;
      const cy = ct.y * TILE_SIZE - floatY;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ct.color;
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      ctx.fillText(ct.text, cx, cy);
      
      // Outline for better visibility
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0, 0, 0, " + alpha + ")";
      ctx.strokeText(ct.text, cx, cy);
      ctx.restore();
    });

    // 7.4.5 Render Animations (Heal, Fire, Lightning)
    if (gameStateVal.activeAnimations && gameStateVal.activeAnimations.length > 0) {
      // Passa TODAS as listas de criaturas para que a animação seja renderizada no alvo correto
      const allCreatures = [
        ...creaturesRef.current,
        ...wormsRef.current,
        ...crabsRef.current,
        ...beesRef.current,
        ...snakesRef.current,
      ];
      drawActiveAnimations(ctx, gameStateVal.activeAnimations, TILE_SIZE, Date.now(), allCreatures);
    }

    // 7.5. Render Magnetic Quest Arrow (Seta Magnética de Missões)
    const currentQuestTarget = getCurrentQuestTarget(latestGameState.current, playerPosVal);
    if (currentQuestTarget && !latestGameState.current.activeDialog) {
      drawQuestArrow(ctx, currentQuestTarget, playerPosVal, dims, currentZoomLevel);
    }

    ctx.restore();

    // 8. Fullscreen Portal Flash Screen Overlay
    if (teleportFlashRef.current > 0) {
      ctx.fillStyle = `rgba(34, 211, 238, ${teleportFlashRef.current})`;
      ctx.fillRect(0, 0, dims.width, dims.height);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✦ PORTAL DO TEMPLO ATIVADO ✦", dims.width / 2, dims.height / 2);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block mx-auto max-w-full h-full cursor-pointer touch-none shadow-inner"
        onClick={handleCanvasClick}
      />

      {/* TOP-LEFT CORNER HUD: COORDINATES & MAP LOCATION */}
      <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 rounded-lg p-2 flex flex-col gap-0.5 shadow-md select-none pointer-events-none font-mono">
        <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold">
          <Compass className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
          <span>{typeof t === "function" ? t('map.center', "Central Square") : "Central Square"}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-400">
          <MapPin className="h-3 w-3 text-emerald-400" />
          <span>Coordenadas: </span>
          <span className="text-cyan-300 font-black">X: {Math.round(playerPos.x)}, Y: {Math.round(playerPos.y)}</span>
        </div>
      </div>

      <span className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[9px] font-mono tracking-widest text-slate-500 select-none pointer-events-none">
        STELLAR TOWN ENGINE v2.2
      </span>
    </div>
  );
};

