import { describe, it, expect } from 'vitest';
import { calculateEffectiveStats, CLASSES_CATALOG, CLASS_CHANGE_COST_GAMEFI } from './classesData';
import { ActiveBuff, PlayerClassId } from './types';

describe('Classes Data & RPG Stats Engine', () => {
  it('deve possuir o catálogo completo das 4 classes principais com seus modificadores', () => {
    const classIds: PlayerClassId[] = ['warrior', 'soroban_mage', 'cosmic_ranger', 'network_guardian'];
    
    classIds.forEach((cId) => {
      const c = CLASSES_CATALOG[cId];
      expect(c).toBeDefined();
      expect(c.id).toBe(cId);
      expect(c.name).toBeTruthy();
      expect(c.icon).toBeTruthy();
      expect(c.passiveName).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.strMod).toBeGreaterThan(0);
      expect(c.intMod).toBeGreaterThan(0);
      expect(c.agiMod).toBeGreaterThan(0);
      expect(c.resMod).toBeGreaterThan(0);
      expect(c.faithMod).toBeGreaterThan(0);
    });

    expect(CLASS_CHANGE_COST_GAMEFI).toBe(10);
  });

  it('deve calcular atributos base corretos para aventureiro sem classe', () => {
    // 0 quests: STR 12, INT 10, AGI 11, RES 10, FAITH 20
    const stats0 = calculateEffectiveStats(0, undefined, []);
    expect(stats0.str).toBe(12);
    expect(stats0.int).toBe(10);
    expect(stats0.agi).toBe(11);
    expect(stats0.res).toBe(10);
    expect(stats0.faith).toBe(20);
    expect(stats0.speedMultiplier).toBe(1.0);
    expect(stats0.damageReduction).toBe(0);
    expect(stats0.isInvulnerable).toBe(false);

    // 4 quests: STR 12+12=24, INT 10+24=34, AGI 11+8=19, RES 10+16=26, FAITH 20+48=68
    const stats4 = calculateEffectiveStats(4, undefined, []);
    expect(stats4.str).toBe(24);
    expect(stats4.int).toBe(34);
    expect(stats4.agi).toBe(19);
    expect(stats4.res).toBe(26);
    expect(stats4.faith).toBe(68);
  });

  it('deve aplicar modificadores específicos para cada classe', () => {
    const completed = 2; // Base: STR=18, INT=22, AGI=15, RES=18, FAITH=44

    // Mago Soroban: foco em Inteligência (+80%) -> 22 * 1.8 = 39.6 -> 40
    const mageStats = calculateEffectiveStats(completed, 'soroban_mage', []);
    expect(mageStats.int).toBe(Math.round(22 * 1.80));
    expect(mageStats.str).toBe(Math.round(18 * 0.80));

    // Caçador Cósmico: foco em Agilidade (+70%) -> 15 * 1.7 = 25.5 -> 26
    const rangerStats = calculateEffectiveStats(completed, 'cosmic_ranger', []);
    expect(rangerStats.agi).toBe(Math.round(15 * 1.70));

    // Guardião da Rede: foco em Resistência e Fé (+50% / +60%)
    const guardianStats = calculateEffectiveStats(completed, 'network_guardian', []);
    expect(guardianStats.res).toBe(Math.round(18 * 1.50));
    expect(guardianStats.faith).toBe(Math.round(44 * 1.60));
  });

  it('deve acumular múltiplos buffs temporizados e ignorar buffs expirados', () => {
    const now = Date.now();
    const activeBuffs: ActiveBuff[] = [
      {
        id: 'buff_1',
        name: 'Buff Força',
        icon: '💪',
        durationMs: 5000,
        startTime: now - 1000,
        expiresAt: now + 4000, // Ativo
        statModifiers: { strBonus: 10, speedMultiplier: 1.1 },
      },
      {
        id: 'buff_2',
        name: 'Buff Escudo',
        icon: '🛡️',
        durationMs: 3000,
        startTime: now - 1000,
        expiresAt: now + 2000, // Ativo
        statModifiers: { damageReduction: 0.25, resBonus: 15 },
      },
      {
        id: 'buff_expired',
        name: 'Buff Expirado',
        icon: '⌛',
        durationMs: 1000,
        startTime: now - 2000,
        expiresAt: now - 500, // Já expirado
        statModifiers: { strBonus: 100 },
      },
    ];

    const stats = calculateEffectiveStats(0, undefined, activeBuffs);
    expect(stats.str).toBe(12 + 10); // 12 base + 10 buff_1 (ignora buff_expired)
    expect(stats.res).toBe(10 + 15);
    expect(stats.speedMultiplier).toBe(1.1);
    expect(stats.damageReduction).toBe(0.25);
  });
});
