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
      let tile = TileType.SAND; // Base is sand for the beach

      // Coastal Sea
      if (r <= 20) {
        tile = TileType.WATER;
      }

      // Wooden Docks / Pier walkways extending into the sea
      if (r <= 20 && r >= 5) {
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

      // Grass area transitioning from the south
      if (r >= 45 && r <= GRID_ROWS - 5) {
        if (tile === TileType.SAND) tile = TileType.GRASS;
      }

      // Pathways
      if (c === 29 || c === 30 || r === 29 || r === 30) {
        // Wooden boardwalk on the beach
        tile = TileType.BRIDGE; 
      }

      // Center area (Boardwalk plaza)
      if (c >= 25 && c <= 35 && r >= 25 && r <= 35) {
        tile = TileType.BRIDGE;
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

  // Anchor Port pedestal (Central point)
  grid[30][30] = TileType.WALL;

  return grid;
}

export const PORT_DECORATIONS: GameDecoration[] = [
  // Pier safety lamps
  { x: 14, y: 6, type: "lamp" },
  { x: 16, y: 6, type: "lamp" },
  { x: 28, y: 6, type: "lamp" }, // Moved from 29 to 28 to be in the water
  { x: 31, y: 6, type: "lamp" },
  { x: 44, y: 6, type: "lamp" },
  { x: 46, y: 6, type: "lamp" },
  
  // Center plaza lamps
  { x: 26, y: 26, type: "lamp" },
  { x: 34, y: 26, type: "lamp" },
  { x: 26, y: 34, type: "lamp" },
  { x: 34, y: 34, type: "lamp" },

  // Boats anchored off the coast
  { x: 10, y: 18, type: "boat" },
  { x: 38, y: 18, type: "boat" },
  { x: 50, y: 19, type: "boat" },

  // Palm Trees along the beach
  { x: 8, y: 22, type: "palm_tree" },
  { x: 20, y: 23, type: "palm_tree" },
  { x: 40, y: 22, type: "palm_tree" },
  { x: 52, y: 24, type: "palm_tree" },
  { x: 12, y: 38, type: "palm_tree" },
  { x: 46, y: 39, type: "palm_tree" },
  
  // Beach Umbrellas
  { x: 10, y: 26, type: "umbrella", color: "#ef4444" }, // Red
  { x: 22, y: 28, type: "umbrella", color: "#3b82f6" }, // Blue
  { x: 42, y: 26, type: "umbrella", color: "#eab308" }, // Yellow
  { x: 48, y: 32, type: "umbrella", color: "#22c55e" }, // Green

  // Beach Towels
  { x: 10, y: 27, type: "towel", color: "#3b82f6" },
  { x: 22, y: 29, type: "towel", color: "#ef4444" },
  { x: 42, y: 27, type: "towel", color: "#22c55e" },
  { x: 48, y: 33, type: "towel", color: "#eab308" },

  // Sandcastles
  { x: 14, y: 30, type: "sandcastle" },
  { x: 45, y: 28, type: "sandcastle" },
  { x: 20, y: 35, type: "sandcastle" },
  { x: 50, y: 40, type: "sandcastle" },
];
