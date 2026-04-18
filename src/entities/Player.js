class Player {
  constructor(scene, tileX, tileY, spriteKey) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.facing = 'down';
    this.isMoving = false;
    this.frozen = false;
    this.spriteKey = spriteKey || 'player';

    const pos = Grid.tileToPixel(tileX, tileY);

    // Use spritesheet if loaded, fall back to colored rectangle
    if (scene.textures.exists(this.spriteKey)) {
      this.sprite = scene.add.sprite(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        this.spriteKey, 0
      ).setDepth(10 + tileY);

      // Create walk animations
      // Spritesheet layout: 4 rows x 4 cols
      // Row 0 = down, Row 1 = left, Row 2 = right, Row 3 = up
      const dirs = ['down', 'left', 'right', 'up'];
      dirs.forEach((dir, row) => {
        const idleKey = `${this.spriteKey}-idle-${dir}`;
        const walkKey = `${this.spriteKey}-walk-${dir}`;
        if (!scene.anims.exists(idleKey)) {
          scene.anims.create({
            key: idleKey,
            frames: [{ key: this.spriteKey, frame: row * 4 }],
            frameRate: 1
          });
        }
        if (!scene.anims.exists(walkKey)) {
          scene.anims.create({
            key: walkKey,
            frames: scene.anims.generateFrameNumbers(this.spriteKey, {
              start: row * 4, end: row * 4 + 3
            }),
            frameRate: 8,
            repeat: -1
          });
        }
      });

      this.sprite.play(`${this.spriteKey}-idle-down`);
      this.hasSprite = true;
    } else {
      this.sprite = scene.add.rectangle(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        TILE_SIZE - 2, TILE_SIZE - 2,
        0x22aa44
      ).setDepth(10 + tileY);
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
        this.sprite.play(`${this.spriteKey}-idle-${dir}`, true);
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
      this.sprite.play(`${this.spriteKey}-walk-${this.facing}`, true);
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
        this.sprite.setDepth(10 + newTileY);
        this.isMoving = false;
        // Return to idle
        if (this.hasSprite) {
          this.sprite.play(`${this.spriteKey}-idle-${this.facing}`, true);
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
    this.sprite.setDepth(10 + tileY);
  }

  freeze() { this.frozen = true; }
  unfreeze() { this.frozen = false; }

  destroy() {
    this.sprite.destroy();
  }
}
