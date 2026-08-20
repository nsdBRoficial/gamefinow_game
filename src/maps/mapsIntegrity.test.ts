import { describe, it, expect } from 'vitest';
import { getMapGrid, getMapDecorations, MapId } from './index';
import { GRID_COLS, GRID_ROWS, TileType } from '../gameData';

describe('Maps Integrity & World Grid Verification', () => {
  const allMapIds: MapId[] = ['center', 'east', 'north', 'west', 'south', 'guildhouse', 'amphitheater'];

  allMapIds.forEach((mapId) => {
    it(`mapa "${mapId}" deve ter grade 60x60 válida e decorações cadastradas`, () => {
      const grid = getMapGrid(mapId);
      expect(grid).toBeDefined();
      expect(grid.length).toBe(GRID_ROWS); // 60 linhas

      grid.forEach((row, rowIndex) => {
        expect(row.length).toBe(GRID_COLS); // 60 colunas
        row.forEach((tile, colIndex) => {
          expect(typeof tile).toBe('number');
          expect(tile).toBeGreaterThanOrEqual(0);
        });
      });

      const decorations = getMapDecorations(mapId);
      expect(Array.isArray(decorations)).toBe(true);
      expect(decorations.length).toBeGreaterThan(0);
    });
  });

  it('mapa da Guildhouse deve possuir TileType.PORTAL_CENTER no sqm x:30 y:55 para a praça central', () => {
    const grid = getMapGrid('guildhouse');
    expect(grid[55][30]).toBe(TileType.PORTAL_CENTER);
  });
});
