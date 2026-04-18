class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    const entries = [
      { text: 'BLASTOFF RAILS', size: 12, color: '#ff6633' },
      { text: 'THE GAME', size: 10, color: '#ff9966' },
      { text: '', size: 8 },
      { text: '', size: 8 },
      { text: '- Game Design -', size: 8, color: '#888888' },
      { text: 'Travis Dockter', size: 8 },
      { text: '', size: 8 },
      { text: '- Custom Artwork -', size: 8, color: '#888888' },
      { text: 'Jannell Hadnot', size: 8 },
      { text: '', size: 8 },
      { text: '- Game Assets & Music -', size: 8, color: '#888888' },
      { text: 'n3cloud', size: 8 },
      { text: 'bexcellentgames', size: 8 },
      { text: 'maru-98', size: 8 },
      { text: '', size: 8 },
      { text: '- Featuring -', size: 8, color: '#888888' },
      { text: 'DHH', size: 8 },
      { text: 'Jason Swett', size: 8 },
      { text: 'Nate Berkopec', size: 8 },
      { text: 'Marco Roth', size: 8 },
      { text: 'Adrian Marin', size: 8 },
      { text: 'Jeremy Smith', size: 8 },
      { text: 'Chris Oliver', size: 8 },
      { text: 'Andrew Mason', size: 8 },
      { text: 'Ifat Ribon', size: 8 },
      { text: '', size: 8 },
      { text: 'Made for', size: 8, color: '#888888' },
      { text: 'Blastoff Rails 2026', size: 10, color: '#ff6633' },
      { text: '', size: 8 },
      { text: '', size: 8 },
      { text: 'Thanks for playing!', size: 10, color: '#53d8fb' }
    ];

    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT);
    let y = 0;
    for (const e of entries) {
      const t = this.add.text(0, y, e.text, {
        ...TEXT_STYLE_WHITE,
        fontSize: `${e.size}px`,
        color: e.color || '#ffffff'
      }).setOrigin(0.5, 0);
      this.container.add(t);
      y += e.size + 6;
    }

    const totalHeight = y;
    this.scrollTween = this.tweens.add({
      targets: this.container,
      y: -totalHeight,
      duration: 55000,
      ease: 'Linear',
      onComplete: () => this.finish()
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, 'Z: Skip', {
      ...TEXT_STYLE_WHITE, fontSize: '6px', color: '#555555'
    }).setOrigin(0.5);

    const skip = () => this.finish();
    this.input.keyboard.once('keydown-Z', skip);
    this.input.keyboard.once('keydown-ENTER', skip);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.sound.stopAll();
    this.scene.start('TitleScene');
  }
}
