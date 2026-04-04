import { describe, it, expect, beforeEach } from 'vitest';

describe('PartyManager', () => {
  beforeEach(() => {
    PartyManager.party = [];
  });

  it('adds gems up to MAX_PARTY_SIZE', () => {
    for (let i = 0; i < MAX_PARTY_SIZE; i++) {
      expect(PartyManager.addGem(new GemInstance('devise', 5))).toBe(true);
    }
    expect(PartyManager.party.length).toBe(MAX_PARTY_SIZE);
    expect(PartyManager.addGem(new GemInstance('devise', 5))).toBe(false);
  });

  it('isFull returns correctly', () => {
    expect(PartyManager.isFull()).toBe(false);
    for (let i = 0; i < MAX_PARTY_SIZE; i++) {
      PartyManager.addGem(new GemInstance('devise', 5));
    }
    expect(PartyManager.isFull()).toBe(true);
  });

  it('getLeadGem returns first non-fainted', () => {
    const gem1 = new GemInstance('devise', 5);
    const gem2 = new GemInstance('rspec', 5);
    PartyManager.addGem(gem1);
    PartyManager.addGem(gem2);
    gem1.currentHp = 0;
    expect(PartyManager.getLeadGem()).toBe(gem2);
  });

  it('isAllFainted detects full wipe', () => {
    const gem1 = new GemInstance('devise', 5);
    const gem2 = new GemInstance('rspec', 5);
    PartyManager.addGem(gem1);
    PartyManager.addGem(gem2);
    expect(PartyManager.isAllFainted()).toBe(false);
    gem1.currentHp = 0;
    gem2.currentHp = 0;
    expect(PartyManager.isAllFainted()).toBe(true);
  });

  it('healAll restores all gems', () => {
    const gem = new GemInstance('devise', 10);
    PartyManager.addGem(gem);
    gem.takeDamage(10);
    gem.pp[0] = 0;
    PartyManager.healAll();
    expect(gem.currentHp).toBe(gem.maxHp);
    expect(gem.pp[0]).toBeGreaterThan(0);
  });

  it('swapGems swaps positions', () => {
    const gem1 = new GemInstance('devise', 5);
    const gem2 = new GemInstance('rspec', 5);
    PartyManager.addGem(gem1);
    PartyManager.addGem(gem2);
    PartyManager.swapGems(0, 1);
    expect(PartyManager.party[0]).toBe(gem2);
    expect(PartyManager.party[1]).toBe(gem1);
  });
});

describe('ProgressManager', () => {
  beforeEach(() => {
    ProgressManager.init(null);
  });

  it('starts with no badges', () => {
    expect(ProgressManager.badgeCount()).toBe(0);
  });

  it('adds and checks badges', () => {
    ProgressManager.addBadge('ssl_badge');
    expect(ProgressManager.hasBadge('ssl_badge')).toBe(true);
    expect(ProgressManager.hasBadge('benchmark_badge')).toBe(false);
    expect(ProgressManager.badgeCount()).toBe(1);
  });

  it('does not duplicate badges', () => {
    ProgressManager.addBadge('ssl_badge');
    ProgressManager.addBadge('ssl_badge');
    expect(ProgressManager.badgeCount()).toBe(1);
  });

  it('tracks defeated trainers', () => {
    expect(ProgressManager.isTrainerDefeated('junior_dev_01')).toBe(false);
    ProgressManager.defeatTrainer('junior_dev_01');
    expect(ProgressManager.isTrainerDefeated('junior_dev_01')).toBe(true);
  });

  it('tracks story flags', () => {
    expect(ProgressManager.hasSeenStory('intro')).toBe(false);
    ProgressManager.seeStory('intro');
    expect(ProgressManager.hasSeenStory('intro')).toBe(true);
  });
});
