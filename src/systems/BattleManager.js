class BattleManager {
  constructor() {
    this.playerParty = [];
    this.enemyParty = [];
    this.activePlayerGem = null;
    this.activeEnemyGem = null;
    this.isWild = true;
    this.trainerData = null;
    this.escapeAttempts = 0;
    this.playerGemIndex = 0;
    this.enemyGemIndex = 0;

    // Stat stage tracking for current battle
    this.playerStages = {};
    this.enemyStages = {};
  }

  init(playerParty, enemyParty, isWild, trainerData) {
    this.playerParty = playerParty;
    this.enemyParty = enemyParty;
    this.isWild = isWild;
    this.trainerData = trainerData;
    this.escapeAttempts = 0;
    this.playerGemIndex = 0;
    this.enemyGemIndex = 0;

    // Find first alive gem
    this.activePlayerGem = playerParty.find(g => !g.isFainted) || playerParty[0];
    this.playerGemIndex = playerParty.indexOf(this.activePlayerGem);
    this.activeEnemyGem = enemyParty[0];

    this.resetStages();
  }

  resetStages() {
    this.playerStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    this.enemyStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  }

  // Returns array of battle events (messages + effects)
  executeTurn(playerAction) {
    const events = [];

    if (playerAction.type === 'run') {
      return this.tryRun();
    }

    if (playerAction.type === 'switch') {
      if (!this.activePlayerGem.isFainted) {
        events.push({ type: 'message', text: `Come back, ${this.activePlayerGem.name}!` });
      }
      this.playerGemIndex = playerAction.gemIndex;
      this.activePlayerGem = this.playerParty[playerAction.gemIndex];
      this.resetPlayerStages();
      // Snapshot HP before enemy attacks so the HUD shows correct values on switch-in
      events.push({ type: 'switch', side: 'player', gem: this.activePlayerGem,
        hp: this.activePlayerGem.currentHp, maxHp: this.activePlayerGem.maxHp });
      events.push({ type: 'message', text: `Go, ${this.activePlayerGem.name}!` });

      // Enemy still attacks
      const enemyEvents = this.executeEnemyMove();
      events.push(...enemyEvents);

      // Check if the switched-in gem was KO'd by the enemy's attack
      if (this.activePlayerGem.isFainted) {
        events.push(...this.handleFaint('player'));
      }
      return events;
    }

    // Fight action — use Struggle if out of PP
    const playerMove = playerAction.moveId === '__struggle'
      ? { name: 'Struggle', type: 'testing', category: 'physical', power: 30, accuracy: 100, effect: null, _isStruggle: true }
      : window.GAME_DATA.moves[playerAction.moveId];
    const enemyMove = this.pickEnemyMove();

    // Determine order by speed
    const playerSpeed = GameMath.applyStageMod(this.activePlayerGem.stats.speed, this.playerStages.speed);
    const enemySpeed = GameMath.applyStageMod(this.activeEnemyGem.stats.speed, this.enemyStages.speed);
    const playerFirst = playerSpeed >= enemySpeed;

    if (playerFirst) {
      events.push(...this.executeMove(this.activePlayerGem, this.activeEnemyGem, playerMove, 'player'));
      if (this.activeEnemyGem.isFainted) {
        events.push(...this.handleFaint('enemy'));
        return events;
      }
      events.push(...this.executeMove(this.activeEnemyGem, this.activePlayerGem, enemyMove, 'enemy'));
      if (this.activePlayerGem.isFainted) {
        events.push(...this.handleFaint('player'));
      }
    } else {
      events.push(...this.executeMove(this.activeEnemyGem, this.activePlayerGem, enemyMove, 'enemy'));
      if (this.activePlayerGem.isFainted) {
        events.push(...this.handleFaint('player'));
        return events;
      }
      events.push(...this.executeMove(this.activePlayerGem, this.activeEnemyGem, playerMove, 'player'));
      if (this.activeEnemyGem.isFainted) {
        events.push(...this.handleFaint('enemy'));
      }
    }

    return events;
  }

  executeMove(attacker, defender, move, attackerSide) {
    const events = [];
    events.push({ type: 'message', text: `${attacker.name} used ${move.name}!` });

    // Deduct PP
    const moveIndex = attacker.moves.indexOf(move.id);
    if (moveIndex >= 0 && attacker.pp) {
      attacker.pp[moveIndex] = Math.max(0, attacker.pp[moveIndex] - 1);
    }

    // Check accuracy
    if (Math.random() * 100 > move.accuracy) {
      events.push({ type: 'message', text: `${attacker.name}'s attack missed!` });
      return events;
    }

    if (move.category === 'status') {
      events.push(...this.applyStatusEffect(move, attackerSide));
      return events;
    }

    // Calculate damage
    const isSpecial = move.category === 'special';
    const atkStages = attackerSide === 'player' ? this.playerStages : this.enemyStages;
    const defStages = attackerSide === 'player' ? this.enemyStages : this.playerStages;

    const atkStat = isSpecial
      ? GameMath.applyStageMod(attacker.stats.spAttack, atkStages.spAttack)
      : GameMath.applyStageMod(attacker.stats.attack, atkStages.attack);
    const defStat = isSpecial
      ? GameMath.applyStageMod(defender.stats.spDefense, defStages.spDefense)
      : GameMath.applyStageMod(defender.stats.defense, defStages.defense);

    // STAB
    const stab = (move.type === attacker.type) ? 1.5 : 1.0;

    // Type effectiveness
    let typeEff = TypeChart.getEffectiveness(move.type, defender.type);
    // Same-type moves are super effective when gems attack bugs, but neutral when bugs attack gems
    if (move.type === defender.type && move.type === attacker.type) {
      if (attackerSide === 'player' && defender.isBug) {
        typeEff = Math.max(typeEff, 2);
      } else if (attackerSide === 'enemy' && !defender.isBug) {
        typeEff = 1;
      }
    }
    const effText = TypeChart.getEffectivenessText(typeEff);

    const damage = GameMath.calculateDamage(attacker.level, move.power, atkStat, defStat, stab, typeEff);

    const fainted = defender.takeDamage(damage);

    events.push({ type: 'damage', side: attackerSide === 'player' ? 'enemy' : 'player', damage, currentHp: defender.currentHp, maxHp: defender.maxHp });

    if (effText) {
      events.push({ type: 'message', text: effText });
    }

    // Struggle recoil
    if (move._isStruggle) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp / 4));
      attacker.takeDamage(recoil);
      events.push({ type: 'message', text: `${attacker.name} is hurt by recoil!` });
      events.push({ type: 'damage', side: attackerSide, damage: recoil, currentHp: attacker.currentHp, maxHp: attacker.maxHp });
    }

    return events;
  }

  applyStatusEffect(move, attackerSide) {
    const events = [];
    if (!move.effect) return events;

    const effect = move.effect;
    const targetStages = (effect.target === 'self')
      ? (attackerSide === 'player' ? this.playerStages : this.enemyStages)
      : (attackerSide === 'player' ? this.enemyStages : this.playerStages);

    const targetName = (effect.target === 'self')
      ? (attackerSide === 'player' ? this.activePlayerGem.name : this.activeEnemyGem.name)
      : (attackerSide === 'player' ? this.activeEnemyGem.name : this.activePlayerGem.name);

    const statNames = {
      attack: 'Attack', defense: 'Defense',
      spAttack: 'Sp. Atk', spDefense: 'Sp. Def', speed: 'Speed'
    };

    const oldStage = targetStages[effect.stat];
    targetStages[effect.stat] = Math.max(-6, Math.min(6, oldStage + effect.stages));

    const statName = statNames[effect.stat] || effect.stat;
    if (effect.stages > 0) {
      events.push({ type: 'message', text: `${targetName}'s ${statName} rose!` });
    } else {
      events.push({ type: 'message', text: `${targetName}'s ${statName} fell!` });
    }
    events.push({ type: 'stat_change', side: effect.target === 'self' ? attackerSide : (attackerSide === 'player' ? 'enemy' : 'player') });

    return events;
  }

  pickEnemyMove() {
    // Simple AI: pick a random move that has PP
    const availableMoves = this.activeEnemyGem.moves.filter((m, i) => {
      return this.activeEnemyGem.pp[i] > 0;
    });
    const moveId = availableMoves.length > 0
      ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
      : this.activeEnemyGem.moves[0]; // Struggle equivalent
    return window.GAME_DATA.moves[moveId] || { name: 'Struggle', type: 'testing', category: 'physical', power: 30, accuracy: 100, pp: 99, effect: null, id: 'struggle' };
  }

  executeEnemyMove() {
    const move = this.pickEnemyMove();
    return this.executeMove(this.activeEnemyGem, this.activePlayerGem, move, 'enemy');
  }

  handleFaint(side) {
    const events = [];

    if (side === 'enemy') {
      events.push({ type: 'message', text: `${this.activeEnemyGem.name} was squashed!` });
      events.push({ type: 'faint', side: 'enemy' });

      // Award XP
      const xpGain = GameMath.xpGain(this.activeEnemyGem.baseXP, this.activeEnemyGem.level);
      events.push({ type: 'message', text: `${this.activePlayerGem.name} gained ${xpGain} XP!` });

      const levelUps = this.activePlayerGem.addXP(xpGain);
      for (const lu of levelUps) {
        events.push({ type: 'level_up', gem: this.activePlayerGem, level: lu.level });
        events.push({ type: 'message', text: `${this.activePlayerGem.name} grew to level ${lu.level}!` });
        if (lu.newMove) {
          // Auto-learn if space, otherwise skip for MVP
          if (this.activePlayerGem.moves.length < MAX_MOVES) {
            this.activePlayerGem.learnMove(lu.newMove);
            const moveDef = window.GAME_DATA.moves[lu.newMove];
            events.push({ type: 'message', text: `${this.activePlayerGem.name} learned ${moveDef.name}!` });
          } else {
            // For MVP, auto-replace oldest move
            this.activePlayerGem.learnMove(lu.newMove, 0);
            const moveDef = window.GAME_DATA.moves[lu.newMove];
            events.push({ type: 'message', text: `${this.activePlayerGem.name} learned ${moveDef.name}!` });
          }
        }
      }

      // Check for more enemy gems
      this.enemyGemIndex++;
      if (this.enemyGemIndex < this.enemyParty.length) {
        this.activeEnemyGem = this.enemyParty[this.enemyGemIndex];
        this.resetEnemyStages();
        const nextName = this.trainerData ? this.trainerData.name : 'Wild';
        events.push({ type: 'message', text: `${nextName} sent out ${this.activeEnemyGem.name}!` });
        events.push({ type: 'send_out', side: 'enemy', gem: this.activeEnemyGem });
      } else {
        // Victory!
        if (this.trainerData) {
          events.push({ type: 'message', text: `You defeated ${this.trainerData.name}!` });
        }
        events.push({ type: 'battle_end', result: 'win' });
      }
    } else {
      // Player gem fainted
      events.push({ type: 'message', text: `${this.activePlayerGem.name} crashed!` });
      events.push({ type: 'faint', side: 'player' });

      // Check for more alive gems
      const nextAlive = this.playerParty.find(g => !g.isFainted);
      if (nextAlive) {
        events.push({ type: 'force_switch', side: 'player' });
      } else {
        events.push({ type: 'message', text: 'All your gems have crashed!' });
        events.push({ type: 'message', text: 'You blacked out...' });
        events.push({ type: 'battle_end', result: 'lose' });
      }
    }

    return events;
  }

  tryRun() {
    if (!this.isWild) {
      return [{ type: 'message', text: "Can't run from a trainer battle!" }];
    }
    this.escapeAttempts++;
    const playerSpeed = this.activePlayerGem.stats.speed;
    const enemySpeed = this.activeEnemyGem.stats.speed;

    if (GameMath.canEscape(playerSpeed, enemySpeed, this.escapeAttempts)) {
      return [
        { type: 'message', text: 'Got away safely!' },
        { type: 'battle_end', result: 'run' }
      ];
    }

    const events = [{ type: 'message', text: "Couldn't get away!" }];
    // Enemy attacks
    events.push(...this.executeEnemyMove());
    if (this.activePlayerGem.isFainted) {
      events.push(...this.handleFaint('player'));
    }
    return events;
  }

  switchPlayerGem(index) {
    return this.executeTurn({ type: 'switch', gemIndex: index });
  }

  resetPlayerStages() {
    this.playerStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  }

  resetEnemyStages() {
    this.enemyStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  }
}
