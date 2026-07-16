/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, GRID_COLS, GRID_ROWS } from "../gameData";
import { GameDecoration } from "../gameData";

export function generateAnchorPortMap(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let tile = TileType.GRASS;

      // Coastal Sea (The top half represents the harbor sea water)
      if (r <= 22) {
        tile = TileType.WATER;
      }

      // Wooden Docks / Pier walkways extending into the sea
      if (r <= 22 && r >= 5) {
        if (c === 15 || c === 30 || c === 45) {
          tile = TileType.BRIDGE; // Wooden pier
        }
      }

      // Dock harbor wall boundary on the sides & south
      if (c <= 2 || c >= GRID_COLS - 3 || (r >= GRID_ROWS - 3 && !(c === 29 || c === 30))) {
        tile = TileType.WATER;
      }
      if (c === 3 || c === GRID_COLS - 4 || (r === GRID_ROWS - 4 && !(c === 29 || c === 30))) {
        tile = TileType.WALL;
      }

      // Sandy shoreline separating land and water
      if (r === 23 && tile !== TileType.BRIDGE) {
        tile = TileType.SAND;
      }

      // Dockyard warehouses flooring
      if (r >= 24 && r <= 50) {
        tile = TileType.FLOOR_DARK;
      }

      // Pathways
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        tile = TileType.STONE_PATH;
      }

      // Bridge for the portal on the South
      if (r === GRID_ROWS - 2 || r === GRID_ROWS - 3) {
        if (c === 29 || c === 30) {
          tile = TileType.BRIDGE;
        }
      }

      row.push(tile);
    }
    grid.push(row);
  }

  // South Return Portal to center
  grid[GRID_ROWS - 2][29] = TileType.PORTAL_CENTER;
  grid[GRID_ROWS - 2][30] = TileType.PORTAL_CENTER;

  // OnRamp pedestal
  grid[30][30] = TileType.WALL;

  return grid;
}

export const PORT_DECORATIONS: GameDecoration[] = [
  // Pier safety lamps
  { x: 14, y: 6, type: "lamp" },
  { x: 16, y: 6, type: "lamp" },
  { x: 29, y: 6, type: "lamp" },
  { x: 31, y: 6, type: "lamp" },
  { x: 44, y: 6, type: "lamp" },
  { x: 46, y: 6, type: "lamp" },

  // Benches along the coast
  { x: 24, y: 24, type: "bench" },
  { x: 36, y: 24, type: "bench" },

  // Barrels and cargo crates stacked at the docks
  { x: 13, y: 23, type: "barrel" },
  { x: 14, y: 23, type: "box" },
  { x: 46, y: 23, type: "barrel" },
  { x: 47, y: 23, type: "box" },
  { x: 26, y: 28, type: "barrel" },
  { x: 26, y: 31, type: "box" },
  { x: 34, y: 28, type: "barrel" },
  { x: 34, y: 31, type: "box" },
];
