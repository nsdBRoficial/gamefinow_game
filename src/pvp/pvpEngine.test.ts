import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isInRange, 
  getDistance, 
  calcPvpPhysicalDamage, 
  calcPvpMagicDamage,
  getAttackInterval,
  isCriticalHit,
  getOffensiveBuffMultiplier,
  getDefensiveBuffFactor
} from './pvpEngine';
import { PvpPlayer } from './pvpTypes';

describe('pvpEngine tests', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Fixed random to avoid flakiness
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDummyPlayer = (overrides: Partial<PvpPlayer> = {}): PvpPlayer => ({
    playerId: 'p1',
    name: 'Player 1',
    arenaX: 5,
    arenaY: 5,
    dir: 'down',
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 20,
    defense: 10,
    speed: 50,
    level: 1,
    playerClass: 'warrior',
    activeBuffs: [],
    isEliminated: false,
    isMoving: false,
    frame: 0,
    skinColor: '#fff',
    headColor: '#000',
    headType: 'none',
    torsoColor: '#fff',
    torsoType: 'none',
    legsColor: '#fff',
    shoesColor: '#fff',
    shoesType: 'none',
    faceType: 'none',
    accessoryType: 'none',
    ...overrides
  });

  describe('Distance and Range checks', () => {
    it('calculates distance correctly', () => {
      const p1 = createDummyPlayer({ arenaX: 0, arenaY: 0 });
      const p2 = createDummyPlayer({ arenaX: 3, arenaY: 4 });
      expect(getDistance(p1, p2)).toBe(5); // 3-4-5 triangle
    });

    it('validates physical melee range (2 tiles)', () => {
      const p1 = createDummyPlayer({ arenaX: 5, arenaY: 5 });
      const p2 = createDummyPlayer({ arenaX: 5, arenaY: 7 });
      
      expect(isInRange(p1, p2, 'physical_melee')).toBe(true);
      
      const p3 = createDummyPlayer({ arenaX: 5, arenaY: 8 });
      expect(isInRange(p1, p3, 'physical_melee')).toBe(false);
    });

    it('validates magic range (5 tiles)', () => {
      const p1 = createDummyPlayer({ arenaX: 5, arenaY: 5 });
      const p2 = createDummyPlayer({ arenaX: 5, arenaY: 10 });
      
      expect(isInRange(p1, p2, 'magic_damage')).toBe(true);
      
      const p3 = createDummyPlayer({ arenaX: 5, arenaY: 11 });
      expect(isInRange(p1, p3, 'magic_damage')).toBe(false);
    });
  });

  describe('Damage Calculations', () => {
    it('calculates physical damage properly with defense mitigation', () => {
      const p1 = createDummyPlayer({ attack: 20 });
      const p2 = createDummyPlayer({ defense: 10 });

      const result = calcPvpPhysicalDamage(p1, p2);
      
      // Math.random() is 0.5, so getDamageRoll() returns 0.85 + 0.5 * 0.3 = 1.0
      // BaseAtk = 20
      // Def = 10 -> Def/2 = 5
      // BaseDamage = 20 - 5 = 15
      // Crit chance is 0.05, Math.random() is 0.5, so no crit.
      // FinalDamage = 15
      expect(result.damage).toBe(15);
      expect(result.isCrit).toBe(false);
    });

    it('calculates magic damage properly', () => {
      const p1 = createDummyPlayer({ attack: 20 }); // proxy for INT
      const p2 = createDummyPlayer({ defense: 10 });

      const spellBasePower = 30;
      const result = calcPvpMagicDamage(p1, spellBasePower, p2);

      // Roll = 1.0
      // IntValue = 20
      // BaseDamage = 30 * (1 + 20/80) = 30 * 1.25 = 37.5
      // FinalDamage = 37
      expect(result.damage).toBe(37);
      expect(result.isCrit).toBe(false);
    });

    it('applies critical hits when rng triggers', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // 1% < 5% base crit

      const p1 = createDummyPlayer({ attack: 20 });
      const p2 = createDummyPlayer({ defense: 10 });

      const result = calcPvpPhysicalDamage(p1, p2);
      // Roll = 0.85 + 0.01 * 0.3 = 0.853
      // BaseDamage = 15
      // CritMult = 2.0
      // Final = Math.floor(15 * 0.853 * 2.0) = 25
      expect(result.isCrit).toBe(true);
      expect(result.damage).toBe(25);
    });
  });

  describe('Attack Interval', () => {
    it('calculates attack interval based on speed', () => {
      const slow = getAttackInterval(0); // 1500
      const fast = getAttackInterval(100); // 1500 - 1000 = 500
      const max = getAttackInterval(200); // capped at 400

      expect(slow).toBe(1500);
      expect(fast).toBe(500);
      expect(max).toBe(400);
    });
  });
});
