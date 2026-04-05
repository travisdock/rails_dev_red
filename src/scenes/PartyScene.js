class PartyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PartyScene' });
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x222233);

    this.add.text(GAME_WIDTH / 2, 6, 'YOUR GEMS', {
      ...TEXT_STYLE_WHITE
    }).setOrigin(0.5);

    // List party gems
    PartyManager.party.forEach((gem, i) => {
      const y = 18 + i * 22;
      const typeColor = TYPE_COLORS[gem.type] || 0x888888;

      // Type color indicator
      this.add.rectangle(8, y + 8, 6, 16, typeColor);

      // Name and level
      this.add.text(16, y, `${gem.name} v${gem.level}`, {
        ...TEXT_STYLE_WHITE
      });

      // HP bar
      const barX = 16;
      const barY = y + 10;
      const barWidth = 60;
      const hpRatio = gem.currentHp / gem.maxHp;
      this.add.rectangle(barX, barY, barWidth, 3, 0x444444).setOrigin(0, 0);
      const color = hpRatio > 0.5 ? 0x22cc44 : hpRatio > 0.25 ? 0xddaa22 : 0xdd3333;
      this.add.rectangle(barX, barY, barWidth * hpRatio, 3, color).setOrigin(0, 0);

      // HP text
      this.add.text(barX + barWidth + 4, barY - 2, `${gem.currentHp}/${gem.maxHp}`, {
        fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#aaaaaa'
      });

      // Type
      this.add.text(160, y, gem.type.toUpperCase(), {
        fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#aaaaaa'
      });
    });

    // Back prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, 'Press X / B to go back', {
      fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#888888'
    }).setOrigin(0.5);

    this.keyX = this.input.keyboard.addKey('X');
    this.keyBack = this.input.keyboard.addKey('BACKSPACE');
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyX) || Phaser.Input.Keyboard.JustDown(this.keyBack)) {
      const overworld = this.scene.get('OverworldScene');
      overworld.inMenu = false;
      overworld.player.unfreeze();
      this.scene.resume('OverworldScene');
      this.scene.stop();
    }
  }
}
