import { describe, it, expect } from 'vitest';

describe('TypeChart', () => {
  it('returns super effective for known pairs', () => {
    expect(TypeChart.getEffectiveness('security', 'security')).toBe(2);
    expect(TypeChart.getEffectiveness('security', 'rails')).toBe(2);
    expect(TypeChart.getEffectiveness('testing', 'testing')).toBe(2);
    expect(TypeChart.getEffectiveness('runtime', 'frontend')).toBe(2);
  });

  it('returns not very effective for known pairs', () => {
    expect(TypeChart.getEffectiveness('security', 'performance')).toBe(1);
    expect(TypeChart.getEffectiveness('rails', 'security')).toBe(0.5);
    expect(TypeChart.getEffectiveness('runtime', 'performance')).toBe(0.5);
  });

  it('returns neutral for neutral pairs', () => {
    expect(TypeChart.getEffectiveness('security', 'performance')).toBe(1);
    expect(TypeChart.getEffectiveness('testing', 'security')).toBe(1);
  });

  it('covers all 36 type combinations', () => {
    for (const atk of TYPES) {
      for (const def of TYPES) {
        const eff = TypeChart.getEffectiveness(atk, def);
        expect([0.5, 1, 2]).toContain(eff);
      }
    }
  });

  it('getEffectivenessText returns correct strings', () => {
    expect(TypeChart.getEffectivenessText(2)).toBe("It's super effective!");
    expect(TypeChart.getEffectivenessText(0.5)).toBe("It's not very effective...");
    expect(TypeChart.getEffectivenessText(1)).toBeNull();
  });
});
