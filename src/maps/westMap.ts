/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GRID_COLS, GRID_ROWS } from "../gameData";
import { GameDecoration } from "../gameData";

export function generateSorobanSwapMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.FLOOR_DARK;

      // Outer Water Moats
      if (r <= 2 || r >= GRID_ROWS - 3 || c <= 2 || (c >= GRID_COLS - 3 && !(r === 29 || r === 30))) {
        tile = TileType.WATER;
      }

      // Boundary Walls
      if (r === 3 || r === GRID_ROWS - 4 || c === 3 || (c === GRID_COLS - 4 && !(r === 29 || r === 30))) {
        tile = TileType.WALL;
      }

      // Elegant internal water canals crossed by wooden bridges
      if ((r === 18 || r === 42) && c >= 4 && c <= 55) {
        if (c === 29 || c === 30 || c === 15 || c === 45) {
          tile = TileType.BRIDGE;
        } else {
          tile = TileType.WATER;
        }
      }

      // Market garden patches
      if (r >= 22 && r <= 38 && ((c >= 6 && c <= 12) || (c >= 48 && c <= 54))) {
        tile = TileType.GRASS;
      }

      // Pathways
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        tile = TileType.STONE_PATH;
      }

      // Bridge for the portal on the East
      if (c === GRID_COLS - 2 || c === GRID_COLS - 3) {
        if (r === 29 || r === 30) {
          tile = TileType.BRIDGE;
        }
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // East Return Portal to center
  grid[29][GRID_COLS - 2] = TileType.PORTAL_CENTER;
  grid[30][GRID_COLS - 2] = TileType.PORTAL_CENTER;

  // Soroban Swap pedestal
  grid[27][31] = TileType.WALL;

  return grid;
}

export const BAZAAR_DECORATIONS: GameDecoration[] = [
  // Magical violet/purple lanterns
  { x: 28, y: 28, type: "lamp" },
  { x: 32, y: 28, type: "lamp" },
  { x: 28, y: 32, type: "lamp" },
  { x: 32, y: 32, type: "lamp" },

  // Market stalls, barrels, and flower pots
  { x: 10, y: 25, type: "barrel" },
  { x: 11, y: 25, type: "box" },
  { x: 50, y: 25, type: "barrel" },
  { x: 51, y: 25, type: "box" },
  { x: 20, y: 20, type: "flower_pot" },
  { x: 40, y: 20, type: "flower_pot" },
  { x: 20, y: 40, type: "flower_pot" },
  { x: 40, y: 40, type: "flower_pot" },
];
