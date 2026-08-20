/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from "../gameData";

export const GUILDHOUSE_DECORATIONS: any[] = [
  // Trono e Altar do Líder
  { x: 30, y: 10, type: "statue" },
  { x: 28, y: 10, type: "lamp" },
  { x: 32, y: 10, type: "lamp" },

  // Mesas de Reunião da Guilda
  { x: 24, y: 20, type: "box" },
  { x: 25, y: 20, type: "box" },
  { x: 35, y: 20, type: "box" },
  { x: 36, y: 20, type: "box" },

  { x: 24, y: 28, type: "barrel" },
  { x: 36, y: 28, type: "barrel" },

  // Tochas decorativas nas paredes
  { x: 10, y: 15, type: "lamp" },
  { x: 50, y: 15, type: "lamp" },
  { x: 10, y: 35, type: "lamp" },
  { x: 50, y: 35, type: "lamp" },

  // Luminárias guardiãs do Portal de Retorno
  { x: 28, y: 55, type: "lamp" },
  { x: 32, y: 55, type: "lamp" },
];

export function generateGuildHouseMap(): number[][] {
  const map: number[][] = [];
  const size = 60;

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      // Paredes e limites externos
      if (r <= 4 || r >= size - 4 || c <= 4 || c >= size - 4) {
        row.push(TileType.WALL);
      } else if (c >= 28 && c <= 32 && r >= 5 && r <= 55) {
        // Tapete Vermelho / Caminho Central Nobre
        row.push(TileType.STONE_PATH);
      } else if (r >= 8 && r <= 48 && c >= 8 && c <= 52) {
        // Piso de Madeira Nobre do Salão
        row.push(TileType.FLOOR_DARK);
      } else {
        // Piso de Pedra da Sede
        row.push(TileType.TEMPLE_FLOOR);
      }
    }
    map.push(row);
  }

  // ── Portal Mágico de Retorno à Praça Central (sqm x:30, y:55) ──
  map[55][29] = TileType.PORTAL_CENTER;
  map[55][30] = TileType.PORTAL_CENTER;
  map[55][31] = TileType.PORTAL_CENTER;

  return map;
}
