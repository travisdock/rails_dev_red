class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111122).setDepth(-2);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'BLASTOFF RAILS', {
      ...TEXT_STYLE, fontSize: '10px', color: '#ff6633'
    }).setOrigin(0.5).setDepth(1);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 48, 'The Game', {
      ...TEXT_STYLE, color: '#ff9966'
    }).setOrigin(0.5).setDepth(1);

    // Logo (background, centered)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'logo').setDisplaySize(176, 176).setAlpha(0.4).setDepth(-1);

    // Save slots
    const menuY = 85;
    this.menuItems = [];
    this.selectedIndex = 0;

    for (let slot = 1; slot <= 3; slot++) {
      const info = SaveManager.slotInfo(slot);
      if (info) {
        this.menuItems.push({ text: info.gemName, date: info.savedDate, playtime: info.playtime, action: 'continue', slot });
      } else {
        this.menuItems.push({ text: 'New Game Here', date: null, action: 'new', slot });
      }
    }

    this.menuTexts = this.menuItems.map((item, i) => {
      const y = menuY + i * 20;
      const nameText = this.add.text(GAME_WIDTH / 2, y, item.text, {
        ...TEXT_STYLE_WHITE
      }).setOrigin(0.5).setDepth(1);
      if (item.date) {
        this.add.text(GAME_WIDTH / 2, y + 8, `${item.date}  ${item.playtime}`, {
          fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#bbbbbb'
        }).setOrigin(0.5).setDepth(1);
      }
      return nameText;
    });

    // Cursor
    this.cursor = this.add.text(GAME_WIDTH / 2 - 60, menuY, '>', {
      ...TEXT_STYLE_WHITE
    }).setOrigin(0.5);

    // Blinking prompt
    this.tweens.add({
      targets: this.cursor,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Version text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 5, 'v1.0.2', {
      fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#555555'
    }).setOrigin(0.5).setDepth(1);

    // Menu music
    this.menuMusic = this.sound.add('music-menu', { loop: true, volume: 0.3 });
    this.menuMusic.play();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey('Z');
    this.keyEnter = this.input.keyboard.addKey('ENTER');
    this.keyC = this.input.keyboard.addKey('C');
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.menuItems.length - 1);
      this.updateCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateCursor();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      this.selectOption();
    }

    if (this.keyC.isDown && this.input.keyboard.checkDown(this.keyC)) {
      const item = this.menuItems[this.selectedIndex];
      if (item.action === 'continue') {
        SaveManager.deleteSave(item.slot);
        this.scene.restart();
      }
    }
  }

  updateCursor() {
    const menuY = 85;
    this.cursor.setY(menuY + this.selectedIndex * 20);
  }

  selectOption() {
    if (this.menuMusic) {
      this.menuMusic.stop();
      this.menuMusic = null;
    }
    const item = this.menuItems[this.selectedIndex];
    SaveManager.activeSlot = item.slot;

    if (item.action === 'continue') {
      const saveData = SaveManager.load();
      if (saveData) {
        SaveManager.startSession(saveData.playtime || 0);
        ProgressManager.init(saveData);
        PartyManager.init(saveData);
        this.scene.start('OverworldScene', {
          mapKey: saveData.player.position.map,
          playerX: saveData.player.position.x,
          playerY: saveData.player.position.y,
          facing: saveData.player.position.facing,
          starterChosen: saveData.player.starterChosen,
          playerSpriteKey: saveData.player.spriteKey || 'player',
          spriteChosen: !!saveData.player.spriteKey
        });
      }
    } else {
      // New game
      SaveManager.startSession(0);
      ProgressManager.init(null);
      PartyManager.init(null);
      this.scene.start('IntroScene');
    }
  }
}
