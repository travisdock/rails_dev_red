const Grid = {
  tileToPixel(tileX, tileY) {
    return { x: tileX * TILE_SIZE, y: tileY * TILE_SIZE };
  },

  pixelToTile(pixelX, pixelY) {
    return { x: Math.floor(pixelX / TILE_SIZE), y: Math.floor(pixelY / TILE_SIZE) };
  },

  // Get the tile position the player is facing
  facingTile(tileX, tileY, direction) {
    const dir = DIRECTIONS[direction];
    return { x: tileX + dir.x, y: tileY + dir.y };
  }
};
