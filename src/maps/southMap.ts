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
      let tile = TileType.TEMPLE_FLOOR;

      // Outer water streams
      if (r >= GRID_ROWS - 3 || c <= 2 || c >= GRID_COLS - 3 || (r <= 2 && !(c === 29 || c === 30))) {
        tile = TileType.WATER;
      }

      // Border walls
      if (r === GRID_ROWS - 4 || c === 3 || c === GRID_COLS - 4 || (r === 3 && !(c === 29 || c === 30))) {
        tile = TileType.WALL;
      }

      // Quiet inner pools surrounded by golden sand
      if (
        ((c >= 10 && c <= 18) || (c >= 42 && c <= 50)) &&
        ((r >= 10 && r <= 18) || (r >= 42 && r <= 50))
      ) {
        if (c === 10 || c === 18 || c === 42 || c === 50 || r === 10 || r === 18 || r === 42 || r === 50) {
          tile = TileType.SAND;
        } else {
          tile = TileType.WATER;
        }
      }

      // Sanctuary garden hedges
      if (r >= 22 && r <= 38 && ((c >= 6 && c <= 8) || (c >= 51 && c <= 53))) {
        tile = TileType.HEDGE;
      }

      // Pathways
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        tile = TileType.STONE_PATH;
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

  // Escrow Hold pedestal
  grid[30][30] = TileType.WALL;

  return grid;
}

export const SANCTUARY_DECORATIONS: GameDecoration[] = [
  // Glowing golden torches/lamps
  { x: 28, y: 28, type: "lamp" },
  { x: 32, y: 28, type: "lamp" },
  { x: 28, y: 32, type: "lamp" },
  { x: 32, y: 32, type: "lamp" },

  // Mythical guardian statues
  { x: 24, y: 15, type: "statue" },
  { x: 36, y: 15, type: "statue" },
  { x: 24, y: 45, type: "statue" },
  { x: 36, y: 45, type: "statue" },

  // Benches and ancient flower pots
  { x: 25, y: 26, type: "bench" },
  { x: 35, y: 26, type: "bench" },
  { x: 25, y: 34, type: "bench" },
  { x: 35, y: 34, type: "bench" },
];
