class TransitionFX {
  static battleTransition(scene, callback) {
    // Black overlay for flashing
    const overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 1
    ).setScrollFactor(0).setDepth(2000);

    // Flash: black -> transparent -> black, 3 times
    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 120,
      yoyo: true,
      repeat: 2,
      hold: 80,
      onComplete: () => {
        overlay.setAlpha(1);
        scene.time.delayedCall(200, () => {
          overlay.destroy();
          if (callback) callback();
        });
      }
    });
  }

  static fadeOut(scene, duration, callback) {
    const overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0
    ).setScrollFactor(0).setDepth(2000);

    scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: duration || 500,
      onComplete: () => {
        if (callback) callback();
        overlay.destroy();
      }
    });
  }

  static fadeIn(scene, duration, callback) {
    const overlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 1
    ).setScrollFactor(0).setDepth(2000);

    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: duration || 500,
      onComplete: () => {
        overlay.destroy();
        if (callback) callback();
      }
    });
  }
}
