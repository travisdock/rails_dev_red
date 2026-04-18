class SpritePicker {
  constructor(scene, options, config) {
    this.scene = scene;
    this.options = options; // [{ key, label }]
    this.selectedIndex = 0;
    this.onSelect = config?.onSelect || null;
    this.depth = config?.depth || 1100;
    this.active = true;

    const boxW = 120;
    const boxH = 96;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.elements = [];

    const bg = scene.add.rectangle(cx, cy, boxW, boxH, 0xffffff)
      .setStrokeStyle(2, 0x333333)
      .setScrollFactor(0)
      .setDepth(this.depth);
    this.elements.push(bg);

    this.title = scene.add.text(cx, cy - 38, 'Choose your look', {
      ...TEXT_STYLE
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 1);
    this.elements.push(this.title);

    this.preview = scene.add.sprite(cx, cy, options[0].key, 0)
      .setScale(2)
      .setScrollFactor(0)
      .setDepth(this.depth + 1);
    this.elements.push(this.preview);

    this.leftArrow = scene.add.text(cx - 44, cy, '<', {
      ...TEXT_STYLE
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 1);
    this.rightArrow = scene.add.text(cx + 44, cy, '>', {
      ...TEXT_STYLE
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 1);
    this.elements.push(this.leftArrow, this.rightArrow);

    this.label = scene.add.text(cx, cy + 30, options[0].label, {
      ...TEXT_STYLE
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 1);
    this.elements.push(this.label);

    this.hint = scene.add.text(cx, cy + 42, 'Z to confirm', {
      ...TEXT_STYLE, fontSize: '6px', color: '#666666'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.depth + 1);
    this.elements.push(this.hint);

    this.keys = {
      left: scene.input.keyboard.addKey('LEFT'),
      right: scene.input.keyboard.addKey('RIGHT'),
      confirm: scene.input.keyboard.addKey('Z'),
      enter: scene.input.keyboard.addKey('ENTER')
    };
  }

  updatePreview() {
    const opt = this.options[this.selectedIndex];
    this.preview.setTexture(opt.key, 0);
    this.label.setText(opt.label);
  }

  update() {
    if (!this.active) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
      this.updatePreview();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
      this.updatePreview();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
      if (this.onSelect) {
        this.onSelect(this.options[this.selectedIndex]);
      }
    }
  }

  destroy() {
    this.active = false;
    this.elements.forEach(e => e.destroy());
    this.elements = [];
    this.keys = null;
  }
}
