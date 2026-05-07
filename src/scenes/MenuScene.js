class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Semi-transparent overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.3);

    this.buildMenu(0);

    // Show player info
    this.add.text(8, 8, `Passes: ${ProgressManager.badgeCount()}`, {
      ...TEXT_STYLE_WHITE
    }).setDepth(1000);
  }

  buildMenu(initialIndex) {
    const peacefulLabel = ProgressManager.peacefulMode ? 'PEACEFUL ON' : 'PEACEFUL OFF';
    this.menu = new MenuBox(this, GAME_WIDTH - 130, 8, [
      { text: 'PARTY', value: 'party' },
      { text: 'SAVE', value: 'save' },
      { text: peacefulLabel, value: 'peaceful' },
      { text: 'CLOSE', value: 'close' }
    ], {
      itemWidth: 110,
      depth: 1000,
      onSelect: (opt) => this.handleOption(opt.value),
      onCancel: () => this.closeMenu()
    });
    if (initialIndex && initialIndex < this.menu.options.length) {
      this.menu.selectedIndex = initialIndex;
      this.menu.updateCursor();
    }
  }

  handleOption(option) {
    switch (option) {
      case 'party':
        this.menu.destroy();
        this.scene.stop();
        this.scene.launch('PartyScene');
        break;
      case 'save':
        this.saveGame();
        break;
      case 'peaceful':
        ProgressManager.setPeacefulMode(!ProgressManager.peacefulMode);
        const previousIndex = this.menu.selectedIndex;
        this.menu.destroy();
        this.buildMenu(previousIndex);
        break;
      case 'close':
        this.closeMenu();
        break;
    }
  }

  saveGame() {
    const overworld = this.scene.get('OverworldScene');
    const success = SaveManager.save({
      playerName: 'Rubyist',
      position: {
        map: overworld.mapKey,
        x: overworld.player.tileX,
        y: overworld.player.tileY,
        facing: overworld.player.facing
      },
      badges: ProgressManager.badges,
      party: PartyManager.party,
      trainersDefeated: ProgressManager.trainersDefeated,
      gymsCompleted: ProgressManager.gymsCompleted,
      storySeen: ProgressManager.storySeen,
      peacefulMode: ProgressManager.peacefulMode,
      starterChosen: overworld.starterChosen,
      spriteKey: overworld.playerSpriteKey
    });

    this.menu.destroy();
    const msg = success ? 'Game saved!' : 'Save failed!';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, msg, {
      ...TEXT_STYLE_WHITE, fontSize: '10px',
      backgroundColor: '#333333', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(1100);

    this.time.delayedCall(1000, () => this.closeMenu());
  }

  closeMenu() {
    const overworld = this.scene.get('OverworldScene');
    overworld.inMenu = false;
    overworld.player.unfreeze();
    this.scene.resume('OverworldScene');
    this.scene.stop();
  }

  update() {
    if (this.menu && this.menu.active) {
      this.menu.update();
    }
  }
}
