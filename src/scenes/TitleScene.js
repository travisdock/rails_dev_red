class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111122);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'BLASTOFF RAILS', {
      ...TEXT_STYLE, fontSize: '10px', color: '#ff6633'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 48, 'The Game', {
      ...TEXT_STYLE, color: '#ff9966'
    }).setOrigin(0.5);

    // Decorative gem icon (diamond shape)
    const gfx = this.add.graphics();
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillPoints([
      { x: GAME_WIDTH / 2, y: 65 },
      { x: GAME_WIDTH / 2 + 15, y: 80 },
      { x: GAME_WIDTH / 2, y: 95 },
      { x: GAME_WIDTH / 2 - 15, y: 80 }
    ], true);
    gfx.fillStyle(0xff6666, 0.5);
    gfx.fillPoints([
      { x: GAME_WIDTH / 2, y: 65 },
      { x: GAME_WIDTH / 2 + 15, y: 80 },
      { x: GAME_WIDTH / 2, y: 80 }
    ], true);

    // Menu options
    const menuY = 110;
    this.menuItems = [];
    this.selectedIndex = 0;

    const hasSave = SaveManager.hasSave();

    if (hasSave) {
      this.menuItems.push({ text: 'CONTINUE', action: 'continue' });
    }
    this.menuItems.push({ text: 'NEW GAME', action: 'new' });

    this.menuTexts = this.menuItems.map((item, i) => {
      return this.add.text(GAME_WIDTH / 2, menuY + i * 14, item.text, {
        ...TEXT_STYLE_WHITE
      }).setOrigin(0.5);
    });

    // Cursor
    this.cursor = this.add.text(GAME_WIDTH / 2 - 40, menuY, '>', {
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
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, 'v0.1.0', {
      ...TEXT_STYLE, fontSize: '6px', color: '#555555'
    }).setOrigin(0.5);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey('Z');
    this.keyEnter = this.input.keyboard.addKey('ENTER');
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
  }

  updateCursor() {
    const menuY = 110;
    this.cursor.setY(menuY + this.selectedIndex * 14);
  }

  selectOption() {
    const action = this.menuItems[this.selectedIndex].action;

    if (action === 'continue') {
      const saveData = SaveManager.load();
      if (saveData) {
        ProgressManager.init(saveData);
        PartyManager.init(saveData);
        this.scene.start('OverworldScene', {
          mapKey: saveData.player.position.map,
          playerX: saveData.player.position.x,
          playerY: saveData.player.position.y,
          facing: saveData.player.position.facing,
          starterChosen: saveData.player.starterChosen
        });
      }
    } else {
      // New game
      ProgressManager.init(null);
      PartyManager.init(null);
      this.scene.start('OverworldScene', {
        mapKey: 'hotel',
        playerX: 1,
        playerY: 17,
        facing: 'up',
        starterChosen: false
      });
    }
  }
}
