import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('GameMath', () => {
  let origRandom;

  beforeEach(() => { origRandom = Math.random; });
  afterEach(() => { Math.random = origRandom; });

  describe('calculateDamage', () => {
    it('produces expected damage with minimum roll', () => {
      Math.random = () => 0; // 0.85 multiplier
      const dmg = GameMath.calculateDamage(10, 40, 30, 30, 1.0, 1.0);
      expect(dmg).toBeGreaterThanOrEqual(1);
      // Manual: floor(((20/5+2)*40*30/30)/50 + 2) = floor((6*40)/50 + 2) = floor(4.8+2) = 6
      // * 0.85 = 5.1 -> floor = 5
      expect(dmg).toBe(5);
    });

    it('produces higher or equal damage with maximum roll', () => {
      Math.random = () => 0.999; // ~1.0 multiplier
      const dmg = GameMath.calculateDamage(10, 40, 30, 30, 1.0, 1.0);
      // base = 6, * random(0.85+0.15*0.999) = 6 * 0.99985 = 5.999 -> floor = 5
      expect(dmg).toBeGreaterThanOrEqual(5);
    });

    it('minimum damage is always at least 1', () => {
      Math.random = () => 0;
      const dmg = GameMath.calculateDamage(1, 1, 1, 255, 1.0, 0.5);
      expect(dmg).toBeGreaterThanOrEqual(1);
    });

    it('applies STAB multiplier', () => {
      Math.random = () => 0.5;
      const noStab = GameMath.calculateDamage(10, 40, 30, 30, 1.0, 1.0);
      const withStab = GameMath.calculateDamage(10, 40, 30, 30, 1.5, 1.0);
      expect(withStab).toBeGreaterThanOrEqual(noStab);
    });

    it('applies type effectiveness', () => {
      Math.random = () => 0.5;
      const normal = GameMath.calculateDamage(10, 40, 30, 30, 1.0, 1.0);
      const superEff = GameMath.calculateDamage(10, 40, 30, 30, 1.0, 2.0);
      expect(superEff).toBeGreaterThan(normal);
    });
  });

  describe('xpForLevel', () => {
    it('uses cubic curve', () => {
      expect(GameMath.xpForLevel(5)).toBe(125);
      expect(GameMath.xpForLevel(10)).toBe(1000);
      expect(GameMath.xpForLevel(100)).toBe(1000000);
    });
  });

  describe('xpGain', () => {
    it('calculates correctly', () => {
      expect(GameMath.xpGain(64, 10)).toBe(Math.floor((64 * 10) / 7));
    });
  });

  describe('calcStat', () => {
    it('calculates HP stat correctly', () => {
      const hp = GameMath.calcStat(50, 10, true);
      // floor((50*2*10)/100) + 10 + 10 = floor(10) + 20 = 30
      expect(hp).toBe(30);
    });

    it('calculates non-HP stat correctly', () => {
      const stat = GameMath.calcStat(50, 10, false);
      // floor((50*2*10)/100) + 5 = 10 + 5 = 15
      expect(stat).toBe(15);
    });
  });

  describe('applyStageMod', () => {
    it('no change at stage 0', () => {
      expect(GameMath.applyStageMod(100, 0)).toBe(100);
    });

    it('+1 stage gives 1.5x', () => {
      expect(GameMath.applyStageMod(100, 1)).toBe(150);
    });

    it('-1 stage gives 0.67x', () => {
      expect(GameMath.applyStageMod(100, -1)).toBe(66);
    });

    it('clamps to [-6, 6]', () => {
      expect(GameMath.applyStageMod(100, 10)).toBe(GameMath.applyStageMod(100, 6));
      expect(GameMath.applyStageMod(100, -10)).toBe(GameMath.applyStageMod(100, -6));
    });
  });

  describe('weightedRandom', () => {
    it('returns an entry', () => {
      const entries = [{ weight: 50, id: 'a' }, { weight: 50, id: 'b' }];
      const result = GameMath.weightedRandom(entries);
      expect(result).toHaveProperty('id');
    });

    it('respects weights with rigged random', () => {
      Math.random = () => 0; // Should pick first entry
      const entries = [{ weight: 10, id: 'a' }, { weight: 90, id: 'b' }];
      expect(GameMath.weightedRandom(entries).id).toBe('a');
    });
  });

  describe('randInt', () => {
    it('returns value in range', () => {
      for (let i = 0; i < 50; i++) {
        const val = GameMath.randInt(3, 7);
        expect(val).toBeGreaterThanOrEqual(3);
        expect(val).toBeLessThanOrEqual(7);
      }
    });
  });
});
