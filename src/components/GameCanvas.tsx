/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { GameState, Player, NPC, Quest } from "../types";
import { generateMap, TILE_SIZE, TileType, isCollidable, isBridgeBlocked, GRID_COLS, GRID_ROWS, MAP_DECORATIONS, GameDecoration, GameCreature } from "../gameData";
import { Compass, MapPin, Sparkles } from "lucide-react";

interface GameCanvasProps {
  gameState: GameState;
  playerPos: Player;
  setPlayerPos: React.Dispatch<React.SetStateAction<Player>>;
  npcs: NPC[];
  onTalkToNPC: (npc: NPC) => void;
  onNearTerminal: (terminalType: "wallet" | "onramp" | "soroban" | "hold" | null) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  playerPos,
  setPlayerPos,
  npcs,
  onTalkToNPC,
  onNearTerminal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapGrid] = useState<number[][]>(() => generateMap());
  const [dimensions, setDimensions] = useState({ width: 680, height: 480 });
  const latestPlayerPos = useRef(playerPos);
  const latestGameState = useRef(gameState);
  const latestDimensions = useRef(dimensions);
  const latestNpcs = useRef(npcs);

  useEffect(() => {
    latestPlayerPos.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    latestGameState.current = gameState;
  }, [gameState]);

  useEffect(() => {
    latestDimensions.current = dimensions;
  }, [dimensions]);

  useEffect(() => {
    latestNpcs.current = npcs;
  }, [npcs]);

  // Helper to determine region of a player/NPC coordinate
  const getCoordinateRegion = (x: number, y: number): "center" | "east" | "west" | "north" | "south" => {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    if (roundedX >= 48 && roundedX <= 59 && roundedY >= 10 && roundedY <= 50) {
      return "east";
    }
    if (roundedX >= 1 && roundedX <= 12 && roundedY >= 10 && roundedY <= 50) {
      return "west";
    }
    if (roundedX >= 10 && roundedX <= 50 && roundedY >= 1 && roundedY <= 12) {
      return "north";
    }
    if (roundedX >= 10 && roundedX <= 50 && roundedY >= 48 && roundedY <= 59) {
      return "south";
    }
    return "center";
  };

  // Helper to determine region of a tile coordinate
  const getTileRegion = (c: number, r: number): "center" | "east" | "west" | "north" | "south" | "none" => {
    if (c >= 48 && c <= 59 && r >= 10 && r <= 50) return "east";
    if (c >= 1 && c <= 12 && r >= 10 && r <= 50) return "west";
    if (c >= 10 && c <= 50 && r >= 1 && r <= 12) return "north";
    if (c >= 10 && c <= 50 && r >= 48 && r <= 59) return "south";
    
    // Bridges and central plaza are center
    if (c >= 18 && c <= 42 && r >= 18 && r <= 42) return "center";
    if ((r === 29 || r === 30) && c >= 13 && c <= 47) return "center";
    if ((c === 29 || c === 30) && r >= 13 && r <= 47) return "center";
    
    return "none";
  };

  // 2.2x default zoom factor for that perfectly sized close-up retro feel!
  const zoomLevel = 2.2;

  // Keyboard controls ref to track active keys
  const keysPressed = useRef<Record<string, boolean>>({});

  // Passive Slime Blobs in town square (tracked in Ref for 60fps buttery smooth rendering without React state overhead)
  const creaturesRef = useRef<GameCreature[]>([
    { id: "slime1", name: "Blob", x: 25, y: 24, targetX: 25, targetY: 24, isMoving: false, frame: 0, color: "#eab308", level: 1, hp: 100, maxHp: 100, bounceOffset: 0, dir: "left" },
    { id: "slime2", name: "Blob", x: 35, y: 24, targetX: 35, targetY: 24, isMoving: false, frame: 0, color: "#d97706", level: 1, hp: 100, maxHp: 100, bounceOffset: 0, dir: "right" },
    { id: "slime3", name: "Blob", x: 24, y: 34, targetX: 24, targetY: 34, isMoving: false, frame: 0, color: "#ea580c", level: 2, hp: 100, maxHp: 100, bounceOffset: 0, dir: "left" },
    { id: "slime4", name: "Blob", x: 36, y: 34, targetX: 36, targetY: 34, isMoving: false, frame: 0, color: "#ef4444", level: 3, hp: 100, maxHp: 100, bounceOffset: 0, dir: "right" },
    { id: "slime5", name: "Blob", x: 28, y: 25, targetX: 28, targetY: 25, isMoving: false, frame: 0, color: "#f97316", level: 1, hp: 100, maxHp: 100, bounceOffset: 0, dir: "left" },
    { id: "slime6", name: "Blob", x: 32, y: 35, targetX: 32, targetY: 35, isMoving: false, frame: 0, color: "#b45309", level: 2, hp: 100, maxHp: 100, bounceOffset: 0, dir: "right" },
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

  // Keyboard Event Listeners for Movement and Interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(key)
      ) {
        e.preventDefault();
      }
      keysPressed.current[key] = true;

      if (key === " " || key === "enter") {
        triggerInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playerPos, npcs, gameState]);

  // Helper to trigger interaction with nearby NPC or terminal
  const triggerInteraction = () => {
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

    checkTerminalProximity(targetX, targetY);
  };

  // Helper to check and notify proximity to terminals
  const checkTerminalProximity = (x: number, y: number) => {
    const state = latestGameState.current;
    if (Math.abs(x - 54) <= 2 && Math.abs(y - 30) <= 2) {
      onNearTerminal("wallet");
      return;
    }
    if (Math.abs(x - 30) <= 2 && Math.abs(y - 6) <= 2) {
      if (state.quests.wallet.status === "completed") {
        onNearTerminal("onramp");
      }
      return;
    }
    if (Math.abs(x - 6) <= 2 && Math.abs(y - 30) <= 2) {
      if (state.quests.onramp.status === "completed") {
        onNearTerminal("soroban");
      }
      return;
    }
    if (Math.abs(x - 30) <= 2 && Math.abs(y - 54) <= 2) {
      if (state.quests.soroban.status === "completed") {
        onNearTerminal("hold");
      }
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

      updatePlayer(delta);
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
        if (Math.random() < 0.007) {
          const dirChoice = Math.random();
          let nextX = c.x;
          let nextY = c.y;

          if (dirChoice < 0.25) {
            nextY = c.y - 1;
          } else if (dirChoice < 0.5) {
            nextY = c.y + 1;
          } else if (dirChoice < 0.75) {
            nextX = c.x - 1;
            c.dir = "left";
          } else {
            nextX = c.x + 1;
            c.dir = "right";
          }

          if (nextX >= 20 && nextX <= 40 && nextY >= 20 && nextY <= 40) {
            const tile = mapGrid[nextY][nextX];
            if (tile === TileType.GRASS) {
              c.targetX = nextX;
              c.targetY = nextY;
              c.isMoving = true;
              c.frame = 0;
            }
          }
        }
      }
    });
  };

  // Update Player position (Snappy & continuous WASD interpolation)
  const updatePlayer = (delta: number) => {
    if (latestGameState.current.activeDialog) return;

    setPlayerPos((prev) => {
      let { x, y, targetX, targetY, dir, isMoving, frame } = prev;

      if (isMoving) {
        // Fast, modern retro game movement speed (0.22)
        const speed = 0.22 * (delta / 16.66);
        
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
          const tile = mapGrid[targetY][targetX];
          let finalX = targetX;
          let finalY = targetY;
          let triggeredTeleport = false;

          if (tile === TileType.PORTAL_EAST) {
            finalX = 49;
            finalY = 30;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_WEST) {
            finalX = 11;
            finalY = 30;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_NORTH) {
            finalX = 30;
            finalY = 11;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_SOUTH) {
            finalX = 30;
            finalY = 49;
            triggeredTeleport = true;
          } else if (tile === TileType.PORTAL_CENTER) {
            triggeredTeleport = true;
            if (targetX > 45) {
              finalX = 41;
              finalY = 30;
            } else if (targetX < 15) {
              finalX = 19;
              finalY = 30;
            } else if (targetY < 15) {
              finalX = 30;
              finalY = 19;
            } else if (targetY > 45) {
              finalX = 30;
              finalY = 41;
            }
          }

          if (triggeredTeleport) {
            teleportFlashRef.current = 1.0;
            checkTerminalProximity(finalX, finalY);
            return {
              ...prev,
              x: finalX,
              y: finalY,
              targetX: finalX,
              targetY: finalY,
              isMoving: false,
              frame: 0,
            };
          }

          checkTerminalProximity(targetX, targetY);
          return {
            ...prev,
            x: targetX,
            y: targetY,
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
        let nextTargetX = targetX;
        let nextTargetY = targetY;
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
            nextTargetX < 0 ||
            nextTargetX >= GRID_COLS ||
            nextTargetY < 0 ||
            nextTargetY >= GRID_ROWS
          ) {
            return { ...prev, dir: nextDir };
          }

          const targetTile = mapGrid[nextTargetY][nextTargetX];
          if (isCollidable(targetTile)) {
            return { ...prev, dir: nextDir };
          }

          const bridgeBlock = isBridgeBlocked(nextTargetX, nextTargetY, latestGameState.current.quests);
          if (bridgeBlock.blocked) {
            return { ...prev, dir: nextDir };
          }

          const hitsNPC = latestNpcs.current.some((n) => n.x === nextTargetX && n.y === nextTargetY);
          if (hitsNPC) {
            return { ...prev, dir: nextDir };
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

  // Portal Vortex animation painter helper
  const drawPortalVortex = (ctx: CanvasRenderingContext2D, wx: number, wy: number, color: string) => {
    const cx = wx + TILE_SIZE / 2;
    const cy = wy + TILE_SIZE / 2;
    const pulseRadius = 11 + Math.sin(performance.now() / 150) * 3;
    
    // Glowing backing
    ctx.fillStyle = color + "20";
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer swirling rings
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary ring
    ctx.strokeStyle = color + "90";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling orbit star particle
    ctx.fillStyle = color;
    const angle = (performance.now() / 180) % (Math.PI * 2);
    const px = cx + Math.cos(angle) * (pulseRadius - 3);
    const py = cy + Math.sin(angle) * (pulseRadius - 3);
    ctx.fillRect(px - 2.5, py - 2.5, 5, 5);

    const px2 = cx + Math.cos(angle + Math.PI) * 4;
    const py2 = cy + Math.sin(angle + Math.PI) * 4;
    ctx.fillRect(px2 - 1.5, py2 - 1.5, 3, 3);
  };

  // Interactive Terminal orthogonal renderer
  const drawInteractiveTerminal = (
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    label: string,
    color: string
  ) => {
    const wx = tx * TILE_SIZE;
    const wy = ty * TILE_SIZE;

    // Glowing base footprint
    ctx.fillStyle = color + "20";
    ctx.fillRect(wx + 2, wy + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Pedestal column
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(wx + 8, wy + 12, 16, 16);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(wx + 8, wy + 12, 16, 16);

    // Terminal Screen
    ctx.fillStyle = color;
    ctx.fillRect(wx + 10, wy + 6, 12, 6);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wx + 10, wy + 6, 12, 6);

    // Screen display detail
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(wx + 12, wy + 8, 8, 1);

    // Prompt if player is adjacent
    const dx = Math.abs(playerPos.x - tx);
    const dy = Math.abs(playerPos.y - ty);
    if (dx <= 1 && dy <= 1) {
      const cx = wx + TILE_SIZE / 2;
      const cy = wy - 10 + Math.sin(performance.now() / 150) * 2;

      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(cx - 30, cy - 8, 60, 14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 30, cy - 8, 60, 14);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("USAR [ESPAÇO]", cx, cy - 1);
    }
  };

  // Energy Gate orthogonal renderer
  const drawEnergyGate = (ctx: CanvasRenderingContext2D, tx: number, ty: number, color: string) => {
    const wx = tx * TILE_SIZE;
    const wy = ty * TILE_SIZE;

    // Pulse animation alpha
    const pulseAlpha = 0.25 + Math.sin(performance.now() / 120) * 0.12;
    ctx.fillStyle = color + Math.floor(pulseAlpha * 255).toString(16).padStart(2, "0");
    ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wx, wy + TILE_SIZE / 2);
    ctx.lineTo(wx + TILE_SIZE, wy + TILE_SIZE / 2);
    ctx.stroke();

    // Small lock icon inside the gate
    ctx.fillStyle = "#ffffff";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔒", wx + TILE_SIZE / 2, wy + TILE_SIZE / 2);
  };

  // 2D Pixel-art Character specifications matching the style of the attached image
  interface PixelCharData {
    skinColor: string;
    headColor: string;
    headType: string;
    torsoColor: string;
    torsoType: string;
    legsColor: string;
    shoesColor: string;
    faceType: string;
    accessoryType: string;
    hairColor?: string;
  }

  const getNPCPixelChar = (id: string): PixelCharData => {
    switch (id) {
      case "guide": // Frank, o Sacerdote do Templo
        return {
          skinColor: "#ffe4e6", // Pale elder priest skin
          headColor: "#1d4ed8", // Wizard blue hood
          headType: "beanie",   // Pointer hat style
          torsoColor: "#1e3a8a", // Deep blue robes
          torsoType: "suit",    // Custom magical collar
          legsColor: "#1e3a8a",
          shoesColor: "#1e293b",
          faceType: "beard",    // Elder white beard
          accessoryType: "cape", // Celestial cape
          hairColor: "#f8fafc", // White hair
        };
      case "keymaster": // Pixel, o Ferreiro de Raros
        return {
          skinColor: "#ffdbac",
          headColor: "#ea580c",
          headType: "horns",    // Elf pointed ears style
          torsoColor: "#166534", // Dwarven green smithing armor
          torsoType: "striped",
          legsColor: "#3f6212",
          shoesColor: "#78350f",
          faceType: "none",
          accessoryType: "sword", // Wielding blacksmith hammer / sword
          hairColor: "#f59e0b", // Elven golden-blonde hair
        };
      case "portmaster": // Capitão HC, Guardião do Porto
        return {
          skinColor: "#e0a96d",
          headColor: "#020617", // Navy officer hat
          headType: "beanie",
          torsoColor: "#0f172a", // Navy blue captain coat
          torsoType: "classic",
          legsColor: "#1e293b",
          shoesColor: "#020617",
          faceType: "beard",
          accessoryType: "backpack",
          hairColor: "#451a03",
        };
      case "scholar": // Alquimista de Soroban
        return {
          skinColor: "#fce7f3", // Pale magical pink skin
          headColor: "#ec4899", // Magical hair color
          headType: "square",
          torsoColor: "#6b21a8", // Alchemist violet gown
          torsoType: "striped",
          legsColor: "#4c1d95",
          shoesColor: "#1e1b4b",
          faceType: "glasses",  // Smart scholar glasses
          accessoryType: "none",
          hairColor: "#ec4899",
        };
      case "sage": // Bobba, o Sábio do Deserto
        return {
          skinColor: "#ca8a04", // Sun-tanned desert skin
          headColor: "#fbbf24", // Golden crown / pharaoh hat
          headType: "square",
          torsoColor: "#78350f", // Earthy desert brown garments
          torsoType: "suit",
          legsColor: "#ca8a04",
          shoesColor: "#451a03",
          faceType: "beard",    // Wise grey beard
          accessoryType: "none",
          hairColor: "#94a3b8",
        };
      default:
        return {
          skinColor: "#ffdbac",
          headColor: "#3b82f6",
          headType: "square",
          torsoColor: "#ef4444",
          torsoType: "classic",
          legsColor: "#3b82f6",
          shoesColor: "#1e293b",
          faceType: "none",
          accessoryType: "none",
        };
    }
  };

  const drawPixelCharacter = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    char: PixelCharData,
    isMoving: boolean,
    frame: number,
    direction: "down" | "up" | "left" | "right",
    showCrown: boolean = false
  ) => {
    ctx.save();

    // 1. Pixel shadow
    ctx.beginPath();
    ctx.ellipse(cx + 16, cy + 30, 9, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // Bobbing / swing offsets
    let walkBob = 0;
    let leftLegYOffset = 0;
    let rightLegYOffset = 0;
    let leftArmYOffset = 0;
    let rightArmYOffset = 0;

    if (isMoving) {
      walkBob = Math.sin(frame * Math.PI * 2) > 0 ? 1 : 0;
      const legSwing = Math.sin(frame * Math.PI * 2);
      leftLegYOffset = legSwing > 0 ? -1.5 : 0;
      rightLegYOffset = legSwing < 0 ? -1.5 : 0;
      leftArmYOffset = legSwing < 0 ? -0.5 : 0.5;
      rightArmYOffset = legSwing > 0 ? -0.5 : 0.5;
    }

    const drawPixelRect = (rx: number, ry: number, rw: number, rh: number, fill: string, stroke: string = "#000000") => {
      ctx.fillStyle = fill;
      ctx.fillRect(rx, ry, rw, rh);
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(rx, ry, rw, rh);
      }
    };

    // Back accessories (Cape or Backpack) if not facing up
    if (direction !== "up") {
      if (char.accessoryType === "cape") {
        drawPixelRect(cx + 6, cy + 13 + walkBob, 20, 11, char.headColor);
      } else if (char.accessoryType === "backpack") {
        drawPixelRect(cx + 8, cy + 12 + walkBob, 16, 9, "#78350f");
      }
    }

    // 2. Legs & Shoes (with outlines)
    // Left leg
    drawPixelRect(cx + 8, cy + 22 + leftLegYOffset, 4, 6, char.legsColor || "#3b82f6");
    drawPixelRect(cx + 6, cy + 27 + leftLegYOffset, 6, 3, char.shoesColor || "#1e293b");

    // Right leg
    drawPixelRect(cx + 20, cy + 22 + rightLegYOffset, 4, 6, char.legsColor || "#3b82f6");
    drawPixelRect(cx + 20, cy + 27 + rightLegYOffset, 6, 3, char.shoesColor || "#1e293b");

    // 3. Torso / Arms
    // Left Arm
    const leftArmX = cx + 4;
    const leftArmY = cy + 12 + walkBob + leftArmYOffset;
    drawPixelRect(leftArmX, leftArmY, 4, 7, char.torsoColor || "#ef4444");
    drawPixelRect(leftArmX, leftArmY + 7, 4, 3, char.skinColor || "#ffdbac");

    // Torso Main
    const torsoY = cy + 12 + walkBob;
    drawPixelRect(cx + 8, torsoY, 16, 10, char.torsoColor || "#ef4444");

    // Torso texture details
    if (char.torsoType === "striped") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(cx + 9, torsoY + 2, 14, 2);
      ctx.fillRect(cx + 9, torsoY + 6, 14, 2);
    } else if (char.torsoType === "suit") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx + 15, torsoY, 2, 3);
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(cx + 15, torsoY + 3, 2, 4);
    } else if (char.torsoType === "hoodie") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(cx + 11, torsoY + 5, 10, 4);
    }

    // Right Arm (Weapon holding / Regular)
    const rightArmX = cx + 24;
    const rightArmY = cy + 12 + walkBob + rightArmYOffset;

    if (char.accessoryType === "sword" && direction !== "up") {
      // Raised sword pose!
      drawPixelRect(rightArmX, rightArmY - 4, 4, 7, char.torsoColor || "#ef4444");
      drawPixelRect(rightArmX, rightArmY - 7, 4, 3, char.skinColor || "#ffdbac");
      
      // Sword details
      drawPixelRect(rightArmX - 4, rightArmY - 10, 12, 2, "#d97706"); // Guard
      drawPixelRect(rightArmX, rightArmY - 24, 4, 14, "#f1f5f9", "#475569"); // Blade
      drawPixelRect(rightArmX + 1, rightArmY - 6, 2, 4, "#78350f"); // Handle
    } else {
      drawPixelRect(rightArmX, rightArmY, 4, 7, char.torsoColor || "#ef4444");
      drawPixelRect(rightArmX, rightArmY + 7, 4, 3, char.skinColor || "#ffdbac");
    }

    // 4. Head & Face
    const headY = cy + 2 + walkBob;
    drawPixelRect(cx + 8, headY, 16, 11, char.skinColor || "#ffdbac");

    // Hats and Hair
    if (char.headType === "square") {
      const hairCol = char.hairColor || char.headColor || "#78350f";
      drawPixelRect(cx + 7, headY - 3, 18, 4, hairCol); // Hair top
      drawPixelRect(cx + 7, headY + 1, 3, 6, hairCol);   // Left side
      drawPixelRect(cx + 22, headY + 1, 3, 6, hairCol);  // Right side
    } else if (char.headType === "beanie") {
      if (char.headColor === "#1d4ed8") {
        // High pointy magical wizard hat!
        ctx.fillStyle = char.headColor;
        ctx.beginPath();
        ctx.moveTo(cx + 5, headY + 1);
        ctx.lineTo(cx + 16, headY - 8);
        ctx.lineTo(cx + 27, headY + 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
        // Star on tip
        drawPixelRect(cx + 14, headY - 11, 4, 3, "#fbbf24");
      } else {
        const capCol = char.headColor || "#dc2626";
        drawPixelRect(cx + 7, headY - 4, 18, 5, capCol);
        drawPixelRect(cx + 14, headY - 7, 4, 3, "#ffffff"); // Pom-pom
      }
    } else if (char.headType === "helmet") {
      const helmCol = char.headColor || "#64748b";
      drawPixelRect(cx + 7, headY - 3, 18, 14, helmCol);
      drawPixelRect(cx + 10, headY + 3, 12, 3, "#38bdf8", "#0f172a"); // Visor glow
      drawPixelRect(cx + 14, headY - 6, 4, 3, "#dc2626"); // Plume
    } else if (char.headType === "horns") {
      const hairCol = char.hairColor || "#78350f";
      drawPixelRect(cx + 7, headY - 2, 18, 3, hairCol);
      if (char.skinColor === "#ffdbac" && char.hairColor === "#f59e0b") {
        // Pointed Elven Ears!
        drawPixelRect(cx + 4, headY + 2, 4, 2, char.skinColor);
        drawPixelRect(cx + 24, headY + 2, 4, 2, char.skinColor);
      } else {
        // Devil horns
        drawPixelRect(cx + 5, headY - 4, 3, 4, char.headColor || "#dc2626");
        drawPixelRect(cx + 24, headY - 4, 3, 4, char.headColor || "#dc2626");
      }
    }

    // Face details if not helmet
    if (char.headType !== "helmet" && direction !== "up") {
      let pupilShiftX = 0;
      if (direction === "left") pupilShiftX = -1;
      else if (direction === "right") pupilShiftX = 1;

      // Left eye
      drawPixelRect(cx + 10, headY + 3, 3, 3, "#ffffff", "");
      drawPixelRect(cx + 11 + pupilShiftX, headY + 4, 1.5, 1.5, "#000000", "");

      // Right eye
      drawPixelRect(cx + 18, headY + 3, 3, 3, "#ffffff", "");
      drawPixelRect(cx + 18.5 + pupilShiftX, headY + 4, 1.5, 1.5, "#000000", "");

      // Custom face traits
      if (char.faceType === "glasses") {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx + 9, headY + 2.5, 5, 4);
        ctx.strokeRect(cx + 17, headY + 2.5, 5, 4);
        ctx.beginPath();
        ctx.moveTo(cx + 14, headY + 4.5);
        ctx.lineTo(cx + 17, headY + 4.5);
        ctx.stroke();
      } else if (char.faceType === "beard") {
        const beardCol = char.hairColor || "#78350f";
        drawPixelRect(cx + 8, headY + 7, 16, 4, beardCol);
        ctx.fillStyle = char.skinColor;
        ctx.fillRect(cx + 14, headY + 8, 4, 1.5); // Mouth cutout
      } else if (char.faceType === "eyepatch") {
        drawPixelRect(cx + 10, headY + 2.5, 3.5, 3.5, "#111111", "");
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 8, headY + 1.5);
        ctx.lineTo(cx + 23, headY + 5.5);
        ctx.stroke();
      } else if (char.faceType === "smile") {
        ctx.fillStyle = "rgba(244, 63, 94, 0.5)";
        ctx.fillRect(cx + 9, headY + 6, 2, 1.5);
        ctx.fillRect(cx + 20, headY + 6, 2, 1.5);
        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 13, headY + 7.5);
        ctx.lineTo(cx + 15, headY + 9);
        ctx.lineTo(cx + 17, headY + 7.5);
        ctx.stroke();
      } else {
        // Simple pixel mouth
        ctx.fillStyle = "#854d0e";
        ctx.fillRect(cx + 15, headY + 8, 2, 1);
      }
    }

    // Back accessories if facing up
    if (direction === "up") {
      if (char.accessoryType === "cape") {
        drawPixelRect(cx + 6, cy + 13 + walkBob, 20, 11, char.headColor);
      } else if (char.accessoryType === "backpack") {
        drawPixelRect(cx + 8, cy + 12 + walkBob, 16, 9, "#78350f");
      }
    }

    // Crown floating on top
    if (showCrown) {
      const crownY = headY - 11 + Math.sin(performance.now() / 200) * 1.5;
      drawPixelRect(cx + 9, crownY, 14, 5, "#eab308");
      ctx.fillStyle = "#facc15";
      ctx.fillRect(cx + 9, crownY - 2, 2, 2);
      ctx.fillRect(cx + 15, crownY - 2, 2, 2);
      ctx.fillRect(cx + 21, crownY - 2, 2, 2);
    }

    ctx.restore();
  };

  // Rendering engine
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const playerPosVal = latestPlayerPos.current;
    const currentRegion = getCoordinateRegion(playerPosVal.x, playerPosVal.y);
    const dims = latestDimensions.current;
    const calculatedWaveOffset = Math.floor(performance.now() / 250) % 16;

    // Dynamic zoom level: 3.5 for desktop (close-up retro zoom), 2.2 for mobile (looks perfect/roomy)
    const currentZoomLevel = dims.width < 768 ? 2.2 : 3.5;

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
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = mapGrid[r][c];
        const worldX = c * TILE_SIZE;
        const worldY = r * TILE_SIZE;

        if (
          worldX < leftBound ||
          worldX > rightBound ||
          worldY < topBound ||
          worldY > bottomBound
        ) {
          continue;
        }

        if (getTileRegion(c, r) !== currentRegion) {
          continue;
        }

        switch (tile) {
          case TileType.WATER:
            ctx.fillStyle = "#0f1c30"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            
            ctx.fillStyle = "#1e2d42";
            const rippleX = (c * 17 + r * 13 + calculatedWaveOffset) % TILE_SIZE;
            ctx.fillRect(worldX + rippleX, worldY + ((r * 7) % TILE_SIZE), 6, 1.5);
            ctx.fillStyle = "#152438";
            ctx.fillRect(worldX + (TILE_SIZE - rippleX), worldY + ((c * 11) % TILE_SIZE), 4, 1);
            break;

          case TileType.GRASS:
            ctx.fillStyle = "#166534"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            
            // Detailed grass tufts (like reference)
            ctx.fillStyle = "#14532d";
            const grassShift = (c * 13 + r * 17) % 12;
            ctx.fillRect(worldX + 4 + grassShift, worldY + 8, 1.5, 4);
            ctx.fillRect(worldX + 5 + grassShift, worldY + 10, 1.5, 2);
            ctx.fillRect(worldX + 18 - grassShift, worldY + 20, 1.5, 4);
            
            // Red and gold pixel flowers
            if ((c * 7 + r * 13) % 19 === 0) {
              ctx.fillStyle = "#facc15";
              ctx.fillRect(worldX + 12, worldY + 12, 2, 2);
              ctx.fillStyle = "#ef4444";
              ctx.fillRect(worldX + 10, worldY + 12, 2, 2);
              ctx.fillRect(worldX + 14, worldY + 12, 2, 2);
            } else if ((c * 3 + r * 19) % 23 === 0) {
              ctx.fillStyle = "#fef08a";
              ctx.fillRect(worldX + 8, worldY + 16, 2, 2);
              ctx.fillRect(worldX + 12, worldY + 18, 1.5, 1.5);
            }
            break;

          case TileType.SAND:
            ctx.fillStyle = "#fef08a";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#facc15";
            if ((c * 11 + r * 7) % 15 === 0) {
              ctx.fillRect(worldX + 10, worldY + 10, 1.5, 1.5);
              ctx.fillRect(worldX + 22, worldY + 18, 1.5, 1.5);
            }
            break;

          case TileType.HEDGE:
            // Trimmed thick green square hedges with outline and highlights
            ctx.fillStyle = "#15803d";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#14532d"; 
            ctx.fillRect(worldX, worldY + TILE_SIZE - 4, TILE_SIZE, 4);
            ctx.fillRect(worldX + TILE_SIZE - 4, worldY, 4, TILE_SIZE);
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(worldX + 4, worldY + 3, 3, 3);
            ctx.fillRect(worldX + 16, worldY + 4, 3, 3);
            ctx.fillRect(worldX + 10, worldY + 12, 2, 2);
            break;

          case TileType.STONE_PATH:
            // Soft slate-200 base with elegant dark joint lines
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(worldX, worldY, TILE_SIZE, 1.5);
            ctx.fillRect(worldX, worldY, 1.5, TILE_SIZE);
            ctx.fillRect(worldX + TILE_SIZE / 2, worldY, 1.5, TILE_SIZE);
            ctx.fillRect(worldX, worldY + TILE_SIZE / 2, TILE_SIZE, 1.5);
            
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(worldX + 2, worldY + 2, TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 4);
            ctx.fillRect(worldX + TILE_SIZE / 2 + 2, worldY + 2, TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 4);
            ctx.fillRect(worldX + 2, worldY + TILE_SIZE / 2 + 2, TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 4);
            ctx.fillRect(worldX + TILE_SIZE / 2 + 2, worldY + TILE_SIZE / 2 + 2, TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 4);
            break;

          case TileType.BRIDGE:
            ctx.fillStyle = "#7c2d12"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#451a03";
            ctx.fillRect(worldX, worldY + 4, TILE_SIZE, 1.5);
            ctx.fillRect(worldX, worldY + 12, TILE_SIZE, 1.5);
            ctx.fillRect(worldX, worldY + 20, TILE_SIZE, 1.5);
            ctx.fillRect(worldX, worldY + 28, TILE_SIZE, 1.5);
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(worldX + 2, worldY + 6, 1.5, 1.5);
            ctx.fillRect(worldX + TILE_SIZE - 3.5, worldY + 6, 1.5, 1.5);
            break;

          case TileType.FLOOR_DARK:
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            if ((c + r) % 5 === 0) {
              ctx.fillStyle = "#1e293b";
              ctx.fillRect(worldX + 10, worldY + 10, 12, 12);
            }
            break;

          case TileType.TEMPLE_FLOOR:
            ctx.fillStyle = "#020617"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#ca8a04";
            ctx.lineWidth = 1;
            ctx.strokeRect(worldX + 3, worldY + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            break;

          case TileType.WALL:
            ctx.fillStyle = "#1e293b"; 
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(worldX, worldY + 10, TILE_SIZE, 1.5);
            ctx.fillRect(worldX, worldY + 20, TILE_SIZE, 1.5);
            ctx.fillRect(worldX + 12, worldY, 1.5, 10);
            ctx.fillRect(worldX + 22, worldY + 10, 1.5, 10);
            ctx.fillStyle = "#334155";
            ctx.fillRect(worldX, worldY, TILE_SIZE, 2);
            break;

          // Portal types
          case TileType.PORTAL_EAST:
            ctx.fillStyle = "#082f49";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            drawPortalVortex(ctx, worldX, worldY, "#22d3ee");
            break;

          case TileType.PORTAL_WEST:
            ctx.fillStyle = "#2e1065";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            drawPortalVortex(ctx, worldX, worldY, "#a78bfa");
            break;

          case TileType.PORTAL_NORTH:
            ctx.fillStyle = "#064e3b";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            drawPortalVortex(ctx, worldX, worldY, "#34d399");
            break;

          case TileType.PORTAL_SOUTH:
            ctx.fillStyle = "#451a03";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            drawPortalVortex(ctx, worldX, worldY, "#fbbf24");
            break;

          case TileType.PORTAL_CENTER:
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            drawPortalVortex(ctx, worldX, worldY, "#ffffff");
            break;
        }
      }
    }

    // 2. Render Bridges Gate Barriers (Lock indications)
    if (currentRegion === "center") {
      if (gameState.quests.wallet.status !== "completed") {
        drawEnergyGate(ctx, 29, 17, "#22d3ee");
        drawEnergyGate(ctx, 30, 17, "#22d3ee");
      }
      if (gameState.quests.onramp.status !== "completed" && gameState.quests.wallet.status === "completed") {
        drawEnergyGate(ctx, 17, 29, "#34d399");
        drawEnergyGate(ctx, 17, 30, "#34d399");
      }
      if (gameState.quests.soroban.status !== "completed" && gameState.quests.onramp.status === "completed") {
        drawEnergyGate(ctx, 29, 43, "#a78bfa");
        drawEnergyGate(ctx, 30, 43, "#a78bfa");
      }
    }

    // 3. Render Special Terminals
    if (currentRegion === "east") {
      drawInteractiveTerminal(ctx, 54, 30, "FORJA CHAVE", "#22d3ee");
    } else if (currentRegion === "north") {
      drawInteractiveTerminal(ctx, 30, 6, "ON RAMP PORT", "#34d399");
    } else if (currentRegion === "west") {
      drawInteractiveTerminal(ctx, 6, 30, "SOROBAN SWAP", "#a78bfa");
    } else if (currentRegion === "south") {
      drawInteractiveTerminal(ctx, 30, 54, "GOLD ESCROW", "#fbbf24");
    }

    // 4. Render Decorative Objects
    MAP_DECORATIONS.forEach((dec) => {
      if (getCoordinateRegion(dec.x, dec.y) !== currentRegion) {
        return;
      }

      const worldX = dec.x * TILE_SIZE;
      const worldY = dec.y * TILE_SIZE;

      if (
        worldX < leftBound ||
        worldX > rightBound ||
        worldY < topBound ||
        worldY > bottomBound
      ) {
        return;
      }

      switch (dec.type) {
        case "statue":
          ctx.fillStyle = "#334155";
          ctx.fillRect(worldX + 4, worldY + 22, 24, 10);
          ctx.fillStyle = "#475569";
          ctx.fillRect(worldX + 6, worldY + 14, 20, 8);
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.moveTo(worldX + 16, worldY + 2);
          ctx.lineTo(worldX + 23, worldY + 11);
          ctx.lineTo(worldX + 16, worldY + 8);
          ctx.lineTo(worldX + 9, worldY + 11);
          ctx.closePath();
          ctx.fill();
          break;

        case "tree":
          // Tree shadow
          ctx.beginPath();
          ctx.ellipse(worldX + 16, worldY + 28, 11, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
          ctx.fill();
          // Trunk
          ctx.fillStyle = "#78350f";
          ctx.fillRect(worldX + 13, worldY + 16, 6, 12);
          ctx.fillStyle = "#451a03";
          ctx.fillRect(worldX + 13, worldY + 24, 6, 4);
          // Leaves (Bulky green levels)
          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.arc(worldX + 16, worldY + 10, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#166534";
          ctx.beginPath();
          ctx.arc(worldX + 16, worldY + 12, 11, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.arc(worldX + 12, worldY + 6, 8, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "lamp":
          ctx.beginPath();
          ctx.ellipse(worldX + 16, worldY + 30, 4, 1.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.fill();
          ctx.fillStyle = "#334155";
          ctx.fillRect(worldX + 15, worldY + 10, 2, 20);
          ctx.fillStyle = "#475569";
          ctx.fillRect(worldX + 14, worldY + 28, 4, 2);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(worldX + 12, worldY + 4, 8, 6);
          ctx.fillStyle = "#fef08a";
          ctx.fillRect(worldX + 14, worldY + 5, 4, 4);
          
          // Radial glow
          const pulseGlow = 13 + Math.sin(performance.now() / 250) * 2.5;
          const gradient = ctx.createRadialGradient(worldX + 16, worldY + 7, 2, worldX + 16, worldY + 7, pulseGlow);
          gradient.addColorStop(0, "rgba(254, 240, 138, 0.35)");
          gradient.addColorStop(1, "rgba(254, 240, 138, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(worldX + 16, worldY + 7, pulseGlow, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "bench":
          ctx.fillStyle = "#b45309";
          ctx.fillRect(worldX + 4, worldY + 12, 24, 6);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(worldX + 5, worldY + 18, 2, 10);
          ctx.fillRect(worldX + 25, worldY + 18, 2, 10);
          ctx.fillStyle = "#d97706";
          ctx.fillRect(worldX + 2, worldY + 20, 28, 5);
          break;

        case "barrel":
          ctx.fillStyle = "#78350f";
          ctx.fillRect(worldX + 8, worldY + 12, 16, 18);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(worldX + 8, worldY + 16, 16, 1.5);
          ctx.fillRect(worldX + 8, worldY + 24, 16, 1.5);
          break;

        case "box":
          ctx.fillStyle = "#b45309";
          ctx.fillRect(worldX + 6, worldY + 10, 20, 20);
          ctx.strokeStyle = "#7c2d12";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(worldX + 8, worldY + 12, 16, 16);
          break;
      }
    });

    // 5. Render Passive Slime Blobs
    creaturesRef.current.forEach((slime) => {
      if (getCoordinateRegion(slime.x, slime.y) !== currentRegion) {
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

    // 6. Render NPCs using the pixel character engine
    const npcsVal = latestNpcs.current;
    const gameStateVal = latestGameState.current;

    npcsVal.forEach((npc) => {
      if (getCoordinateRegion(npc.x, npc.y) !== currentRegion) {
        return;
      }

      const worldX = npc.x * TILE_SIZE;
      const worldY = npc.y * TILE_SIZE;

      if (
        worldX < leftBound ||
        worldX > rightBound ||
        worldY < topBound ||
        worldY > bottomBound
      ) {
        return;
      }

      // Draw custom pixel sprite based on NPC's role/lore
      const charData = getNPCPixelChar(npc.id);
      drawPixelCharacter(
        ctx,
        worldX,
        worldY,
        charData,
        false, // NPCs don't walk
        0,
        npc.dir,
        false
      );

      // Quest indicators (Floating "!" or "🔒" above NPC)
      let indicator = "";
      let indicatorColor = "#ef4444";
      if (npc.questTrigger) {
        const qStatus = gameStateVal.quests[npc.questTrigger].status;
        if (qStatus === "active") {
          indicator = "!";
          indicatorColor = "#fbbf24";
        } else if (qStatus === "locked") {
          indicator = "🔒";
        }
      }
      
      if (indicator) {
        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.arc(worldX + 16, worldY - 14, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(indicator, worldX + 16, worldY - 13.5);
      }

      // Display NPC name tags beautifully with proper head clearance
      const npcNameY = worldY - 19;
      const npcNameW = 52;
      const npcNameH = 9;
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(worldX + 16 - npcNameW / 2, npcNameY, npcNameW, npcNameH);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(worldX + 16 - npcNameW / 2, npcNameY, npcNameW, npcNameH);

      ctx.font = "bold 6.5px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(npc.name, worldX + 16, npcNameY + npcNameH / 2 + 0.5);
    });

    // 7. Render Player using the pixel character engine
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
      isLegend
    );

    // Display Player name tag in yellow over their head (Tibia style) with proper head clearance
    const playerNameY = playerScreenY - 19;
    const playerNameW = 52;
    const playerNameH = 9;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(playerScreenX + 16 - playerNameW / 2, playerNameY, playerNameW, playerNameH);
    ctx.strokeStyle = "rgba(255, 198, 0, 0.6)"; // High contrast yellow border
    ctx.lineWidth = 0.5;
    ctx.strokeRect(playerScreenX + 16 - playerNameW / 2, playerNameY, playerNameW, playerNameH);

    ctx.font = "bold 6.5px monospace";
    ctx.fillStyle = "#ffc600"; // Vibrant yellow
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(playerPosVal.name || "Viajante", playerScreenX + 16, playerNameY + playerNameH / 2 + 0.5);

    ctx.restore();

    // 8. Fullscreen Portal Flash Screen Overlay
    if (teleportFlashRef.current > 0) {
      ctx.fillStyle = `rgba(34, 211, 238, ${teleportFlashRef.current})`;
      ctx.fillRect(0, 0, dims.width, dims.height);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 14px 'Silkscreen', 'Press Start 2P', monospace";
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
        onClick={triggerInteraction}
      />

      {/* TOP-LEFT CORNER HUD: COORDINATES & MAP LOCATION */}
      <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 rounded-lg p-2 flex flex-col gap-0.5 shadow-md select-none pointer-events-none font-mono">
        <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold">
          <Compass className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
          <span>Praça Central</span>
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
