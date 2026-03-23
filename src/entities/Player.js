class Player {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.facing = 'down';
    this.isMoving = false;
    this.frozen = false;

    const pos = Grid.tileToPixel(tileX, tileY);
    this.sprite = scene.add.rectangle(
      pos.x + TILE_SIZE / 2,
      pos.y + TILE_SIZE / 2,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      0x22aa44
    ).setDepth(5);

    // Direction indicator (small triangle showing facing direction)
    this.dirIndicator = scene.add.triangle(
      pos.x + TILE_SIZE / 2,
      pos.y + TILE_SIZE / 2 + 3,
      0, 4, 3, -2, -3, -2,
      0x115522
    ).setDepth(6);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyZ = scene.input.keyboard.addKey('Z');
    this.keyX = scene.input.keyboard.addKey('X');
    this.keyEnter = scene.input.keyboard.addKey('ENTER');
    this.keyM = scene.input.keyboard.addKey('M'); // Menu
  }

  update() {
    if (this.isMoving || this.frozen) return;

    // Check for interaction
    if (Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      this.scene.handleInteraction(this.tileX, this.tileY, this.facing);
      return;
    }

    // Check for menu
    if (Phaser.Input.Keyboard.JustDown(this.keyM) || Phaser.Input.Keyboard.JustDown(this.keyX)) {
      this.scene.openMenu();
      return;
    }

    // Movement
    let dx = 0, dy = 0, dir = null;
    if (this.cursors.down.isDown) { dy = 1; dir = 'down'; }
    else if (this.cursors.up.isDown) { dy = -1; dir = 'up'; }
    else if (this.cursors.left.isDown) { dx = -1; dir = 'left'; }
    else if (this.cursors.right.isDown) { dx = 1; dir = 'right'; }

    if (dir) {
      this.facing = dir;
      this.updateDirectionIndicator();
      this.tryMove(dx, dy);
    }
  }

  tryMove(dx, dy) {
    const newTileX = this.tileX + dx;
    const newTileY = this.tileY + dy;

    // Check collision
    if (this.scene.isBlocked(newTileX, newTileY)) return;

    this.isMoving = true;
    const targetPos = Grid.tileToPixel(newTileX, newTileY);

    this.scene.tweens.add({
      targets: [this.sprite, this.dirIndicator],
      x: '+=' + (dx * TILE_SIZE),
      y: '+=' + (dy * TILE_SIZE),
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.tileX = newTileX;
        this.tileY = newTileY;
        this.isMoving = false;
        this.scene.onPlayerStep(newTileX, newTileY);
      }
    });
  }

  updateDirectionIndicator() {
    // Rotate indicator to show facing direction
    const angles = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
    this.dirIndicator.setRotation(angles[this.facing] || 0);
  }

  setPosition(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    const pos = Grid.tileToPixel(tileX, tileY);
    this.sprite.setPosition(pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE / 2);
    this.dirIndicator.setPosition(pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE / 2 + 3);
  }

  freeze() { this.frozen = true; }
  unfreeze() { this.frozen = false; }

  destroy() {
    this.sprite.destroy();
    this.dirIndicator.destroy();
  }
}
