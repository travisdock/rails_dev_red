class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Wait for Press Start 2P font to load before proceeding
    document.fonts.load('10px "Press Start 2P"').then(() => {
      this.scene.start('PreloadScene');
    }).catch(() => {
      // Font failed to load, proceed anyway with fallback
      this.scene.start('PreloadScene');
    });
  }
}
