import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

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

describe('Game Store - Battle Mode (Fase 1)', () => {
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
});
