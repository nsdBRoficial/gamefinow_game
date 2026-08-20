import { describe, it, expect } from 'vitest';
import { CLASS_SPELLS, getSpellsForClass } from './spellsData';
import { PlayerClassId } from './types';

describe('Spells Data & Spell Grimoire Engine', () => {
  it('deve retornar magias universais como fallback quando o jogador não possuir classe', () => {
    const spells = getSpellsForClass(undefined);
    expect(spells).toHaveLength(3);
    expect(spells[0].id).toBe('spell_univ_heal');
    expect(spells[1].id).toBe('spell_univ_fire');
    expect(spells[2].id).toBe('spell_univ_lightning');
  });

  it('deve garantir que todas as 4 classes possuam exatamente 3 magias mapeadas nas teclas 1, 2, 3', () => {
    const classIds: PlayerClassId[] = ['warrior', 'soroban_mage', 'cosmic_ranger', 'network_guardian'];

    classIds.forEach((classId) => {
      const spells = getSpellsForClass(classId);
      expect(spells).toHaveLength(3);

      expect(spells[0].shortcutKey).toBe('1');
      expect(spells[1].shortcutKey).toBe('2');
      expect(spells[2].shortcutKey).toBe('3');

      spells.forEach((sp) => {
        expect(sp.id).toBeTruthy();
        expect(sp.name).toBeTruthy();
        expect(sp.icon).toBeTruthy();
        expect(sp.mpCost).toBeGreaterThan(0);
        expect(sp.gcdMs).toBeGreaterThan(0);
        expect(['heal', 'damage', 'buff', 'teleport', 'aoe']).toContain(sp.type);
        expect(['heal', 'fire', 'lightning']).toContain(sp.animationType);
        expect(['physical', 'fire', 'lightning', 'ice', 'holy']).toContain(sp.element);
      });
    });
  });

  it('deve validar os efeitos de buffs associados a magias de suporte das classes', () => {
    // Grito de Guerra do Guerreiro
    const warcry = CLASS_SPELLS.warrior.find((s) => s.id === 'spell_warrior_warcry');
    expect(warcry).toBeDefined();
    expect(warcry?.buffToApply?.statModifiers.strBonus).toBe(15);
    expect(warcry?.buffToApply?.statModifiers.speedMultiplier).toBe(1.2);

    // Bastião Arcano do Mago
    const shield = CLASS_SPELLS.soroban_mage.find((s) => s.id === 'spell_mage_arcane_shield');
    expect(shield).toBeDefined();
    expect(shield?.buffToApply?.statModifiers.damageReduction).toBe(0.40);

    // Aura de Invulnerabilidade do Guardião
    const invul = CLASS_SPELLS.network_guardian.find((s) => s.id === 'spell_guardian_divine_shield');
    expect(invul).toBeDefined();
    expect(invul?.buffToApply?.statModifiers.invulnerable).toBe(true);
  });
});
