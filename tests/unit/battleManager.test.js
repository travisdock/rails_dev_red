import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('BattleManager', () => {
  let bm, origRandom;

  beforeEach(() => {
    origRandom = Math.random;
    bm = new BattleManager();
  });

  afterEach(() => {
    Math.random = origRandom;
  });

  function makeParty(specs) {
    return specs.map(s => new GemInstance(s.id, s.level));
  }

  function makeBugParty(specs) {
    return specs.map(s => new BugInstance(s.id, s.level));
  }

  describe('init', () => {
    it('sets up battle state correctly', () => {
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);

      expect(bm.activePlayerGem).toBe(player[0]);
      expect(bm.activeEnemyGem).toBe(enemy[0]);
      expect(bm.isWild).toBe(true);
      expect(bm.escapeAttempts).toBe(0);
    });

    it('resets all state on re-init', () => {
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);

      // Simulate some state changes
      bm.escapeAttempts = 5;
      bm.playerStages.attack = 3;

      // Re-init
      const newPlayer = makeParty([{ id: 'rspec', level: 8 }]);
      const newEnemy = makeBugParty([{ id: 'sql_injection', level: 10 }]);
      bm.init(newPlayer, newEnemy, false, { name: 'Test' });

      expect(bm.escapeAttempts).toBe(0);
      expect(bm.playerStages.attack).toBe(0);
      expect(bm.activePlayerGem.name).toBe('RSpec');
      expect(bm.isWild).toBe(false);
    });
  });

  describe('executeTurn - fight', () => {
    it('returns non-empty events array', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);

      const events = bm.executeTurn({ type: 'fight', moveId: 'authenticate' });
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'message')).toBe(true);
    });

    it('generates damage events for attacking moves', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);

      const events = bm.executeTurn({ type: 'fight', moveId: 'authenticate' });
      expect(events.some(e => e.type === 'damage')).toBe(true);
    });

    it('handles enemy faint and awards XP', () => {
      Math.random = () => 0.5;
      // High level player should one-shot low level bug
      const player = makeParty([{ id: 'devise', level: 50 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 3 }]);
      bm.init(player, enemy, true, null);

      const events = bm.executeTurn({ type: 'fight', moveId: 'authenticate' });

      expect(events.some(e => e.type === 'faint' && e.side === 'enemy')).toBe(true);
      expect(events.some(e => e.type === 'battle_end' && e.result === 'win')).toBe(true);
      expect(events.some(e => e.text && e.text.includes('XP'))).toBe(true);
    });
  });

  describe('executeTurn - switch', () => {
    it('snapshots HP before enemy attack', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }, { id: 'rspec', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 8 }]);
      bm.init(player, enemy, true, null);

      const rspecMaxHp = player[1].maxHp;
      const events = bm.executeTurn({ type: 'switch', gemIndex: 1 });

      const switchEvent = events.find(e => e.type === 'switch');
      expect(switchEvent).toBeDefined();
      expect(switchEvent.hp).toBe(rspecMaxHp);
      expect(switchEvent.maxHp).toBe(rspecMaxHp);
    });

    it('checks faint after enemy counter-attack on switch', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }, { id: 'pry', level: 3 }]);
      // Make Pry have 1 HP
      player[1].currentHp = 1;
      const enemy = makeBugParty([{ id: 'sql_injection', level: 20 }]);
      bm.init(player, enemy, true, null);

      const events = bm.executeTurn({ type: 'switch', gemIndex: 1 });

      // If Pry was KO'd, should have faint events
      if (player[1].isFainted) {
        expect(events.some(e => e.type === 'faint' && e.side === 'player')).toBe(true);
        // Should have either force_switch or battle_end
        const hasForceSwitch = events.some(e => e.type === 'force_switch');
        const hasBattleEnd = events.some(e => e.type === 'battle_end');
        expect(hasForceSwitch || hasBattleEnd).toBe(true);
      }
    });

    it('skips "Come back" message for fainted gem', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }, { id: 'rspec', level: 10 }]);
      player[0].currentHp = 0; // Fainted
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);
      bm.activePlayerGem = player[0]; // Force active to fainted gem

      const events = bm.executeTurn({ type: 'switch', gemIndex: 1 });
      expect(events.some(e => e.text && e.text.includes('Come back'))).toBe(false);
    });
  });

  describe('executeTurn - run', () => {
    it('cannot run from trainer battles', () => {
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeParty([{ id: 'rspec', level: 10 }]);
      bm.init(player, enemy, false, { name: 'Trainer' });

      const events = bm.executeTurn({ type: 'run' });
      expect(events.some(e => e.text && e.text.includes("Can't run"))).toBe(true);
      expect(events.some(e => e.type === 'battle_end')).toBe(false);
    });

    it('failed escape still triggers enemy attack', () => {
      // canEscape uses a formula; to guarantee failure, make player much slower
      Math.random = () => 0.999;
      const player = makeParty([{ id: 'bcrypt', level: 3 }]); // Very slow gem
      const enemy = makeBugParty([{ id: 'race_condition', level: 50 }]); // Very fast bug
      bm.init(player, enemy, true, null);

      const events = bm.executeTurn({ type: 'run' });
      // Should have "Couldn't get away!" and then enemy attack message
      expect(events.some(e => e.text && e.text.includes("Couldn't get away"))).toBe(true);
      // Enemy attack produces at least a message about using a move
      expect(events.filter(e => e.type === 'message').length).toBeGreaterThan(1);
    });
  });

  describe('status moves', () => {
    it('applies stat stage changes', () => {
      Math.random = () => 0.5;
      const player = makeParty([{ id: 'devise', level: 10 }]);
      const enemy = makeBugParty([{ id: 'n_plus_one', level: 5 }]);
      bm.init(player, enemy, true, null);

      // session_store raises spDefense
      const events = bm.executeTurn({ type: 'fight', moveId: 'session_store' });
      expect(bm.playerStages.spDefense).toBe(1);
      expect(events.some(e => e.text && e.text.includes('rose'))).toBe(true);
    });
  });

  describe('full battle simulation', () => {
    it('100 random turns never produce empty events', () => {
      Math.random = origRandom; // Use real random
      const player = makeParty([
        { id: 'devise', level: 20 },
        { id: 'rspec', level: 20 },
        { id: 'sidekiq', level: 20 }
      ]);
      const enemy = makeBugParty([
        { id: 'n_plus_one', level: 10 },
        { id: 'sql_injection', level: 10 }
      ]);
      bm.init(player, enemy, true, null);

      for (let i = 0; i < 100; i++) {
        if (bm.activePlayerGem.isFainted) {
          const alive = player.findIndex(g => !g.isFainted);
          if (alive === -1) break;
          bm.executeTurn({ type: 'switch', gemIndex: alive });
          continue;
        }
        if (bm.activeEnemyGem.isFainted) break;

        const move = bm.activePlayerGem.moves[0];
        const events = bm.executeTurn({ type: 'fight', moveId: move });
        expect(events.length).toBeGreaterThan(0);

        if (events.some(e => e.type === 'battle_end')) break;
      }
    });
  });
});
