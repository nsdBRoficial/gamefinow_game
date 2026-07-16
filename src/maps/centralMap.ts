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

  // Inject Portals at the far edges
  grid[29][1] = TileType.PORTAL_WEST;
  grid[30][1] = TileType.PORTAL_WEST;

  grid[29][GRID_COLS - 2] = TileType.PORTAL_EAST;
  grid[30][GRID_COLS - 2] = TileType.PORTAL_EAST;

  grid[1][29] = TileType.PORTAL_NORTH;
  grid[1][30] = TileType.PORTAL_NORTH;

  grid[GRID_ROWS - 2][29] = TileType.PORTAL_SOUTH;
  grid[GRID_ROWS - 2][30] = TileType.PORTAL_SOUTH;

  // New portals at sqm 59,29 and 59,30 leading to the East Biome
  grid[59][29] = TileType.PORTAL_EAST;
  grid[59][30] = TileType.PORTAL_EAST;

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
];
