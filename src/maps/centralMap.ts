/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GRID_COLS, GRID_ROWS } from "../gameData";
import { GameDecoration } from "../gameData";

export function generateCentralMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.GRASS;

      // 1. Water border (Outer moat)
      if (r <= 2 || r >= GRID_ROWS - 3 || c <= 2 || c >= GRID_COLS - 3) {
        tile = TileType.WATER;
      }

      // 2. Main pathways (horizontal and vertical cross)
      if ((c === 29 || c === 30) || (r === 29 || r === 30)) {
        tile = TileType.STONE_PATH;
      }

      // 3. Central Plaza flooring
      if (c >= 27 && c <= 33 && r >= 27 && r <= 33) {
        tile = TileType.TEMPLE_FLOOR;
      }

      // 4. Central Cross paths over the Temple floor
      if ((c === 29 || c === 30) || (r === 29 || r === 30)) {
        tile = TileType.STONE_PATH;
      }

      // 5. Border fences / walls
      if ((r === 3 || r === GRID_ROWS - 4 || c === 3 || c === GRID_COLS - 4)) {
        // Leave gaps for the pathways leading to the portals
        if (!((c === 29 || c === 30) || (r === 29 || r === 30))) {
          tile = TileType.WALL;
        }
      }

      // 6. Beautiful flower gardens and hedges in quadrants
      if (
        ((c >= 6 && c <= 20) || (c >= 40 && c <= 54)) &&
        ((r >= 6 && r <= 20) || (r >= 40 && r <= 54))
      ) {
        // Elegant maze/hedges pattern
        if (c % 4 === 0 || r % 4 === 0) {
          tile = TileType.HEDGE;
        } else {
          tile = TileType.GRASS;
        }
      }

      // 7. Small ponds in corners
      if (
        ((c >= 10 && c <= 15) || (c >= 45 && c <= 50)) &&
        ((r >= 10 && r <= 15) || (r >= 45 && r <= 50))
      ) {
        tile = TileType.WATER;
      }

      // 8. Bridge connectors to portals over water
      if (r === 1 || r === 2 || r === GRID_ROWS - 2 || r === GRID_ROWS - 3) {
        if (c === 29 || c === 30) {
          tile = TileType.BRIDGE;
        }
      }
      if (c === 1 || c === 2 || c === GRID_COLS - 2 || c === GRID_COLS - 3) {
        if (r === 29 || r === 30) {
          tile = TileType.BRIDGE;
        }
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // Make the stand tiles solid
  grid[28][21] = TileType.BLOCK;
  grid[28][22] = TileType.BLOCK;
  grid[28][23] = TileType.BLOCK;
  grid[28][16] = TileType.BLOCK;
  grid[28][17] = TileType.BLOCK;
  grid[28][18] = TileType.BLOCK;
  grid[28][37] = TileType.BLOCK;
  grid[28][38] = TileType.BLOCK;
  grid[28][39] = TileType.BLOCK;
  grid[18][31] = TileType.BLOCK;
  grid[18][32] = TileType.BLOCK;
  grid[18][33] = TileType.BLOCK;

  // Add the white street
  grid[19][31] = TileType.STONE_PATH;
  grid[19][32] = TileType.STONE_PATH;
  grid[19][33] = TileType.STONE_PATH;
  grid[46][26] = TileType.STONE_PATH;
  grid[46][27] = TileType.STONE_PATH;
  grid[46][28] = TileType.STONE_PATH;

  // Add the NEARX stand blocks
  grid[45][26] = TileType.BLOCK;
  grid[45][27] = TileType.BLOCK;
  grid[45][28] = TileType.BLOCK;

  // Add the extra black flooring on the left
  grid[27][26] = TileType.TEMPLE_FLOOR;
  grid[28][26] = TileType.TEMPLE_FLOOR;
  grid[31][26] = TileType.TEMPLE_FLOOR;
  grid[32][26] = TileType.TEMPLE_FLOOR;
  grid[33][26] = TileType.TEMPLE_FLOOR;

  // Inject Portals at the far edges
  grid[29][1] = TileType.PORTAL_WEST;
  grid[30][1] = TileType.PORTAL_WEST;

  grid[29][GRID_COLS - 2] = TileType.PORTAL_EAST;
  grid[30][GRID_COLS - 2] = TileType.PORTAL_EAST;

  grid[1][29] = TileType.PORTAL_NORTH;
  grid[1][30] = TileType.PORTAL_NORTH;

  grid[GRID_ROWS - 2][29] = TileType.PORTAL_SOUTH;
  grid[GRID_ROWS - 2][30] = TileType.PORTAL_SOUTH;

  return grid;
}

export const CENTRAL_DECORATIONS: GameDecoration[] = [
  // Central Fountain/Statue near the ATF
  { x: 30, y: 31, type: "statue" },

  // Street lamps around center crossroads
  { x: 26, y: 26, type: "lamp" },
  { x: 34, y: 26, type: "lamp" },
  { x: 26, y: 34, type: "lamp" },
  { x: 34, y: 34, type: "lamp" },

  // Benches around plaza
  { x: 25, y: 28, type: "bench" },
  { x: 35, y: 28, type: "bench" },
  { x: 25, y: 32, type: "bench" },
  { x: 35, y: 32, type: "bench" },

  // Trees in town square
  { x: 23, y: 23, type: "tree" },
  { x: 37, y: 23, type: "tree" },
  { x: 23, y: 37, type: "tree" },
  { x: 37, y: 37, type: "tree" },

  // Flower pots along roads
  { x: 28, y: 20, type: "flower_pot" },
  { x: 32, y: 20, type: "flower_pot" },
  { x: 28, y: 40, type: "flower_pot" },
  { x: 32, y: 40, type: "flower_pot" },
  { x: 20, y: 28, type: "flower_pot" },
  { x: 20, y: 32, type: "flower_pot" },
  { x: 40, y: 28, type: "flower_pot" },
  { x: 40, y: 32, type: "flower_pot" },

  // GAMEFINOW Stand
  { x: 21, y: 28, type: "stand", text: "GAMEFINOW", width: 3, color: "#f59e0b" },
  
  // DEFINDEX Stand
  { x: 16, y: 28, type: "stand", text: "DEFINDEX", width: 3, color: "#3b82f6" },

  // WALLETNOW Stand
  { x: 37, y: 28, type: "stand", text: "WALLETNOW", width: 3, color: "#10b981" },

  // SOROSWAP Stand
  { x: 31, y: 18, type: "stand", text: "SOROSWAP", width: 3, color: "#ec4899" },

  // NEARX Stand
  { x: 26, y: 45, type: "stand", text: "NEARX", width: 3, color: "#9333ea" },
];
