/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * arenaMap.ts — Grid 12×12 da Arena PVP
 *
 * Define:
 *  - Enum de tipos de tile da arena
 *  - Geração do grid 12×12 (octógono/ring)
 *  - Spawn points dos jogadores
 *  - Pontos de colisão (muros/bordas)
 */

// ── Tipos de tile da arena ────────────────────────────────────────────────────
export enum ArenaTileType {
  SAND_FLOOR  = 0,  // Piso de areia/terra (área de combate)
  WALL        = 1,  // Mureta de pedra (bordas) — colisão
  TORCH       = 2,  // Tocha decorativa (canto — sem colisão)
  GATE        = 3,  // Portão de entrada (arco gótico — sem colisão)
  CORNER_CUT  = 4,  // Canto cortado do octógono (parte da mureta)
}

export const ARENA_COLS = 12;
export const ARENA_ROWS = 12;
export const ARENA_TILE_SIZE = 48; // Tiles maiores para maior legibilidade do combate

/**
 * Gera o grid 12×12 da arena no formato de octógono/ring.
 *
 * Layout (0=areia, 1=muro, 2=tocha, 3=portão, 4=canto cortado):
 *
 *   [1][1][1][1][1][1][1][1][1][1][1][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [2][0][0][0][0][0][0][0][0][0][0][2]  ← tochas
 *   [2][0][0][0][0][0][0][0][0][0][0][2]  ← tochas
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][0][0][0][0][0][0][0][0][0][0][1]
 *   [1][3][3][3][3][1][1][3][3][3][3][1]  ← portão de entrada
 */
export function generateArenaGrid(): number[][] {
  const grid: number[][] = [];

  for (let r = 0; r < ARENA_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < ARENA_COLS; c++) {
      row.push(ArenaTileType.SAND_FLOOR);
    }
    grid.push(row);
  }

  // Bordas externas (muro)
  for (let c = 0; c < ARENA_COLS; c++) {
    grid[0][c] = ArenaTileType.WALL;               // Topo
    grid[ARENA_ROWS - 1][c] = ArenaTileType.WALL;  // Base
  }
  for (let r = 0; r < ARENA_ROWS; r++) {
    grid[r][0] = ArenaTileType.WALL;               // Esquerda
    grid[r][ARENA_COLS - 1] = ArenaTileType.WALL;  // Direita
  }

  // Tochas nos cantos do meio (linhas 5 e 6, colunas 0 e 11)
  grid[5][0]  = ArenaTileType.TORCH;
  grid[6][0]  = ArenaTileType.TORCH;
  grid[5][11] = ArenaTileType.TORCH;
  grid[6][11] = ArenaTileType.TORCH;

  // Portão de entrada na linha inferior (x=1..4 e x=7..10)
  for (let c = 1; c <= 4; c++) {
    grid[ARENA_ROWS - 1][c] = ArenaTileType.GATE;
  }
  for (let c = 7; c <= 10; c++) {
    grid[ARENA_ROWS - 1][c] = ArenaTileType.GATE;
  }

  return grid;
}

/**
 * Verifica se um tile da arena é colisão (o jogador não pode entrar).
 */
export function isArenaCollidable(tile: number): boolean {
  return tile === ArenaTileType.WALL || tile === ArenaTileType.CORNER_CUT;
}

/**
 * Retorna um spawn point aleatório e único para os jogadores.
 * Garante que dois jogadores não comecem no mesmo tile.
 *
 * @param usedPositions - Posições já ocupadas
 */
export function getAvailableSpawnPoint(
  usedPositions: { x: number; y: number }[]
): { x: number; y: number } {
  // Spawn points: 8 posições simétricas no anel interno
  const SPAWN_POINTS = [
    { x: 2,  y: 5 }, { x: 2,  y: 6 },   // esquerda
    { x: 9,  y: 5 }, { x: 9,  y: 6 },   // direita
    { x: 5,  y: 2 }, { x: 6,  y: 2 },   // cima
    { x: 5,  y: 9 }, { x: 6,  y: 9 },   // baixo
  ];

  const available = SPAWN_POINTS.filter(
    (sp) => !usedPositions.some((u) => u.x === sp.x && u.y === sp.y)
  );

  if (available.length === 0) {
    // Fallback: posição aleatória no centro se todos ocupados
    return {
      x: 4 + Math.floor(Math.random() * 4),
      y: 4 + Math.floor(Math.random() * 4),
    };
  }

  // Aleatoriza entre os disponíveis
  return available[Math.floor(Math.random() * available.length)];
}
