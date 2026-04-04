class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Semi-transparent overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.3);

    // Menu box
    this.menu = new MenuBox(this, GAME_WIDTH - 80, 8, [
      { text: 'PARTY', value: 'party' },
      { text: 'SAVE', value: 'save' },
      { text: 'CLOSE', value: 'close' }
    ], {
      itemWidth: 60,
      depth: 1000,
      onSelect: (opt) => this.handleOption(opt.value),
      onCancel: () => this.closeMenu()
    });

    // Show player info
    this.add.text(8, 8, `Badges: ${ProgressManager.badgeCount()}`, {
      ...TEXT_STYLE_WHITE
    }).setDepth(1000);
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
      starterChosen: overworld.starterChosen
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
