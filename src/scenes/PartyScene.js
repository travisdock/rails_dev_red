class PartyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PartyScene' });
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x222233);

    this.add.text(GAME_WIDTH / 2, 6, 'YOUR GEMS', {
      ...TEXT_STYLE_WHITE
    }).setOrigin(0.5);

    this.selectedIndex = 0;
    this.entries = [];
    this.drawParty();

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const hint = isTouch ? 'A: promote   B: back' : 'Z: promote   X: back';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, hint, {
      fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#888888'
    }).setOrigin(0.5);

    this.keyX = this.input.keyboard.addKey('X');
    this.keyBack = this.input.keyboard.addKey('BACKSPACE');
    this.keyZ = this.input.keyboard.addKey('Z');
    this.keyEnter = this.input.keyboard.addKey('ENTER');
    this.keyUp = this.input.keyboard.addKey('UP');
    this.keyDown = this.input.keyboard.addKey('DOWN');
  }

  drawParty() {
    this.entries.forEach(e => e.destroy());
    this.entries = [];

    PartyManager.party.forEach((gem, i) => {
      const y = 18 + i * 22;
      const typeColor = TYPE_COLORS[gem.type] || 0x888888;
      const isSelected = i === this.selectedIndex;

      if (isSelected) {
        this.entries.push(this.add.text(2, y, '>', { ...TEXT_STYLE_WHITE }));
      }

      this.entries.push(this.add.rectangle(14, y + 8, 6, 16, typeColor));

      this.entries.push(this.add.text(22, y, `${gem.name} v${gem.level}`, {
        ...TEXT_STYLE_WHITE
      }));

      const barX = 22;
      const barY = y + 10;
      const barWidth = 60;
      const hpRatio = gem.currentHp / gem.maxHp;
      this.entries.push(this.add.rectangle(barX, barY, barWidth, 3, 0x444444).setOrigin(0, 0));
      const color = hpRatio > 0.5 ? 0x22cc44 : hpRatio > 0.25 ? 0xddaa22 : 0xdd3333;
      this.entries.push(this.add.rectangle(barX, barY, barWidth * hpRatio, 3, color).setOrigin(0, 0));

      this.entries.push(this.add.text(barX + barWidth + 10, barY - 2, `${gem.currentHp}/${gem.maxHp}`, {
        fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#aaaaaa'
      }));

      this.entries.push(this.add.text(166, y, gem.type.toUpperCase(), {
        fontFamily: '"Tiny5", cursive', fontSize: '8px', color: '#aaaaaa'
      }));
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyX) || Phaser.Input.Keyboard.JustDown(this.keyBack)) {
      const overworld = this.scene.get('OverworldScene');
      overworld.inMenu = false;
      overworld.player.unfreeze();
      this.scene.resume('OverworldScene');
      this.scene.stop();
      return;
    }

    const n = PartyManager.party.length;
    if (n === 0) return;

    if (Phaser.Input.Keyboard.JustDown(this.keyDown)) {
      this.selectedIndex = (this.selectedIndex + 1) % n;
      this.drawParty();
    } else if (Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.selectedIndex = (this.selectedIndex - 1 + n) % n;
      this.drawParty();
    } else if (Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      if (this.selectedIndex !== 0) {
        const gem = PartyManager.party.splice(this.selectedIndex, 1)[0];
        PartyManager.party.unshift(gem);
        this.selectedIndex = 0;
        this.drawParty();
      }
    }
  }
}
