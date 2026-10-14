/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * arenaMap.ts — Mapa do Coliseu de Batalhas PvP em Mundo Aberto (60×60) [v1.5pvp]
 *
 * Arquitetura Espacial:
 * - Grade 60x60 azulejos desenhada matematicamente via equações euclidianas.
 * - Ringue de Areia Central: Raio de 14 tiles centrado em (30, 30), reservado para combate ativo.
 * - Mureta Octogonal de Contenção: Impede que monstros ou projéteis saiam para a área de observadores.
 * - Ponto de Respawn Contextual: Coordenadas (30, 53) ao sul, com escudo protetor anti-spawn kill de 3s.
 * - Corredor de Evacuação ao Sul: Passagem em (cols 28..32 / rows 44..56) que leva ao portal (30, 55).
 * - Portal de Saída (30, 55): Teleporta instantaneamente o jogador de volta à Praça Central.
 */

import { TileType } from "../gameData";

export const ARENA_DECORATIONS: any[] = [
  // Tochas de iluminação nos vértices da arena de combate
  { x: 18, y: 18, type: "lamp" },
  { x: 42, y: 18, type: "lamp" },
  { x: 18, y: 42, type: "lamp" },
  { x: 42, y: 42, type: "lamp" },

  { x: 30, y: 15, type: "lamp" },
  { x: 15, y: 30, type: "lamp" },
  { x: 45, y: 30, type: "lamp" },

  // Estátuas dos Campeões nos cantos do ringue
  { x: 20, y: 16, type: "statue" },
  { x: 40, y: 16, type: "statue" },

  // Arquibancadas decorativas nas laterais externas
  { x: 12, y: 24, type: "bench" },
  { x: 12, y: 30, type: "bench" },
  { x: 12, y: 36, type: "bench" },

  { x: 48, y: 24, type: "bench" },
  { x: 48, y: 30, type: "bench" },
  { x: 48, y: 36, type: "bench" },

  // Portal de Retorno à Praça Central (ao sul)
  { x: 30, y: 55, type: "stand" },
  { x: 28, y: 55, type: "lamp" },
  { x: 32, y: 55, type: "lamp" },
];

export function generateArenaMap(): number[][] {
  const map: number[][] = [];
  const size = 60;
  const centerX = 30;
  const centerY = 30;
  const arenaRadius = 14; // Raio do ringue de areia

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      // 1. Bordas externas absolutas
      if (r <= 4 || r >= size - 4 || c <= 4 || c >= size - 4) {
        row.push(TileType.WALL);
        continue;
      }

      // 2. Portal de Retorno ao Centro (linha 55, cols 29..31)
      if (r === 55 && (c === 29 || c === 30 || c === 31)) {
        row.push(TileType.PORTAL_CENTER);
        continue;
      }

      // 3. Corredor seguro ao sul (de retorno)
      if (r >= 44 && r <= 56 && c >= 28 && c <= 32) {
        row.push(TileType.STONE_PATH);
        continue;
      }

      // 4. Distância euclidiana ao centro da arena
      const dist = Math.hypot(c - centerX, r - centerY);

      if (dist <= arenaRadius) {
        // Piso de areia da arena de combate PvP
        row.push(TileType.SAND);
      } else if (dist <= arenaRadius + 1.8) {
        // Mureta de contenção do octógono/ringue
        // Deixa passagem aberta no sul para o corredor (cols 28..32)
        if (r > centerY + 10 && c >= 28 && c <= 32) {
          row.push(TileType.STONE_PATH);
        } else {
          row.push(TileType.WALL);
        }
      } else if (r >= 10 && r <= 50 && c >= 10 && c <= 50) {
        // Arquibancadas e pátio ao redor do ringue
        row.push(TileType.STONE_PATH);
      } else {
        // Paredes e limites de fundo
        row.push(TileType.WALL);
      }
    }
    map.push(row);
  }

  return map;
}
