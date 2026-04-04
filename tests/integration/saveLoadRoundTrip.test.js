import { describe, it, expect, beforeEach } from 'vitest';

describe('Save/Load Round Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips full game state', () => {
    const party = [
      new GemInstance('devise', 12),
      new GemInstance('rspec', 8),
    ];
    party[0].takeDamage(5);
    party[0].nickname = 'AuthBot';

    const gameState = {
      playerName: 'Tester',
      position: { map: 'staging-springs', x: 10, y: 8, facing: 'up' },
      badges: ['ssl_badge', 'benchmark_badge'],
      party: party,
      trainersDefeated: ['junior_dev_01', 'mid_dev_01'],
      gymsCompleted: ['sarah_security'],
      storySeen: ['intro'],
      starterChosen: true
    };

    SaveManager.save(gameState);
    expect(SaveManager.hasSave()).toBe(true);

    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    expect(loaded.player.name).toBe('Tester');
    expect(loaded.player.position.map).toBe('staging-springs');
    expect(loaded.player.badges).toEqual(['ssl_badge', 'benchmark_badge']);
    expect(loaded.player.starterChosen).toBe(true);
    expect(loaded.flags.trainersDefeated).toContain('junior_dev_01');
    expect(loaded.flags.gymsCompleted).toContain('sarah_security');
    expect(loaded.flags.storySeen).toContain('intro');

    // Deserialize party and check
    const restoredParty = loaded.player.party.map(d => GemInstance.deserialize(d));
    expect(restoredParty[0].name).toBe('Devise');
    expect(restoredParty[0].level).toBe(12);
    expect(restoredParty[0].currentHp).toBe(party[0].currentHp);
    expect(restoredParty[0].nickname).toBe('AuthBot');
    expect(restoredParty[1].name).toBe('RSpec');
  });

  it('returns null for no save', () => {
    expect(SaveManager.load()).toBeNull();
  });

  it('returns null for version mismatch', () => {
    localStorage.setItem('rails_quest_save', JSON.stringify({ version: 999 }));
    expect(SaveManager.load()).toBeNull();
  });

  it('deleteSave removes saved data', () => {
    SaveManager.save({
      playerName: 'Test', position: { map: 'localhost', x: 0, y: 0, facing: 'down' },
      badges: [], party: [], trainersDefeated: [], gymsCompleted: [], storySeen: [], starterChosen: false
    });
    expect(SaveManager.hasSave()).toBe(true);
    SaveManager.deleteSave();
    expect(SaveManager.hasSave()).toBe(false);
  });
});
