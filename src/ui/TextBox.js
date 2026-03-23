class TextBox {
  constructor(scene, x, y, width, height) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.padding = 4;
    this.depth = 1000;

    this.bg = null;
    this.textObj = null;
    this.visible = false;
  }

  create() {
    this.bg = this.scene.add.rectangle(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width, this.height,
      0xffffff
    ).setStrokeStyle(2, 0x333333)
     .setScrollFactor(0)
     .setDepth(this.depth);

    this.textObj = this.scene.add.text(
      this.x + this.padding,
      this.y + this.padding,
      '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#333333',
        wordWrap: { width: this.width - this.padding * 2 },
        lineSpacing: 2
      }
    ).setScrollFactor(0)
     .setDepth(this.depth + 1);

    this.setVisible(false);
    return this;
  }

  setText(text) {
    if (this.textObj) this.textObj.setText(text);
    return this;
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.bg) this.bg.setVisible(visible);
    if (this.textObj) this.textObj.setVisible(visible);
    return this;
  }

  destroy() {
    if (this.bg) this.bg.destroy();
    if (this.textObj) this.textObj.destroy();
  }
}
