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

      // 3. Central Plaza flooring (4 quadrantes pretos de 2 fileiras conforme imagem de referência)
      const isTopLeftPlaza = c >= 26 && c <= 28 && r >= 27 && r <= 28;
      const isTopRightPlaza = c >= 31 && c <= 33 && r >= 27 && r <= 28;
      const isBottomLeftPlaza = c >= 26 && c <= 28 && r >= 31 && r <= 32;
      const isBottomRightPlaza = c >= 31 && c <= 33 && r >= 31 && r <= 32;

      if (isTopLeftPlaza || isTopRightPlaza || isBottomLeftPlaza || isBottomRightPlaza) {
        tile = TileType.TEMPLE_FLOOR;
      }

      // 4. Central Cross paths
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

  // Caminho especifico sob e ao redor da Soroswap
  // y=19: x=31..39
  for (let c = 31; c <= 39; c++) {
    grid[19][c] = TileType.STONE_PATH;
  }
  // x=39: y=20,21,22
  grid[20][39] = TileType.STONE_PATH;
  grid[21][39] = TileType.STONE_PATH;
  grid[22][39] = TileType.STONE_PATH;
  // y=22: x=31..39
  for (let c = 31; c <= 39; c++) {
    grid[22][c] = TileType.STONE_PATH;
  }

  // Caminho especifico simetrico do lado esquerdo
  // y=19: x=21..28
  for (let c = 21; c <= 28; c++) {
    grid[19][c] = TileType.STONE_PATH;
  }
  // x=21: y=20,21,22
  grid[20][21] = TileType.STONE_PATH;
  grid[21][21] = TileType.STONE_PATH;
  grid[22][21] = TileType.STONE_PATH;
  // y=22: x=21..28
  for (let c = 21; c <= 28; c++) {
    grid[22][c] = TileType.STONE_PATH;
  }

  // Novos caminhos superiores (y=16 e y=13)
  for (let c = 31; c <= 39; c++) {
    grid[16][c] = TileType.STONE_PATH;
    grid[13][c] = TileType.STONE_PATH;
  }
  for (let c = 21; c <= 28; c++) {
    grid[16][c] = TileType.STONE_PATH;
    grid[13][c] = TileType.STONE_PATH;
  }

  // Mais caminhos superiores (y=10 e y=7)
  // Lado Direito
  for (let c = 31; c <= 39; c++) {
    grid[10][c] = TileType.STONE_PATH;
    grid[7][c] = TileType.STONE_PATH;
  }
  // Lado Esquerdo
  for (let c = 21; c <= 28; c++) {
    grid[10][c] = TileType.STONE_PATH;
    grid[7][c] = TileType.STONE_PATH;
  }
  // Conexoes verticais do y=7 ate y=19
  for (let r = 7; r <= 19; r++) {
    grid[r][21] = TileType.STONE_PATH; // Esquerda
    grid[r][39] = TileType.STONE_PATH; // Direita
  }
  grid[46][26] = TileType.STONE_PATH;
  grid[46][27] = TileType.STONE_PATH;
  grid[46][28] = TileType.STONE_PATH;

  // y=46: x=21..25
  for (let c = 21; c <= 25; c++) {
    grid[46][c] = TileType.STONE_PATH;
  }
  // y=43: x=21..28
  for (let c = 21; c <= 28; c++) {
    grid[43][c] = TileType.STONE_PATH;
  }
  // y=40: x=21..28
  for (let c = 21; c <= 28; c++) {
    grid[40][c] = TileType.STONE_PATH;
  }
  // x=21: y=40..46
  for (let r = 40; r <= 46; r++) {
    grid[r][21] = TileType.STONE_PATH;
  }

  // Right side bottom paths (symmetrical)
  // y=46: x=31..39
  for (let c = 31; c <= 39; c++) {
    grid[46][c] = TileType.STONE_PATH;
  }
  // y=43: x=31..39
  for (let c = 31; c <= 39; c++) {
    grid[43][c] = TileType.STONE_PATH;
  }
  // y=40: x=31..39
  for (let c = 31; c <= 39; c++) {
    grid[40][c] = TileType.STONE_PATH;
  }
  // x=39: y=40..46
  for (let r = 40; r <= 46; r++) {
    grid[r][39] = TileType.STONE_PATH;
  }

  // Mais caminhos inferiores (y=49 e y=52)
  // Lado Esquerdo
  for (let c = 21; c <= 28; c++) {
    grid[49][c] = TileType.STONE_PATH;
    grid[52][c] = TileType.STONE_PATH;
  }
  // Lado Direito
  for (let c = 31; c <= 39; c++) {
    grid[49][c] = TileType.STONE_PATH;
    grid[52][c] = TileType.STONE_PATH;
  }
  // Conexoes verticais inferiores (y=46 ate y=52)
  for (let r = 46; r <= 52; r++) {
    grid[r][21] = TileType.STONE_PATH; // Esquerda
    grid[r][39] = TileType.STONE_PATH; // Direita
  }

  // Add the NEARX stand blocks
  grid[45][26] = TileType.BLOCK;
  grid[45][27] = TileType.BLOCK;
  grid[45][28] = TileType.BLOCK;



  // Inject Portals at the far edges
  grid[29][1] = TileType.PORTAL_WEST;
  grid[30][1] = TileType.PORTAL_WEST;

  grid[29][GRID_COLS - 2] = TileType.PORTAL_EAST;
  grid[30][GRID_COLS - 2] = TileType.PORTAL_EAST;

  grid[1][29] = TileType.PORTAL_NORTH;
  grid[1][30] = TileType.PORTAL_NORTH;

  grid[GRID_ROWS - 2][29] = TileType.PORTAL_SOUTH;
  grid[GRID_ROWS - 2][30] = TileType.PORTAL_SOUTH;

  // Stands Collisions
  grid[27][21] = TileType.BLOCK; grid[27][22] = TileType.BLOCK; grid[27][23] = TileType.BLOCK; // LOJA P2P STORE
  grid[28][21] = TileType.BLOCK; grid[28][22] = TileType.BLOCK; grid[28][23] = TileType.BLOCK; // LOJA P2P STORE
  grid[32][21] = TileType.BLOCK; grid[32][22] = TileType.BLOCK; grid[32][23] = TileType.BLOCK; // GAMEFINOW baixado para y=32
  grid[32][37] = TileType.BLOCK; grid[32][38] = TileType.BLOCK; grid[32][39] = TileType.BLOCK; // PIGFI baixado para y=32
  grid[32][16] = TileType.BLOCK; grid[32][17] = TileType.BLOCK; grid[32][18] = TileType.BLOCK; // WAVE baixado para y=32
  grid[32][11] = TileType.BLOCK; grid[32][12] = TileType.BLOCK; grid[32][13] = TileType.BLOCK; // DUPPLY
  grid[28][16] = TileType.BLOCK; grid[28][17] = TileType.BLOCK; grid[28][18] = TileType.BLOCK; // DEFINDEX
  grid[28][37] = TileType.BLOCK; grid[28][38] = TileType.BLOCK; grid[28][39] = TileType.BLOCK; // WALLETNOW
  grid[18][31] = TileType.BLOCK; grid[18][32] = TileType.BLOCK; grid[18][33] = TileType.BLOCK; // SOROSWAP
  grid[45][26] = TileType.BLOCK; grid[45][27] = TileType.BLOCK; grid[45][28] = TileType.BLOCK; // NEARX
  grid[32][42] = TileType.BLOCK; grid[32][43] = TileType.BLOCK; grid[32][44] = TileType.BLOCK; // AUTOFIN (x=42,43,44 y=32)
  grid[21][26] = TileType.BLOCK; grid[21][27] = TileType.BLOCK; grid[21][28] = TileType.BLOCK; // TROQPAY
  grid[15][26] = TileType.BLOCK; grid[15][27] = TileType.BLOCK; grid[15][28] = TileType.BLOCK; // VELLORA
  grid[28][11] = TileType.BLOCK; grid[28][12] = TileType.BLOCK; grid[28][13] = TileType.BLOCK; // MUTAV
  grid[42][31] = TileType.BLOCK; grid[42][32] = TileType.BLOCK; grid[42][33] = TileType.BLOCK; // WEB3EDU
  grid[48][31] = TileType.BLOCK; grid[48][32] = TileType.BLOCK; grid[48][33] = TileType.BLOCK; // PARADEVS
  grid[32][52] = TileType.BLOCK; grid[32][53] = TileType.BLOCK; grid[32][54] = TileType.BLOCK; // ENERGYPAY
  grid[32][47] = TileType.BLOCK; grid[32][48] = TileType.BLOCK; grid[32][49] = TileType.BLOCK; // NIDO (x=47,48,49 y=32)
  grid[27][46] = TileType.BLOCK; grid[27][47] = TileType.BLOCK; grid[27][48] = TileType.BLOCK; // LOJA OUTFIT STORE
  grid[28][46] = TileType.BLOCK; grid[28][47] = TileType.BLOCK; grid[28][48] = TileType.BLOCK; // LOJA OUTFIT STORE

  // Altar de Queima Eterna (4 sqms: x=41,42 / y=27,28)
  grid[27][41] = TileType.BLOCK; grid[27][42] = TileType.BLOCK;
  grid[28][41] = TileType.BLOCK; grid[28][42] = TileType.BLOCK;

  // Fonte Faucet (2 sqms: x=28 / y=24,25 -> pé no y=25)
  grid[24][28] = TileType.BLOCK;
  grid[25][28] = TileType.BLOCK;

  // ATM Collision
  grid[28][33] = TileType.BLOCK;

  // Rua Branca Horizontal conectando no y=33 (x=4 ate x=55, incluindo x=26,27,28 e x=31,32,33)
  for (let c = 4; c <= 55; c++) {
    grid[33][c] = TileType.STONE_PATH;
  }
  grid[31][4] = TileType.STONE_PATH;
  grid[32][4] = TileType.STONE_PATH;
  grid[31][55] = TileType.STONE_PATH;
  grid[32][55] = TileType.STONE_PATH;

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
  { x: 40, y: 28, type: "flower_pot" },

  // LOJA P2P STORE (6 sqms no norte da rua: x=21..23, y=27..28)
  { x: 21, y: 27, type: "pixel_shop", text: "SHOP", subText: "P2P STORE", width: 3, height: 2, color: "#ef4444" },
  
  // LOJA OUTFIT STORE (6 sqms: x=46..48, y=27..28)
  { x: 46, y: 27, type: "pixel_shop", text: "SHOP", subText: "OUTFIT STORE", width: 3, height: 2, color: "#8b5cf6" },
  
  // GAMEFINOW Stand (baixado para y=32: x=21..23, y=32)
  { x: 21, y: 32, type: "stand", text: "GAMEFINOW", width: 3, color: "#f59e0b" },

  // DEFINDEX Stand
  { x: 16, y: 28, type: "stand", text: "DEFINDEX", width: 3, color: "#3b82f6" },

  // DUPPLY Stand (x=11..13, y=32)
  { x: 11, y: 32, type: "stand", text: "DUPPLY", width: 3, color: "#14b8a6" },

  // WAVE Stand (x=16..18, y=32)
  { x: 16, y: 32, type: "stand", text: "WAVE", width: 3, color: "#06b6d4" },

  // WALLETNOW Stand
  { x: 37, y: 28, type: "stand", text: "WALLETNOW", width: 3, color: "#10b981" },

  // PIGFI Stand (x=37..39, y=32)
  { x: 37, y: 32, type: "stand", text: "PIGFI", width: 3, color: "#ec4899" },

  // SOROSWAP Stand
  { x: 31, y: 18, type: "stand", text: "SOROSWAP", width: 3, color: "#ec4899" },

  // NEARX Stand
  { x: 26, y: 45, type: "stand", text: "NEARX", width: 3, color: "#9333ea" },

  // AUTOFIN Stand (x=42..44, y=32)
  { x: 42, y: 32, type: "stand", text: "AUTOFIN", width: 3, color: "#6366f1" },

  // NIDO Stand (x=47..49, y=32)
  { x: 47, y: 32, type: "stand", text: "NIDO", width: 3, color: "#eab308" },

  // TROQPAY Stand
  { x: 26, y: 21, type: "stand", text: "TROQPAY", width: 3, color: "#3b82f6" },

  // VELLORA Stand
  { x: 26, y: 15, type: "stand", text: "VELLORA", width: 3, color: "#f97316" },

  // MUTAV Stand
  { x: 11, y: 28, type: "stand", text: "MUTAV", width: 3, color: "#eab308" },

  // WEB3EDU Stand
  { x: 31, y: 42, type: "stand", text: "WEB3EDU", width: 3, color: "#8b5cf6" },

  // PARADEVS Stand
  { x: 31, y: 48, type: "stand", text: "PARADEVS", width: 3, color: "#10b981" },

  // ENERGYPAY Stand
  { x: 52, y: 32, type: "stand", text: "ENERGYPAY", width: 3, color: "#22c55e" },

  // ALTAR DE QUEIMA ETERNA (4 sqms: x=41..42, y=27..28, sem texto na tela)
  { x: 41, y: 27, type: "pixel_burn_brazier", width: 2, height: 2, color: "#f97316" },

  // FONTE FAUCET (2 sqms: x=28, y=24..25 -> pé no y=25)
  { x: 28, y: 24, type: "pixel_faucet", width: 1, height: 2, color: "#38bdf8" },

  // NÚCLEO STELLAR (Centro do mapa para o evento de wave, ocupa 2x2)
  { x: 29, y: 29, type: "stellar_nucleus", width: 2, height: 2 },
];
