import { describe, it, expect, beforeEach } from 'vitest';
import { createGuild, joinGuild, loadAllGuilds, saveGuilds, GUILD_CREATION_COST_GAMEFI } from './guildsData';

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Guilds Data & Management System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve carregar a guilda padrão inicial caso o storage esteja vazio', () => {
    const guilds = loadAllGuilds();
    expect(guilds.length).toBeGreaterThanOrEqual(1);
    expect(guilds[0].id).toBe('guild-stellar-knights');
    expect(guilds[0].tag).toBe('[STAR]');
  });

  it('deve formatar tags de guilda corretamente com colchetes e letras maiúsculas', () => {
    const g1 = createGuild('Ordem da Luz', 'luz', 'Guilda da luz', '🛡️', '#3b82f6', 'p1', 'Player 1', 'warrior', 5);
    expect(g1.tag).toBe('[LUZ]');
    expect(g1.leaderId).toBe('p1');
    expect(g1.members).toHaveLength(1);
    expect(g1.members[0].role).toBe('leader');
  });

  it('deve permitir que novos jogadores entrem na guilda sem duplicar membros', () => {
    const g = createGuild('Alquimia Pura', '[ALQ]', 'Guilda de magos', '🧙‍♂️', '#8b5cf6', 'p1', 'Mago Chefe', 'soroban_mage', 8);

    const updated = joinGuild(g.id, {
      playerId: 'p2',
      name: 'Aprendiz',
      role: 'member',
      playerClass: 'soroban_mage',
      level: 3,
      joinedAt: Date.now(),
    });

    expect(updated).not.toBeNull();
    expect(updated?.members).toHaveLength(2);
    expect(updated?.members.some((m) => m.playerId === 'p2')).toBe(true);

    // Tentar adicionar o mesmo player novamente não deve duplicar
    const reJoined = joinGuild(g.id, {
      playerId: 'p2',
      name: 'Aprendiz',
      role: 'member',
      level: 3,
      joinedAt: Date.now(),
    });
    expect(reJoined?.members).toHaveLength(2);
  });

  it('deve possuir custo de fundação de guilda em 50 GAMEFI', () => {
    expect(GUILD_CREATION_COST_GAMEFI).toBe(50);
  });
});
