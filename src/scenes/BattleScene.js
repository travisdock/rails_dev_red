class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.playerParty = data.playerParty;
    this.enemyParty = data.enemyParty;
    this.isWild = data.isWild;
    this.trainerData = data.trainerData;
  }

  log(action, detail) {
    const entry = {
      t: Date.now() - this._logStart,
      action,
      ...detail
    };
    window.BATTLE_LOG.push(entry);
    console.log(`[battle +${entry.t}ms] ${action}`, detail || '');
  }

  create() {
    this._logStart = Date.now();
    window.BATTLE_LOG = [];
    this.log('battle_start', {
      isWild: this.isWild,
      trainer: this.trainerData?.name,
      player: this.playerParty.map(g => `${g.name} Lv${g.level} HP:${g.currentHp}/${g.maxHp}`),
      enemy: this.enemyParty.map(g => `${g.name} Lv${g.level} HP:${g.currentHp}/${g.maxHp}`)
    });

    this.battleManager = new BattleManager();
    this.battleManager.init(this.playerParty, this.enemyParty, this.isWild, this.trainerData);

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xeeeedd);

    // Battle ground lines
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0xccbbaa);
    gfx.strokeEllipse(170, 50, 100, 24);  // Enemy platform
    gfx.strokeEllipse(65, 100, 100, 24);  // Player platform

    // Enemy sprite
    const enemy = this.battleManager.activeEnemyGem;
    const enemyColor = TYPE_COLORS[enemy.type] || 0xcc4444;
    this.enemySprite = this.add.rectangle(175, 38, 24, 24, enemyColor)
      .setStrokeStyle(2, 0x333333);
    this.add.text(175, 38, enemy.isBug ? 'BUG' : 'GEM', {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(1);

    // Player sprite (back view - slightly larger)
    const player = this.battleManager.activePlayerGem;
    const playerColor = TYPE_COLORS[player.type] || 0x44cc44;
    this.playerSprite = this.add.rectangle(60, 88, 28, 28, playerColor)
      .setStrokeStyle(2, 0x333333);
    this.add.text(60, 88, player.name.substring(0, 3).toUpperCase(), {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(1);

    // HUD
    this.hud = new BattleHUD(this);
    this.hud.createEnemyHUD(enemy);
    this.hud.createPlayerHUD(player);

    // Message box at bottom
    this.messageBox = new TextBox(this, 4, GAME_HEIGHT - 42, GAME_WIDTH - 8, 38);
    this.messageBox.create().setVisible(true);
    this.messageBox.depth = 800;
    this.messageBox.bg.setDepth(800);
    this.messageBox.textObj.setDepth(801);

    // State machine
    this.battleState = 'intro';
    this.eventQueue = [];
    this.currentMenu = null;
    this.battleOver = false;
    this._waitingForInput = false;
    this._messageCallback = null;

    // Intro message
    const introMsg = this.isWild
      ? `A wild ${enemy.name} appeared!`
      : `${this.trainerData.name} wants to battle!`;
    this.showMessage(introMsg, () => {
      this.showActionMenu();
    });

    // Input
    this.keyZ = this.input.keyboard.addKey('Z');
    this.keyX = this.input.keyboard.addKey('X');
    this.keyEnter = this.input.keyboard.addKey('ENTER');
  }

  showMessage(text, callback) {
    this.battleState = 'processing';
    this.messageBox.setText(text).setVisible(true);
    if (this.currentMenu) {
      this.currentMenu.destroy();
      this.currentMenu = null;
    }

    // Wait for key press to advance
    this._messageCallback = callback;
    this._waitingForInput = true;
  }

  showActionMenu() {
    this.battleState = 'action_select';
    this.messageBox.setText(`What will ${this.battleManager.activePlayerGem.name} do?`);

    if (this.currentMenu) this.currentMenu.destroy();

    const options = [
      { text: 'FIGHT', value: 'fight' },
      { text: 'GEMS', value: 'gems' }
    ];
    if (this.isWild) {
      options.push({ text: 'RUN', value: 'run' });
    }

    this.currentMenu = new MenuBox(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, options, {
      columns: 2,
      itemWidth: 55,
      depth: 900,
      onSelect: (opt) => this.handleAction(opt.value),
      onCancel: () => {} // Can't cancel action menu
    });
  }

  showMoveMenu() {
    this.battleState = 'move_select';
    const gem = this.battleManager.activePlayerGem;
    const moves = gem.moves.map((moveId, i) => {
      const moveDef = window.GAME_DATA.moves[moveId];
      return {
        text: `${moveDef.name} ${gem.pp[i]}/${moveDef.pp}`,
        value: moveId
      };
    });

    if (this.currentMenu) this.currentMenu.destroy();

    this.currentMenu = new MenuBox(this, 4, GAME_HEIGHT - 42, moves, {
      columns: 2,
      itemWidth: 110,
      depth: 900,
      onSelect: (opt) => this.handleMove(opt.value),
      onCancel: () => this.showActionMenu()
    });

    this.messageBox.setVisible(false);
  }

  showGemMenu() {
    this.battleState = 'gem_select';
    const gems = this.playerParty.map((gem, i) => ({
      text: `${gem.name} ${gem.isFainted ? '(KO)' : `HP:${gem.currentHp}/${gem.maxHp}`}`,
      value: i
    }));

    if (this.currentMenu) this.currentMenu.destroy();

    this.currentMenu = new MenuBox(this, 4, 52, gems, {
      itemWidth: 180,
      depth: 900,
      onSelect: (opt) => {
        const gem = this.playerParty[opt.value];
        if (gem.isFainted) {
          // Can't select fainted gem
          return;
        }
        if (opt.value === this.battleManager.playerGemIndex) {
          // Already active
          return;
        }
        this.handleSwitch(opt.value);
      },
      onCancel: () => this.showActionMenu()
    });

    this.messageBox.setText('Choose a gem: (X to cancel)').setVisible(true);
  }

  handleAction(action) {
    if (action === 'fight') {
      this.showMoveMenu();
    } else if (action === 'gems') {
      this.showGemMenu();
    } else if (action === 'run') {
      this.processEvents(this.battleManager.executeTurn({ type: 'run' }));
    }
  }

  handleMove(moveId) {
    // Check PP
    const gem = this.battleManager.activePlayerGem;
    const moveIndex = gem.moves.indexOf(moveId);
    if (moveIndex >= 0 && gem.pp[moveIndex] <= 0) {
      this.showMessage('No PP left for this move!', () => this.showMoveMenu());
      return;
    }
    this.processEvents(this.battleManager.executeTurn({ type: 'fight', moveId }));
  }

  handleSwitch(gemIndex) {
    this.processEvents(this.battleManager.switchPlayerGem(gemIndex));
  }

  processEvents(events) {
    this._waitingForInput = false;
    this.eventQueue = [...events];
    this.log('processEvents', { count: events.length, types: events.map(e => e.type) });
    this.drainQueue();
  }

  // Process events sequentially using a simple delay chain.
  // Each event calls drainQueue() when done, either immediately or after a delay.
  drainQueue() {
    if (this.eventQueue.length === 0) {
      if (this.battleOver) {
        this.log('drainQueue', { status: 'empty, battle over' });
        return;
      }
      this.log('drainQueue', { status: 'empty, showing action menu' });
      this.showActionMenu();
      return;
    }

    const event = this.eventQueue.shift();
    this.log('drainQueue', { event: event.type, text: event.text, remaining: this.eventQueue.length });
    const next = () => this.drainQueue();
    const nextAfter = (ms) => this.time.delayedCall(ms, next);

    switch (event.type) {
      case 'message':
        this.messageBox.setText(event.text).setVisible(true);
        if (this.currentMenu) {
          this.currentMenu.destroy();
          this.currentMenu = null;
        }
        // If more events follow, auto-advance; otherwise wait for input
        if (this.eventQueue.length > 0) {
          this.log('message_auto', { text: event.text, remaining: this.eventQueue.length });
          nextAfter(800);
        } else {
          this.log('message_wait', { text: event.text });
          this._messageCallback = next;
          this._waitingForInput = true;
        }
        break;

      case 'damage': {
        const side = event.side;
        const targetWidth = Math.max(0.1, (event.currentHp / event.maxHp) * 72);
        const hud = side === 'player' ? this.hud.playerHUD : this.hud.enemyHUD;

        // Shake the damaged sprite
        const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
        if (sprite && sprite.active) {
          this.tweens.add({ targets: sprite, x: sprite.x + 3, duration: 50, yoyo: true, repeat: 3 });
        }

        // Animate HP bar, then advance
        if (hud && hud.hpBar && hud.hpBar.active) {
          this.log('damage_tween_start', { side, from: Math.round(hud.hpBar.displayWidth), to: Math.round(targetWidth) });
          this.tweens.add({
            targets: hud.hpBar,
            displayWidth: targetWidth,
            duration: 400,
            ease: 'Linear',
            onUpdate: () => {
              if (hud.hpBar && hud.hpBar.active) {
                const r = hud.hpBar.displayWidth / hud.barWidth;
                hud.hpBar.setFillStyle(this.hud.hpColor(r));
              }
            },
            onComplete: () => {
              this.log('damage_tween_done', { side, hp: `${event.currentHp}/${event.maxHp}` });
              if (hud.showHP && hud.hpText && hud.hpText.active) {
                hud.hpText.setText(`${event.currentHp}/${event.maxHp}`);
              }
              nextAfter(300);
            }
          });
        } else {
          this.log('damage_no_hud', { side });
          nextAfter(300);
        }
        break;
      }

      case 'faint': {
        const sprite = event.side === 'player' ? this.playerSprite : this.enemySprite;
        if (sprite && sprite.active) {
          this.tweens.add({
            targets: sprite, alpha: 0, y: sprite.y + 20,
            duration: 500, onComplete: next
          });
        } else {
          next();
        }
        break;
      }

      case 'send_out': {
        const gem = event.gem;
        const color = TYPE_COLORS[gem.type] || 0xcc4444;
        if (event.side === 'enemy') {
          if (this.enemySprite) this.enemySprite.destroy();
          this.enemySprite = this.add.rectangle(175, 38, 24, 24, color)
            .setStrokeStyle(2, 0x333333).setAlpha(0);
          this.tweens.add({
            targets: this.enemySprite, alpha: 1, duration: 300,
            onComplete: () => { this.hud.updateGemInfo('enemy', gem); next(); }
          });
        } else {
          next();
        }
        break;
      }

      case 'switch': {
        const gem = event.gem;
        const color = TYPE_COLORS[gem.type] || 0x44cc44;
        if (event.side === 'player') {
          if (this.playerSprite) this.playerSprite.destroy();
          this.playerSprite = this.add.rectangle(60, 88, 28, 28, color)
            .setStrokeStyle(2, 0x333333);
          this.add.text(60, 88, gem.name.substring(0, 3).toUpperCase(), {
            fontFamily: 'monospace', fontSize: '6px', color: '#ffffff'
          }).setOrigin(0.5).setDepth(1);
          // Use snapshotted HP (pre-enemy-attack) if available, otherwise live values
          const hp = event.hp !== undefined ? event.hp : gem.currentHp;
          const maxHp = event.maxHp !== undefined ? event.maxHp : gem.maxHp;
          this.hud.updateGemInfo('player', { ...gem, currentHp: hp, maxHp: maxHp });
        }
        next();
        break;
      }

      case 'force_switch':
        this.showGemMenu();
        break;

      case 'level_up':
        this.hud.updateGemInfo('player', event.gem);
        next();
        break;

      case 'money':
        InventoryManager.addMoney(event.amount);
        next();
        break;

      case 'stat_change':
        next();
        break;

      case 'battle_end':
        this.battleOver = true;
        if (this.currentMenu) { this.currentMenu.destroy(); this.currentMenu = null; }
        this.time.delayedCall(500, () => this.endBattle(event.result));
        break;

      default:
        next();
    }
  }

  endBattle(result) {
    const overworldScene = this.scene.get('OverworldScene');
    this.scene.stop();
    overworldScene.handleBattleResult({
      result,
      trainerData: this.trainerData
    });
  }

  update() {
    if (this._waitingForInput) {
      if (Phaser.Input.Keyboard.JustDown(this.keyZ) ||
          Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
        this.log('input_advance', { had_callback: !!this._messageCallback });
        this._waitingForInput = false;
        if (this._messageCallback) {
          const cb = this._messageCallback;
          this._messageCallback = null;
          cb();
        }
      }
      return;
    }

    if (this.currentMenu && this.currentMenu.active) {
      this.currentMenu.update();
    }
  }
}
