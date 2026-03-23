import { describe, it, expect } from 'vitest';

describe('GemInstance', () => {
  describe('construction', () => {
    it('creates a gem with correct stats at level', () => {
      const gem = new GemInstance('devise', 5);
      expect(gem.name).toBe('Devise');
      expect(gem.type).toBe('auth');
      expect(gem.level).toBe(5);
      expect(gem.currentHp).toBe(gem.maxHp);
      expect(gem.maxHp).toBeGreaterThan(0);
    });

    it('learns moves up to current level', () => {
      const gem = new GemInstance('devise', 10);
      // Devise learnset: lv1 authenticate, lv5 session_store, lv10 token_generate
      expect(gem.moves).toContain('authenticate');
      expect(gem.moves).toContain('session_store');
      expect(gem.moves).toContain('token_generate');
    });

    it('caps moves at MAX_MOVES', () => {
      const gem = new GemInstance('devise', 20);
      expect(gem.moves.length).toBeLessThanOrEqual(MAX_MOVES);
    });

    it('starts with XP equal to xpForLevel', () => {
      const gem = new GemInstance('devise', 5);
      expect(gem.xp).toBe(GameMath.xpForLevel(5));
    });
  });

  describe('leveling', () => {
    it('levels up when given enough XP', () => {
      const gem = new GemInstance('devise', 5);
      const xpNeeded = GameMath.xpForLevel(6) - gem.xp;
      const results = gem.addXP(xpNeeded);
      expect(gem.level).toBe(6);
      expect(results.length).toBe(1);
      expect(results[0].level).toBe(6);
    });

    it('handles multiple level-ups from large XP gain', () => {
      const gem = new GemInstance('devise', 5);
      const xpToLevel8 = GameMath.xpForLevel(8) - gem.xp;
      const results = gem.addXP(xpToLevel8);
      expect(gem.level).toBe(8);
      expect(results.length).toBe(3);
    });

    it('increases HP on level up and preserves damage', () => {
      const gem = new GemInstance('devise', 5);
      gem.takeDamage(5);
      const damageTaken = gem.maxHp - gem.currentHp;
      const oldMaxHp = gem.maxHp;

      const xpNeeded = GameMath.xpForLevel(6) - gem.xp;
      gem.addXP(xpNeeded);

      expect(gem.maxHp).toBeGreaterThan(oldMaxHp);
      // Damage should be preserved (currentHp went up by same delta as maxHp)
      expect(gem.maxHp - gem.currentHp).toBe(damageTaken);
    });
  });

  describe('damage and fainting', () => {
    it('takeDamage reduces HP', () => {
      const gem = new GemInstance('devise', 5);
      gem.takeDamage(5);
      expect(gem.currentHp).toBe(gem.maxHp - 5);
    });

    it('HP cannot go below 0', () => {
      const gem = new GemInstance('devise', 5);
      gem.takeDamage(9999);
      expect(gem.currentHp).toBe(0);
    });

    it('isFainted returns true at 0 HP', () => {
      const gem = new GemInstance('devise', 5);
      gem.takeDamage(9999);
      expect(gem.isFainted).toBe(true);
    });

    it('isFainted returns false with HP remaining', () => {
      const gem = new GemInstance('devise', 5);
      expect(gem.isFainted).toBe(false);
    });
  });

  describe('healing', () => {
    it('heal restores HP up to max', () => {
      const gem = new GemInstance('devise', 5);
      gem.takeDamage(10);
      gem.heal();
      expect(gem.currentHp).toBe(gem.maxHp);
    });

    it('fullHeal restores HP and PP', () => {
      const gem = new GemInstance('devise', 10);
      gem.takeDamage(10);
      gem.pp[0] = 0;
      gem.fullHeal();
      expect(gem.currentHp).toBe(gem.maxHp);
      expect(gem.pp[0]).toBeGreaterThan(0);
    });
  });

  describe('serialization', () => {
    it('round-trips correctly', () => {
      const gem = new GemInstance('devise', 10);
      gem.takeDamage(5);
      gem.nickname = 'MyDevise';

      const data = gem.serialize();
      const restored = GemInstance.deserialize(data);

      expect(restored.gemId).toBe('devise');
      expect(restored.level).toBe(10);
      expect(restored.currentHp).toBe(gem.currentHp);
      expect(restored.nickname).toBe('MyDevise');
      expect(restored.moves).toEqual(gem.moves);
      expect(restored.pp).toEqual(gem.pp);
    });
  });

  describe('move learning', () => {
    it('learnMove adds to empty slot', () => {
      const gem = new GemInstance('devise', 1); // Only knows authenticate
      gem.learnMove('token_generate');
      expect(gem.moves).toContain('token_generate');
    });

    it('learnMove replaces at slot when specified', () => {
      const gem = new GemInstance('devise', 16); // Full moveset
      expect(gem.moves.length).toBe(MAX_MOVES);
      gem.learnMove('hash_strength', 0);
      expect(gem.moves[0]).toBe('hash_strength');
    });
  });
});

describe('BugInstance', () => {
  it('creates with correct stats', () => {
    const bug = new BugInstance('n_plus_one', 5);
    expect(bug.name).toBe('N+1 Query');
    expect(bug.type).toBe('database');
    expect(bug.level).toBe(5);
    expect(bug.isBug).toBe(true);
    expect(bug.currentHp).toBe(bug.maxHp);
    expect(bug.moves.length).toBeGreaterThan(0);
  });

  it('takeDamage works', () => {
    const bug = new BugInstance('n_plus_one', 5);
    bug.takeDamage(5);
    expect(bug.currentHp).toBe(bug.maxHp - 5);
  });
});
