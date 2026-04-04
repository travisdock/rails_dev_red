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
      const tex = scene.textures.get(this.spriteKey);
      const srcW = tex.source[0].width;
      const srcH = tex.source[0].height;
      // Single-row spritesheets (e.g. 144x48) have 4 frames in one row
      const isSingleRow = srcH <= 48;

      if (isSingleRow) {
        // Single-row sprites (36x48 frames) — character art offset varies per direction
        this.singleRowOffsets = { left: -4, down: -2, right: 0, up: 5 };
        const xOff = this.singleRowOffsets[this.facing] || 0;
        this.sprite = scene.add.sprite(
          pos.x + TILE_SIZE / 2 + xOff,
          pos.y + TILE_SIZE / 2 + 2,
          this.spriteKey, 0
        ).setDepth(10 + tileY);
        this.isSingleRow = true;
      } else {
        this.sprite = scene.add.sprite(
          pos.x + TILE_SIZE / 2,
          pos.y + TILE_SIZE / 2,
          this.spriteKey, 0
        ).setDepth(10 + tileY);
      }

      // Create idle animations for each direction
      const dirs = ['down', 'left', 'right', 'up'];
      dirs.forEach((dir, idx) => {
        const key = `${this.spriteKey}-idle-${dir}`;
        if (!scene.anims.exists(key)) {
          // Single-row: frame order is left, down, right, up
          const singleRowMap = { 0: 1, 1: 0, 2: 2, 3: 3 }; // down=1, left=0, right=2, up=3
          const frame = isSingleRow ? singleRowMap[idx] : idx * 4;
          scene.anims.create({
            key,
            frames: [{ key: this.spriteKey, frame }],
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
      ).setDepth(10 + tileY);
      this.hasSprite = false;
    }
  }

  interact(playerFacing) {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    this.facing = opposite[playerFacing] || 'down';

    if (this.hasSprite) {
      this.sprite.play(`${this.spriteKey}-idle-${this.facing}`, true);
      if (this.isSingleRow) {
        const pos = Grid.tileToPixel(this.tileX, this.tileY);
        this.sprite.x = pos.x + TILE_SIZE / 2 + (this.singleRowOffsets[this.facing] || 0);
      }
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
