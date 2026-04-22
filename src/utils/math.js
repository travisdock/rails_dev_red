const GameMath = {
  // Pokemon Gen 1-style damage formula
  calculateDamage(level, power, attack, defense, stab, typeEffectiveness) {
    const baseDamage = Math.floor(((2 * level / 5 + 2) * power * attack / defense) / 50) + 2;
    const random = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.floor(baseDamage * stab * typeEffectiveness * random));
  },

  // Cubic XP curve
  xpForLevel(level) {
    return Math.floor(level * level * level);
  },

  // XP gained from defeating an enemy
  xpGain(baseXP, enemyLevel) {
    return Math.floor((baseXP * enemyLevel) / 6);
  },

  // Calculate stat at a given level from base stat
  calcStat(baseStat, level, isHP) {
    if (isHP) {
      return Math.floor(((baseStat * 2) * level) / 100) + level + 10;
    }
    return Math.floor(((baseStat * 2) * level) / 100) + 5;
  },

  // Apply stat stage modifier
  applyStageMod(stat, stage) {
    const clamped = Math.max(-6, Math.min(6, stage));
    return Math.floor(stat * STAT_STAGE_MULTIPLIERS[String(clamped)]);
  },

  // Weighted random selection from an array of { weight, ... } objects
  weightedRandom(entries) {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  },

  // Random integer in range [min, max] inclusive
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Run escape chance (Pokemon-style)
  canEscape(playerSpeed, enemySpeed, attempts) {
    const odds = Math.floor((playerSpeed * 128 / (enemySpeed || 1)) + 30 * attempts) % 256;
    return Math.random() * 256 < odds;
  }
};
