class NPC {
  constructor(scene, tileX, tileY, config) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.name = config.name || 'NPC';
    this.dialog = config.dialog || ['...'];
    this.color = config.color || 0x4488cc;
    this.facing = config.facing || 'down';

    const pos = Grid.tileToPixel(tileX, tileY);
    this.sprite = scene.add.rectangle(
      pos.x + TILE_SIZE / 2,
      pos.y + TILE_SIZE / 2,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      this.color
    ).setDepth(5);
  }

  interact(playerFacing) {
    // Face toward the player
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    this.facing = opposite[playerFacing] || 'down';

    // Show dialog
    if (typeof this.dialog === 'string') {
      return [this.dialog];
    }
    return [...this.dialog];
  }

  destroy() {
    this.sprite.destroy();
  }
}
