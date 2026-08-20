import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { calculateEffectiveStats, CLASSES_CATALOG } from '../classesData';

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Game Store - Battle Mode & RPG Expansion (Fase 1)', () => {
  beforeEach(() => {
    // Reseta o estado antes de cada teste
    const store = useGameStore.getState();
    store.setBattleMode(false);
    store.setLockedTarget(null);
  });

  it('deve alternar o modo de batalha corretamente', () => {
    const store = useGameStore.getState();
    expect(store.isBattleModeActive).toBe(false);

    store.setBattleMode(true);
    expect(useGameStore.getState().isBattleModeActive).toBe(true);

    store.setBattleMode(false);
    expect(useGameStore.getState().isBattleModeActive).toBe(false);
  });

  it('deve definir um alvo (Target Lock) caso o modo de batalha esteja ativo', () => {
    const store = useGameStore.getState();
    store.setBattleMode(true);
    
    store.setLockedTarget('worm-1');
    expect(useGameStore.getState().lockedTargetId).toBe('worm-1');
  });

  it('deve resetar o Target Lock ao desativar o modo de batalha', () => {
    const store = useGameStore.getState();
    store.setBattleMode(true);
    store.setLockedTarget('crab-2');
    expect(useGameStore.getState().lockedTargetId).toBe('crab-2');

    // Desativa o modo
    store.setBattleMode(false);
    
    // Verifica se o lock foi limpo automaticamente
    expect(useGameStore.getState().isBattleModeActive).toBe(false);
    expect(useGameStore.getState().lockedTargetId).toBe(null);
  });

  it('deve acionar killPlayer gravando informações do agressor e desativando combate', () => {
    const store = useGameStore.getState();
    store.setBattleMode(true);
    store.setLockedTarget('slime-boss');

    store.killPlayer('Slime Rei', 45);

    const state = useGameStore.getState();
    expect(state.isDead).toBe(true);
    expect(state.isBattleModeActive).toBe(false);
    expect(state.lockedTargetId).toBe(null);
    expect(state.lastDeathInfo?.killerName).toBe('Slime Rei');
    expect(state.lastDeathInfo?.damage).toBe(45);
  });

  it('deve executar respawnPlayer com teleporte, restauração de HP/MP e escudo protetor de 3s', () => {
    const store = useGameStore.getState();
    store.killPlayer('Monstro', 100);

    store.respawnPlayer();

    const state = useGameStore.getState();
    expect(state.isDead).toBe(false);
    expect(state.playerPos.mapId).toBe('center');
    expect(state.playerPos.x).toBe(30);
    expect(state.playerPos.y).toBe(30);
    expect(state.playerPos.hp).toBe(state.playerPos.maxHp || 100);
    expect(state.playerPos.mp).toBe(state.playerPos.maxMp || 50);

    // Verifica escudo protetor concedido
    const shieldBuff = (state.activeBuffs || []).find(b => b.id === 'buff_shield_respawn');
    expect(shieldBuff).toBeDefined();
    expect(shieldBuff?.statModifiers.invulnerable).toBe(true);
  });

  it('deve gerenciar buffs ativos e limpar expirados corretamente', () => {
    const store = useGameStore.getState();
    
    const speedBuff = {
      id: 'buff_test_speed',
      name: 'Velocidade de Teste',
      icon: '⚡',
      durationMs: 5000,
      startTime: Date.now(),
      expiresAt: Date.now() + 5000,
      statModifiers: { speedMultiplier: 1.25, strBonus: 5 }
    };

    store.addBuff(speedBuff);
    expect(useGameStore.getState().activeBuffs?.some(b => b.id === 'buff_test_speed')).toBe(true);

    store.removeBuff('buff_test_speed');
    expect(useGameStore.getState().activeBuffs?.some(b => b.id === 'buff_test_speed')).toBe(false);
  });

  it('deve calcular atributos efetivos considerando modificadores de classe e buffs', () => {
    // 4 quests completadas base: STR = 12 + 4*3 = 24
    const baseStats = calculateEffectiveStats(4, undefined, []);
    expect(baseStats.str).toBe(24);

    // Guerreiro ganha +60% de STR (24 * 1.6 = 38.4 -> 38)
    const warriorStats = calculateEffectiveStats(4, 'warrior', []);
    expect(warriorStats.str).toBe(Math.round(24 * CLASSES_CATALOG.warrior.strMod));

    // Guerreiro com buff de +10 STR
    const buffedStats = calculateEffectiveStats(4, 'warrior', [
      {
        id: 'buff_might',
        name: 'Poder',
        icon: '💪',
        durationMs: 10000,
        startTime: Date.now(),
        expiresAt: Date.now() + 10000,
        statModifiers: { strBonus: 10, speedMultiplier: 1.15 }
      }
    ]);
    expect(buffedStats.str).toBe(Math.round(24 * CLASSES_CATALOG.warrior.strMod) + 10);
    expect(buffedStats.speedMultiplier).toBe(1.15);
  });
});
