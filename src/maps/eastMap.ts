/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GRID_COLS, GRID_ROWS } from "../gameData";
import { GameDecoration } from "../gameData";

export function generateWalletForgeMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.TEMPLE_FLOOR;

      // Volcanic Moat / Lava
      if (r <= 2 || r >= GRID_ROWS - 3 || c >= GRID_COLS - 3 || (c <= 2 && !(r === 29 || r === 30))) {
        tile = TileType.WATER; // Lava represents as dark water
      }

      // Walls lining the volcanic caverns
      if (r === 3 || r === GRID_ROWS - 4 || c === GRID_COLS - 4 || (c === 3 && !(r === 29 || r === 30))) {
        tile = TileType.WALL;
      }

      // Central smelting pathway
      if ((c >= 26 && c <= 34) || (r >= 26 && r <= 34)) {
        tile = TileType.FLOOR_DARK;
      }

      // Main stone pathways
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        tile = TileType.STONE_PATH;
      }

      // Bridge for the portal on the West
      if (c === 1 || c === 2) {
        if (r === 29 || r === 30) {
          tile = TileType.BRIDGE;
        }
      }

      // Internal Cavern partition walls
      if ((r === 15 || r === 45) && c >= 10 && c <= 50 && !(c >= 26 && c <= 34)) {
        tile = TileType.WALL;
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // West Return Portal to center
  grid[29][1] = TileType.PORTAL_CENTER;
  grid[30][1] = TileType.PORTAL_CENTER;

  // Wallet Forge pedestal
  grid[28][35] = TileType.WALL;

  return grid;
}

export const FORGE_DECORATIONS: GameDecoration[] = [
  // Smelting torches/lamps
  { x: 28, y: 28, type: "lamp" },
  { x: 32, y: 28, type: "lamp" },
  { x: 28, y: 32, type: "lamp" },
  { x: 32, y: 32, type: "lamp" },

  // Statues guarding the forge
  { x: 15, y: 14, type: "statue" },
  { x: 45, y: 14, type: "statue" },
  { x: 15, y: 46, type: "statue" },
  { x: 45, y: 46, type: "statue" },

  // Crates and Barrels of forge fuel
  { x: 25, y: 29, type: "barrel" },
  { x: 25, y: 31, type: "box" },
  { x: 35, y: 29, type: "barrel" },
  { x: 35, y: 31, type: "box" },
];
