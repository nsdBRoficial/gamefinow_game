import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { CLASS_SPELLS } from '../spellsData';
import { INITIAL_QUESTS } from '../gameData';

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

describe('GameStore QA & Full System Regression Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useGameStore.getState();
    store.setPlayerPos({
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      mapId: 'center',
      x: 30,
      y: 30,
      playerClass: 'soroban_mage',
    });
    store.setGameState({
      inventory: [],
      activeBuffs: [],
      globalCooldownEnd: 0,
      potionCooldownEnd: 0,
      isDead: false,
      isBattleModeActive: true,
      lockedTargetId: 'test-target',
      level: 1,
      xp_current: 0,
      ownedEquipment: ['sword_1h_1', 'shield_1h_1'],
      quests: {
        ...(INITIAL_QUESTS as Record<import('../types').QuestId, import('../types').Quest>),
        kill_center: {
          ...INITIAL_QUESTS.kill_center,
          status: 'active',
          killCount: 4,
        },
      } as Record<import('../types').QuestId, import('../types').Quest>,
    });
  });

  it('QA 1 - Gerenciamento de Inventário: deve adicionar itens e empilhar até 99', () => {
    const store = useGameStore.getState();

    // Adiciona 50 poções de cura
    store.addItemToInventory('health_potion', 'consumable', 50);
    let inv = useGameStore.getState().inventory || [];
    expect(inv.find((i) => i.id === 'health_potion')?.quantity).toBe(50);

    // Adiciona mais 60 (deve criar stack de 99 e novo stack de 11)
    store.addItemToInventory('health_potion', 'consumable', 60);
    inv = useGameStore.getState().inventory || [];
    const totalCount = inv.filter((i) => i.id === 'health_potion').reduce((acc, curr) => acc + curr.quantity, 0);
    expect(totalCount).toBe(110);
  });

  it('QA 2 - Uso de Poções: deve restaurar HP/MP, consumir item e aplicar cooldowns', () => {
    const store = useGameStore.getState();

    // Reduz HP e adiciona poção
    store.setPlayerPos({ hp: 40, maxHp: 100 });
    store.addItemToInventory('health_potion', 'consumable', 2);

    store.usePotion('health');

    const updated = useGameStore.getState();
    // Poção cura 40% (40 + 40 = 80)
    expect(updated.playerPos.hp).toBe(80);
    expect(updated.potionCooldownEnd).toBeGreaterThan(Date.now());
    expect(updated.globalCooldownEnd).toBeGreaterThan(Date.now());

    // Quantidade restante de poções deve ser 1
    const inv = updated.inventory || [];
    expect(inv.find((i) => i.id === 'health_potion')?.quantity).toBe(1);
  });

  it('QA 3 - Conjuração de Feitiço de Classe (castSpell): deve consumir MP, aplicar GCD e registrar animação', () => {
    const store = useGameStore.getState();
    const spell = CLASS_SPELLS.soroban_mage[0]; // Meteoro Soroban (custo 20 MP)

    store.castSpell(spell);

    const updated = useGameStore.getState();
    expect(updated.playerPos.mp).toBe(50 - spell.mpCost);
    expect(updated.globalCooldownEnd).toBeGreaterThan(Date.now());
    expect(updated.activeAnimations?.length).toBeGreaterThan(0);
  });

  it('QA 4 - Feitiços de Suporte: deve aplicar buff temporizado no estado ativo', () => {
    const store = useGameStore.getState();
    const buffSpell = CLASS_SPELLS.soroban_mage[2]; // Bastião Arcano (Escudo)

    store.castSpell(buffSpell);

    const updated = useGameStore.getState();
    const shieldBuff = updated.activeBuffs?.find((b) => b.id === 'buff_arcane_shield');
    expect(shieldBuff).toBeDefined();
    expect(shieldBuff?.statModifiers.damageReduction).toBe(0.40);
  });

  it('QA 5 - Bloqueio de Feitiço sem Mana Suficiente', () => {
    const store = useGameStore.getState();
    store.setPlayerPos({ mp: 5 }); // Apenas 5 MP

    const spell = CLASS_SPELLS.soroban_mage[1]; // Raio em Cadeia (custo 35 MP)
    store.castSpell(spell);

    const updated = useGameStore.getState();
    // MP não deve ser deduzido
    expect(updated.playerPos.mp).toBe(5);
    expect(updated.lastBlockedCastTime).toBeDefined();
  });

  it('QA 6 - Sistema de Progressão e Abates (registerKill): deve completar a missão, conceder XP e drop', () => {
    const store = useGameStore.getState();
    const prevXp = store.xp_current || 0;

    // 5º abate de Blob no centro conclui a missão
    const result = store.registerKill('Blob', 'center');
    expect(result.questCompleted).toBe(true);
    expect(result.xpGained).toBe(200);
    expect(result.dropItemId).toBe('slime_core');

    const updated = useGameStore.getState();
    expect(updated.xp_current).toBe(prevXp + 200);
    expect(updated.quests.kill_center.status).toBe('completed');
  });

  it('QA 7 - Equipamentos: equipItem e unequipSlot devem atualizar slots do jogador', () => {
    const store = useGameStore.getState();

    store.equipItem('sword_1h_1', 'rightHand');
    expect(useGameStore.getState().playerPos.equippedItems?.rightHand).toBe('sword_1h_1');

    store.unequipSlot('rightHand');
    expect(useGameStore.getState().playerPos.equippedItems?.rightHand).toBeFalsy();
  });
});
