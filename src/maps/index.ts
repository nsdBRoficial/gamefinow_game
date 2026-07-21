/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateCentralMap, CENTRAL_DECORATIONS } from "./centralMap";
import { generateWalletForgeMap, FORGE_DECORATIONS } from "./eastMap";
import { generateAnchorPortMap, PORT_DECORATIONS } from "./northMap";
import { generateSorobanSwapMap, BAZAAR_DECORATIONS } from "./westMap";
import { generateHolderSanctuaryMap, SANCTUARY_DECORATIONS } from "./southMap";
import { Quest } from "../types";

export type MapId = "center" | "east" | "west" | "north" | "south";

export function isGateBlocked(mapId: string, c: number, r: number, quests: Record<string, Quest>): { blocked: boolean; message: string } {
  return { blocked: false, message: "" };
}

const mapGrids: Record<MapId, number[][]> = {
  center: generateCentralMap(),
  east: generateWalletForgeMap(),
  north: generateAnchorPortMap(),
  west: generateSorobanSwapMap(),
  south: generateHolderSanctuaryMap(),
};

const mapDecorations: Record<MapId, any[]> = {
  center: CENTRAL_DECORATIONS,
  east: FORGE_DECORATIONS,
  north: PORT_DECORATIONS,
  west: BAZAAR_DECORATIONS,
  south: SANCTUARY_DECORATIONS,
};

export function getMapGrid(mapId: MapId): number[][] {
  return mapGrids[mapId] || mapGrids.center;
}

export function getMapDecorations(mapId: MapId): any[] {
  return mapDecorations[mapId] || mapDecorations.center;
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

