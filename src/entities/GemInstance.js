class GemInstance {
  constructor(gemId, level, gemData) {
    const def = gemData || window.GAME_DATA.gems[gemId];
    this.gemId = gemId;
    this.name = def.name;
    this.type = def.type;
    this.level = level;
    this.xp = GameMath.xpForLevel(level);
    this.baseStats = { ...def.baseStats };

    // Calculate actual stats from base stats and level
    this.maxHp = GameMath.calcStat(def.baseStats.hp, level, true);
    this.currentHp = this.maxHp;
    this.stats = {
      attack: GameMath.calcStat(def.baseStats.attack, level, false),
      defense: GameMath.calcStat(def.baseStats.defense, level, false),
      spAttack: GameMath.calcStat(def.baseStats.spAttack, level, false),
      spDefense: GameMath.calcStat(def.baseStats.spDefense, level, false),
      speed: GameMath.calcStat(def.baseStats.speed, level, false)
    };

    // Learn moves up to current level
    this.moves = [];
    this.pp = [];
    const learnset = def.learnset || [];
    for (const entry of learnset) {
      if (entry.level <= level) {
        if (this.moves.length < MAX_MOVES) {
          this.moves.push(entry.move);
          const moveDef = window.GAME_DATA.moves[entry.move];
          this.pp.push(moveDef ? moveDef.pp : 10);
        } else {
          // Replace oldest move if at max
          this.moves.shift();
          this.pp.shift();
          this.moves.push(entry.move);
          const moveDef = window.GAME_DATA.moves[entry.move];
          this.pp.push(moveDef ? moveDef.pp : 10);
        }
      }
    }

    this.nickname = null;
    this.baseXP = def.baseXP || 64;
  }

  get isFainted() {
    return this.currentHp <= 0;
  }

  takeDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp <= 0;
  }

  heal(amount) {
    this.currentHp = Math.min(this.maxHp, this.currentHp + (amount || this.maxHp));
  }

  fullHeal() {
    this.currentHp = this.maxHp;
    const gemDef = window.GAME_DATA.gems[this.gemId];
    const learnset = gemDef ? gemDef.learnset : [];
    for (let i = 0; i < this.moves.length; i++) {
      const moveDef = window.GAME_DATA.moves[this.moves[i]];
      this.pp[i] = moveDef ? moveDef.pp : 10;
    }
  }

  addXP(amount) {
    this.xp += amount;
    const results = [];
    while (this.xp >= GameMath.xpForLevel(this.level + 1)) {
      this.level++;
      const oldMaxHp = this.maxHp;
      this.recalcStats();
      // Heal the HP difference from level up
      this.currentHp += (this.maxHp - oldMaxHp);

      const newMove = this.checkNewMove();
      results.push({ level: this.level, newMove });
    }
    return results; // Array of level-up events
  }

  recalcStats() {
    const def = window.GAME_DATA.gems[this.gemId];
    this.maxHp = GameMath.calcStat(def.baseStats.hp, this.level, true);
    this.stats = {
      attack: GameMath.calcStat(def.baseStats.attack, this.level, false),
      defense: GameMath.calcStat(def.baseStats.defense, this.level, false),
      spAttack: GameMath.calcStat(def.baseStats.spAttack, this.level, false),
      spDefense: GameMath.calcStat(def.baseStats.spDefense, this.level, false),
      speed: GameMath.calcStat(def.baseStats.speed, this.level, false)
    };
  }

  checkNewMove() {
    const def = window.GAME_DATA.gems[this.gemId];
    if (!def || !def.learnset) return null;
    const entry = def.learnset.find(e => e.level === this.level);
    if (!entry) return null;
    if (this.moves.includes(entry.move)) return null;
    return entry.move;
  }

  learnMove(moveId, slot) {
    const moveDef = window.GAME_DATA.moves[moveId];
    if (slot !== undefined && slot < this.moves.length) {
      this.moves[slot] = moveId;
      this.pp[slot] = moveDef ? moveDef.pp : 10;
    } else if (this.moves.length < MAX_MOVES) {
      this.moves.push(moveId);
      this.pp.push(moveDef ? moveDef.pp : 10);
    }
  }

  xpToNextLevel() {
    return GameMath.xpForLevel(this.level + 1) - this.xp;
  }

  // Serialize for save data
  serialize() {
    return {
      gemId: this.gemId,
      nickname: this.nickname,
      level: this.level,
      xp: this.xp,
      currentHp: this.currentHp,
      moves: [...this.moves],
      pp: [...this.pp]
    };
  }

  // Restore from save data
  static deserialize(data) {
    const gem = new GemInstance(data.gemId, data.level);
    gem.nickname = data.nickname;
    gem.xp = data.xp;
    gem.currentHp = data.currentHp;
    gem.moves = [...data.moves];
    gem.pp = [...data.pp];
    return gem;
  }
}

// Create a bug instance for wild encounters (same interface as GemInstance)
class BugInstance {
  constructor(bugId, level) {
    const def = window.GAME_DATA.bugs[bugId];
    this.bugId = bugId;
    this.gemId = bugId; // For compatibility with battle system
    this.name = def.name;
    this.type = def.type;
    this.level = level;
    this.isBug = true;

    this.maxHp = GameMath.calcStat(def.baseStats.hp, level, true);
    this.currentHp = this.maxHp;
    this.stats = {
      attack: GameMath.calcStat(def.baseStats.attack, level, false),
      defense: GameMath.calcStat(def.baseStats.defense, level, false),
      spAttack: GameMath.calcStat(def.baseStats.spAttack, level, false),
      spDefense: GameMath.calcStat(def.baseStats.spDefense, level, false),
      speed: GameMath.calcStat(def.baseStats.speed, level, false)
    };

    this.moves = [...(def.moves || [])];
    this.pp = this.moves.map(m => {
      const moveDef = window.GAME_DATA.moves[m];
      return moveDef ? moveDef.pp : 10;
    });

    this.baseXP = def.baseXP || 50;
  }

  get isFainted() {
    return this.currentHp <= 0;
  }

  takeDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp <= 0;
  }
}
