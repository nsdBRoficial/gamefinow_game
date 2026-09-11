/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateCentralMap, CENTRAL_DECORATIONS } from "./centralMap";
import { generateWalletForgeMap, FORGE_DECORATIONS } from "./eastMap";
import { generateAnchorPortMap, PORT_DECORATIONS } from "./northMap";
import { generateSorobanSwapMap, BAZAAR_DECORATIONS } from "./westMap";
import { generateHolderSanctuaryMap, SANCTUARY_DECORATIONS } from "./southMap";
import { generateGuildHouseMap, GUILDHOUSE_DECORATIONS } from "./guildHouseMap";
import { generateAmphitheaterMap, AMPHITHEATER_DECORATIONS } from "./amphitheaterMap";
import { Quest } from "../types";

export type MapId = "center" | "east" | "west" | "north" | "south" | "guildhouse" | "amphitheater" | "arena";

export function isGateBlocked(mapId: string, c: number, r: number, quests: Record<string, Quest>): { blocked: boolean; message: string } {
  return { blocked: false, message: "" };
}

const mapGrids: Record<MapId, number[][]> = {
  center: generateCentralMap(),
  east: generateWalletForgeMap(),
  north: generateAnchorPortMap(),
  west: generateSorobanSwapMap(),
  south: generateHolderSanctuaryMap(),
  guildhouse: generateGuildHouseMap(),
  amphitheater: generateAmphitheaterMap(),
  arena: [[]],
};

const mapDecorations: Record<MapId, any[]> = {
  center: [
    ...CENTRAL_DECORATIONS,
    // 5 Jazidas periféricas espalhadas no mapa Central
    { x: 4, y: 6, type: "mine", mineRarity: "common" },
    { x: 54, y: 5, type: "mine", mineRarity: "uncommon" },
    { x: 56, y: 52, type: "mine", mineRarity: "common" },
    { x: 5, y: 53, type: "mine", mineRarity: "uncommon" },
    { x: 30, y: 4, type: "mine", mineRarity: "rare" },
  ],
  east: [
    ...FORGE_DECORATIONS,
    // 5 Jazidas periféricas no mapa Leste (cavernas)
    { x: 6, y: 4, type: "mine", mineRarity: "rare" },
    { x: 54, y: 6, type: "mine", mineRarity: "epic" },
    { x: 56, y: 50, type: "mine", mineRarity: "rare" },
    { x: 5, y: 52, type: "mine", mineRarity: "uncommon" },
    { x: 50, y: 28, type: "mine", mineRarity: "epic" },
  ],
  north: [
    ...PORT_DECORATIONS,
    // 5 Jazidas periféricas no mapa Norte (porto)
    { x: 4, y: 4, type: "mine", mineRarity: "uncommon" },
    { x: 54, y: 4, type: "mine", mineRarity: "rare" },
    { x: 56, y: 48, type: "mine", mineRarity: "uncommon" },
    { x: 4, y: 50, type: "mine", mineRarity: "common" },
    { x: 30, y: 56, type: "mine", mineRarity: "rare" },
  ],
  west: [
    ...BAZAAR_DECORATIONS,
    // 5 Jazidas periféricas no mapa Oeste (bazar)
    { x: 5, y: 4, type: "mine", mineRarity: "rare" },
    { x: 53, y: 5, type: "mine", mineRarity: "uncommon" },
    { x: 55, y: 52, type: "mine", mineRarity: "common" },
    { x: 4, y: 54, type: "mine", mineRarity: "rare" },
    { x: 3, y: 28, type: "mine", mineRarity: "epic" },
  ],
  south: [
    ...SANCTUARY_DECORATIONS,
    // 5 Jazidas periféricas no mapa Sul (santuário)
    { x: 4, y: 5, type: "mine", mineRarity: "uncommon" },
    { x: 53, y: 4, type: "mine", mineRarity: "epic" },
    { x: 55, y: 50, type: "mine", mineRarity: "rare" },
    { x: 5, y: 52, type: "mine", mineRarity: "common" },
    { x: 30, y: 55, type: "mine", mineRarity: "epic" },
  ],
  guildhouse: [
    ...GUILDHOUSE_DECORATIONS,
  ],
  amphitheater: [
    ...AMPHITHEATER_DECORATIONS,
  ],
  arena: [],
};


export function getMapGrid(mapId: MapId): number[][] {
  return mapGrids[mapId] || mapGrids.center;
}

export function getMapDecorations(mapId: MapId): any[] {
  return mapDecorations[mapId] || mapDecorations.center;
}

import { isCollidable } from "../gameData";

export function relocateMine(mapId: MapId, oldX: number, oldY: number) {
  const decs = mapDecorations[mapId];
  if (!decs) return;
  const mineIndex = decs.findIndex(d => d.type === "mine" && d.x === oldX && d.y === oldY);
  
  if (mineIndex > -1) {
    const grid = getMapGrid(mapId);
    let newX, newY;
    let attempts = 0;
    
    do {
      newX = Math.floor(Math.random() * 56) + 2; // 2 to 57
      newY = Math.floor(Math.random() * 56) + 2;
      attempts++;
    } while (
      attempts < 100 && 
      (Math.abs(newX - 30) < 18 && Math.abs(newY - 30) < 18) || // Not in center
      isCollidable(grid[newY][newX]) // Not on a wall
    );
    
    decs[mineIndex].x = newX;
    decs[mineIndex].y = newY;
  }
}

import { NPC } from "../types";
import { INITIAL_NPCS } from "../gameData";

export function getNpcsForMap(mapId: MapId): NPC[] {
  if (mapId === "center") {
    const guide = INITIAL_NPCS.find(n => n.id === "guide");
    const npcs = [];
    if (guide) {
      npcs.push({
        ...guide,
        x: 27,
        y: 28,
        dir: "down"
      });
    }
    return npcs;
  } else if (mapId === "east") {
    const keymaster = INITIAL_NPCS.find(n => n.id === "keymaster");
    if (keymaster) {
      return [{
        ...keymaster,
        x: 30,
        y: 27,
        dir: "down"
      }];
    }
  } else if (mapId === "north") {
    const portmaster = INITIAL_NPCS.find(n => n.id === "portmaster");
    if (portmaster) {
      return [{
        ...portmaster,
        x: 31,
        y: 34,
        dir: "down"
      }];
    }
  } else if (mapId === "west") {
    const scholar = INITIAL_NPCS.find(n => n.id === "scholar");
    if (scholar) {
      return [{
        ...scholar,
        x: 42,
        y: 28,
        dir: "down"
      }];
    }
  } else if (mapId === "south") {
    const sage = INITIAL_NPCS.find(n => n.id === "sage");
    if (sage) {
      return [{
        ...sage,
        x: 27,
        y: 14,
        dir: "down"
      }];
    }
  }
  return [];
}

