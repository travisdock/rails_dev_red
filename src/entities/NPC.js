class NPC {
  constructor(scene, tileX, tileY, config) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.name = config.name || 'NPC';
    this.dialog = config.dialog || ['...'];
    this.color = config.color || 0x4488cc;
    this.facing = config.facing || 'down';
    this.spriteKey = config.spriteKey || null;

    const pos = Grid.tileToPixel(tileX, tileY);

    if (this.spriteKey && scene.textures.exists(this.spriteKey)) {
      this.sprite = scene.add.sprite(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        this.spriteKey, 0
      ).setDepth(5);

      // Create idle animations for each direction
      const dirs = ['down', 'left', 'right', 'up'];
      dirs.forEach((dir, row) => {
        const key = `${this.spriteKey}-idle-${dir}`;
        if (!scene.anims.exists(key)) {
          scene.anims.create({
            key,
            frames: [{ key: this.spriteKey, frame: row * 4 }],
            frameRate: 1
          });
        }
      });

      this.sprite.play(`${this.spriteKey}-idle-${this.facing}`, true);
      this.hasSprite = true;
    } else {
      this.sprite = scene.add.rectangle(
        pos.x + TILE_SIZE / 2,
        pos.y + TILE_SIZE / 2,
        TILE_SIZE - 2, TILE_SIZE - 2,
        this.color
      ).setDepth(5);
      this.hasSprite = false;
    }
  }

  interact(playerFacing) {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    this.facing = opposite[playerFacing] || 'down';

    if (this.hasSprite) {
      this.sprite.play(`${this.spriteKey}-idle-${this.facing}`, true);
    }

    if (typeof this.dialog === 'string') {
      return [this.dialog];
    }
    return [...this.dialog];
  }

  destroy() {
    this.sprite.destroy();
  }
}
