import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('EncounterManager', () => {
  let origRandom;

  beforeEach(() => { origRandom = Math.random; });
  afterEach(() => { Math.random = origRandom; });

  it('returns null for unknown route', () => {
    expect(EncounterManager.check('nonexistent_route')).toBeNull();
  });

  it('returns null when random exceeds encounter rate', () => {
    Math.random = () => 0.99; // Above encounter rate
    expect(EncounterManager.check('hotel')).toBeNull();
  });

  it('returns a BugInstance when encounter triggers', () => {
    Math.random = () => 0.01; // Below encounter rate
    const bug = EncounterManager.check('hotel');
    expect(bug).not.toBeNull();
    expect(bug).toBeInstanceOf(BugInstance);
    expect(bug.level).toBeGreaterThanOrEqual(3);
    expect(bug.level).toBeLessThanOrEqual(6);
  });

  it('returns bugs within the correct level range for venue', () => {
    let callCount = 0;
    Math.random = () => {
      callCount++;
      if (callCount === 1) return 0.01; // Trigger encounter
      return 0.01; // Low roll for weighted random + level
    };
    const bug = EncounterManager.check('venue');
    expect(bug).not.toBeNull();
    expect(bug.level).toBeGreaterThanOrEqual(19);
    expect(bug.level).toBeLessThanOrEqual(24);
  });
});
