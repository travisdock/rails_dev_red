class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'matz').setDepth(-1);

    this.dialogManager = new DialogManager(this);
    this.keyZ = this.input.keyboard.addKey('Z');
    this.keyEnter = this.input.keyboard.addKey('ENTER');

    this.selectedSpriteKey = 'player';

    TransitionFX.fadeIn(this, 400);
    this.time.delayedCall(500, () => this.runIntro());
  }

  runIntro() {
    this.dialogManager.show([
      "Hello there!",
      "My name is Matz. I created the Ruby programming language.",
      "Welcome to Albuquerque!",
      "You're here for Blastoff Rails, the conference that's literally out of this world!",
      "To board the rocket, you'll need to earn Boarding Passes from four elite devs.",
      "But first, let's pick an avatar for you."
    ], () => this.runSpriteSelection(), 'Prof. Matz');
  }

  runSpriteSelection() {
    const npcIds = ['01','02','03','05','06','07','09','10'];
    const options = npcIds.map(id => ({ key: 'npc' + id, label: 'NPC ' + id }))
      .filter(o => this.textures.exists(o.key));

    this._spritePicker = new SpritePicker(this, options, {
      onSelect: (opt) => {
        this._spritePicker.destroy();
        this._spritePicker = null;
        this.selectedSpriteKey = opt.key;
        this.runStarterDialog();
      }
    });
  }

  runStarterDialog() {
    this.dialogManager.show([
      "A fine choice!",
      "Every Rails dev needs a trusty gem.",
      "Choose your first gem!"
    ], () => this.runStarterMenu(), 'Prof. Matz');
  }

  runStarterMenu() {
    const starters = [
      { gemId: 'rspec', name: 'RSpec', type: 'Testing', desc: 'All-around solid' },
      { gemId: 'bullet', name: 'Bullet', type: 'Performance', desc: 'Fast special attacker' },
      { gemId: 'brakeman', name: 'Brakeman', type: 'Security', desc: 'Tough and defensive' }
    ];

    this._starterMenu = new MenuBox(this, GAME_WIDTH / 2 - 92, GAME_HEIGHT / 2 - 30, [
      { text: `${starters[0].name} (${starters[0].type})`, value: starters[0] },
      { text: `${starters[1].name} (${starters[1].type})`, value: starters[1] },
      { text: `${starters[2].name} (${starters[2].type})`, value: starters[2] }
    ], {
      itemWidth: 175,
      depth: 1100,
      onSelect: (opt) => {
        this._starterMenu.destroy();
        this._starterMenu = null;
        const gem = new GemInstance(opt.value.gemId, 5);
        PartyManager.addGem(gem);

        this.dialogManager.show([
          `You chose ${opt.value.name}!`,
          `${opt.value.name} - ${opt.value.desc}.`,
          "Now go explore Albuquerque\nand earn those Boarding Passes!"
        ], () => this.finish(), 'Prof. Matz');
      },
      onCancel: () => {}
    });
  }

  finish() {
    ProgressManager.seeStory('intro');
    TransitionFX.fadeOut(this, 400, () => {
      this.scene.start('OverworldScene', {
        mapKey: 'hotel',
        playerX: 5,
        playerY: 14,
        facing: 'down',
        starterChosen: true,
        playerSpriteKey: this.selectedSpriteKey,
        spriteChosen: true
      });
    });
  }

  update() {
    if (this._spritePicker && this._spritePicker.active) {
      this._spritePicker.update();
      return;
    }
    if (this._starterMenu && this._starterMenu.active) {
      this._starterMenu.update();
      return;
    }
    if (this.dialogManager.isActive) {
      if (Phaser.Input.Keyboard.JustDown(this.keyZ) ||
          Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
        this.dialogManager.advance();
      }
    }
  }
}
