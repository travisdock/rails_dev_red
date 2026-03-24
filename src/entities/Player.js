class Player {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.facing = 'down';
    this.isMoving = false;
    this.frozen = false;

    const pos = Grid.tileToPixel(tileX, tileY);

    // Use spritesheet if loaded, fall back to colored rectangle
    if (scene.textures.exists('player')) {
      this.sprite = scene.add.sprite(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        'player', 0
      ).setDepth(5);

      // Create walk animations
      // Spritesheet layout: 4 rows x 4 cols
      // Row 0 = down, Row 1 = left, Row 2 = right, Row 3 = up
      const dirs = ['down', 'left', 'right', 'up'];
      dirs.forEach((dir, row) => {
        const idleKey = `player-idle-${dir}`;
        const walkKey = `player-walk-${dir}`;
        if (!scene.anims.exists(idleKey)) {
          scene.anims.create({
            key: idleKey,
            frames: [{ key: 'player', frame: row * 4 }],
            frameRate: 1
          });
        }
        if (!scene.anims.exists(walkKey)) {
          scene.anims.create({
            key: walkKey,
            frames: scene.anims.generateFrameNumbers('player', {
              start: row * 4, end: row * 4 + 3
            }),
            frameRate: 8,
            repeat: -1
          });
        }
      });

      this.sprite.play('player-idle-down');
      this.hasSprite = true;
    } else {
      this.sprite = scene.add.rectangle(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        TILE_SIZE - 2, TILE_SIZE - 2,
        0x22aa44
      ).setDepth(5);
      this.hasSprite = false;
    }

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyZ = scene.input.keyboard.addKey('Z');
    this.keyX = scene.input.keyboard.addKey('X');
    this.keyEnter = scene.input.keyboard.addKey('ENTER');
    this.keyM = scene.input.keyboard.addKey('M');
  }

  update() {
    if (this.isMoving || this.frozen) return;

    if (Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      this.scene.handleInteraction(this.tileX, this.tileY, this.facing);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyM) || Phaser.Input.Keyboard.JustDown(this.keyX)) {
      this.scene.openMenu();
      return;
    }

    let dx = 0, dy = 0, dir = null;
    if (this.cursors.down.isDown) { dy = 1; dir = 'down'; }
    else if (this.cursors.up.isDown) { dy = -1; dir = 'up'; }
    else if (this.cursors.left.isDown) { dx = -1; dir = 'left'; }
    else if (this.cursors.right.isDown) { dx = 1; dir = 'right'; }

    if (dir) {
      this.facing = dir;
      if (this.hasSprite) {
        this.sprite.play(`player-idle-${dir}`, true);
      }
      this.tryMove(dx, dy);
    }
  }

  tryMove(dx, dy) {
    const newTileX = this.tileX + dx;
    const newTileY = this.tileY + dy;

    if (this.scene.isBlocked(newTileX, newTileY)) return;

    this.isMoving = true;

    // Play walk animation
    if (this.hasSprite) {
      this.sprite.play(`player-walk-${this.facing}`, true);
    }

    this.scene.tweens.add({
      targets: this.sprite,
      x: '+=' + (dx * TILE_SIZE),
      y: '+=' + (dy * TILE_SIZE),
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.tileX = newTileX;
        this.tileY = newTileY;
        this.isMoving = false;
        // Return to idle
        if (this.hasSprite) {
          this.sprite.play(`player-idle-${this.facing}`, true);
        }
        this.scene.onPlayerStep(newTileX, newTileY);
      }
    });
  }

  setPosition(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    const pos = Grid.tileToPixel(tileX, tileY);
    this.sprite.setPosition(pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE / 2);
  }

  freeze() { this.frozen = true; }
  unfreeze() { this.frozen = false; }

  destroy() {
    this.sprite.destroy();
  }
}
