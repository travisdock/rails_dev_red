class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Wait for fonts to load before proceeding
    Promise.all([
      document.fonts.load('10px "Press Start 2P"'),
      document.fonts.load('10px "Tiny5"')
    ]).then(() => {
      this.scene.start('PreloadScene');
    }).catch(() => {
      // Fonts failed to load, proceed anyway with fallback
      this.scene.start('PreloadScene');
    });
  }
}
