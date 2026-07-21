/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GRID_COLS, GRID_ROWS } from "../gameData";
import { GameDecoration } from "../gameData";

export function generateHolderSanctuaryMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.GRASS;

      // Outer water streams
      if (r >= GRID_ROWS - 3 || c <= 2 || c >= GRID_COLS - 3 || (r <= 2 && !(c === 29 || c === 30))) {
        tile = TileType.WATER;
      }

      // Border walls (trees)
      if (r === GRID_ROWS - 4 || c === 3 || c === GRID_COLS - 4 || (r === 3 && !(c === 29 || c === 30))) {
        tile = TileType.WALL;
      }

      // Agro Corn Plantations (Plantações de Milho)
      if (
        ((c >= 6 && c <= 24) || (c >= 36 && c <= 54)) &&
        ((r >= 6 && r <= 24) || (r >= 36 && r <= 54))
      ) {
        if (c % 2 === 0) { // Rows of crops
          tile = TileType.CROPS;
        } else {
          tile = TileType.SAND; // Dirt between rows
        }
      }

      // Farm Fences ao redor das plantações
      if (
        (c === 4 || c === 26 || c === 34 || c === 56) && (r >= 4 && r <= 26 || r >= 34 && r <= 56) ||
        (r === 4 || r === 26 || r === 34 || r === 56) && (c >= 4 && c <= 26 || c >= 34 && c <= 56)
      ) {
        // Leave openings nas cercas para passagem
        if (!(c === 15 || r === 15 || c === 45 || r === 45)) {
          tile = TileType.FENCE;
        }
      }

      // Main Pathways (Estradas de terra)
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        tile = TileType.SAND;
      }
      if (c === 28 || c === 31 || r === 28 || r === 31) {
        tile = TileType.SAND;
      }

      // Center area (Silo / Celeiro area)
      if (c >= 25 && c <= 35 && r >= 25 && r <= 35) {
        tile = TileType.SAND; // Changed from TEMPLE_FLOOR to continue the dirt path
      }

      // Farm building / Barn (Celeiro gigante no canto inferior esquerdo)
      if (c >= 6 && c <= 16 && r >= 44 && r <= 54) {
        if (r === 54 || c === 6 || c === 16 || r === 44) {
          tile = TileType.BLOCK; // Barn walls
        } else {
          tile = TileType.FLOOR_DARK; // Inside barn
        }
      }

      // Bridge for the portal on the North
      if (r === 1 || r === 2) {
        if (c === 29 || c === 30) {
          tile = TileType.BRIDGE;
        }
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // North Return Portal to center
  grid[1][29] = TileType.PORTAL_CENTER;
  grid[1][30] = TileType.PORTAL_CENTER;

  // Escrow Hold pedestal (Central mission point)
  grid[24][33] = TileType.BLOCK;

  // Barn door opening
  grid[54][10] = TileType.FLOOR_DARK;
  grid[54][11] = TileType.FLOOR_DARK;
  grid[54][12] = TileType.FLOOR_DARK;

  return grid;
}

export const SANCTUARY_DECORATIONS: GameDecoration[] = [
  // Farm lamps
  { x: 26, y: 26, type: "lamp" },
  { x: 34, y: 26, type: "lamp" },
  { x: 26, y: 34, type: "lamp" },
  { x: 34, y: 34, type: "lamp" },

  // Caixas (Boxes) simulando sacos de sementes e colheita
  { x: 24, y: 15, type: "box" },
  { x: 36, y: 15, type: "box" },
  { x: 25, y: 15, type: "box" },
  { x: 37, y: 15, type: "box" },
  
  // Dentro e perto do celeiro
  { x: 10, y: 50, type: "barrel" },
  { x: 12, y: 50, type: "barrel" },
  { x: 11, y: 51, type: "box" },
  { x: 8, y: 52, type: "barrel" },
  { x: 14, y: 52, type: "box" },

  // Mais algumas coisas na praça central (Centro de distribuição agro)
  { x: 27, y: 28, type: "box" },
  { x: 28, y: 28, type: "barrel" },
  { x: 27, y: 29, type: "box" },
  { x: 32, y: 32, type: "barrel" },
  { x: 33, y: 32, type: "box" },
  { x: 33, y: 33, type: "barrel" },

  // Benches and flower pots na praça central
  { x: 25, y: 26, type: "flower_pot" },
  { x: 35, y: 26, type: "flower_pot" },
  { x: 25, y: 34, type: "bench" },
  { x: 35, y: 34, type: "bench" },

  // Farm tools area (norte)
  { x: 29, y: 22, type: "barrel" },
  { x: 31, y: 22, type: "box" },
];
