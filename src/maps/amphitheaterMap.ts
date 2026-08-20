/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from "../gameData";

export const AMPHITHEATER_DECORATIONS: any[] = [
  // Palco Central e Microfone
  { x: 30, y: 14, type: "statue" },
  { x: 26, y: 14, type: "lamp" },
  { x: 34, y: 14, type: "lamp" },

  // Caixas de som decorativas e iluminação cênica
  { x: 22, y: 14, type: "box" },
  { x: 38, y: 14, type: "box" },

  // Fileiras de Bancos da Plateia
  { x: 20, y: 26, type: "bench" },
  { x: 25, y: 26, type: "bench" },
  { x: 30, y: 26, type: "bench" },
  { x: 35, y: 26, type: "bench" },
  { x: 40, y: 26, type: "bench" },

  { x: 16, y: 34, type: "bench" },
  { x: 22, y: 34, type: "bench" },
  { x: 30, y: 34, type: "bench" },
  { x: 38, y: 34, type: "bench" },
  { x: 44, y: 34, type: "bench" },

  { x: 12, y: 42, type: "bench" },
  { x: 20, y: 42, type: "bench" },
  { x: 30, y: 42, type: "bench" },
  { x: 40, y: 42, type: "bench" },
  { x: 48, y: 42, type: "bench" },

  // Tochas e Holofotes no perímetro
  { x: 10, y: 10, type: "lamp" },
  { x: 50, y: 10, type: "lamp" },
  { x: 8, y: 30, type: "lamp" },
  { x: 52, y: 30, type: "lamp" },

  // Portal de Retorno à Ilha Central
  { x: 30, y: 55, type: "stand" },
];

export function generateAmphitheaterMap(): number[][] {
  const map: number[][] = [];
  const size = 60;

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      // Limites e muralhas da arena
      if (r <= 4 || r >= size - 4 || c <= 4 || c >= size - 4) {
        row.push(TileType.WALL);
      } else if (r >= 12 && r <= 20 && c >= 24 && c <= 36) {
        // Palco Principal
        row.push(TileType.TEMPLE_FLOOR);
      } else if (c >= 28 && c <= 32 && r >= 21 && r <= 55) {
        // Corredor Central de Acesso
        row.push(TileType.STONE_PATH);
      } else if (r >= 24 && r <= 48 && c >= 8 && c <= 52) {
        // Área das Arquibancadas
        row.push(TileType.STONE_PATH);
      } else {
        // Piso Decorativo do Anfiteatro
        row.push(TileType.GRASS);
      }
    }
    map.push(row);
  }

  return map;
}
