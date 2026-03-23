class MenuBox {
  constructor(scene, x, y, options, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.options = options; // Array of { text, value }
    this.selectedIndex = 0;
    this.onSelect = config?.onSelect || null;
    this.onCancel = config?.onCancel || null;
    this.columns = config?.columns || 1;
    this.depth = config?.depth || 1000;
    this.active = true;

    this.itemHeight = 12;
    this.itemWidth = config?.itemWidth || 80;
    this.padding = 4;

    this.elements = [];
    this.cursor = null;

    this.create();
  }

  create() {
    const rows = Math.ceil(this.options.length / this.columns);
    const totalWidth = this.itemWidth * this.columns + this.padding * 2;
    const totalHeight = rows * this.itemHeight + this.padding * 2;

    // Background
    const bg = this.scene.add.rectangle(
      this.x + totalWidth / 2,
      this.y + totalHeight / 2,
      totalWidth, totalHeight,
      0xffffff
    ).setStrokeStyle(2, 0x333333)
     .setScrollFactor(0)
     .setDepth(this.depth);
    this.elements.push(bg);

    // Options
    this.textObjs = [];
    this.options.forEach((opt, i) => {
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);
      const tx = this.x + this.padding + 10 + col * this.itemWidth;
      const ty = this.y + this.padding + row * this.itemHeight;

      const text = this.scene.add.text(tx, ty, opt.text, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#333333'
      }).setScrollFactor(0).setDepth(this.depth + 1);

      this.textObjs.push(text);
      this.elements.push(text);
    });

    // Cursor
    this.cursor = this.scene.add.text(0, 0, '>', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#333333'
    }).setScrollFactor(0).setDepth(this.depth + 1);
    this.elements.push(this.cursor);

    this.updateCursor();
    this.setupInput();
  }

  updateCursor() {
    const col = this.selectedIndex % this.columns;
    const row = Math.floor(this.selectedIndex / this.columns);
    this.cursor.setPosition(
      this.x + this.padding + 2 + col * this.itemWidth,
      this.y + this.padding + row * this.itemHeight
    );
  }

  setupInput() {
    this.keys = {
      up: this.scene.input.keyboard.addKey('UP'),
      down: this.scene.input.keyboard.addKey('DOWN'),
      left: this.scene.input.keyboard.addKey('LEFT'),
      right: this.scene.input.keyboard.addKey('RIGHT'),
      confirm: this.scene.input.keyboard.addKey('Z'),
      cancel: this.scene.input.keyboard.addKey('X')
    };

    // Also support Enter for confirm, Backspace for cancel
    this.keys.enter = this.scene.input.keyboard.addKey('ENTER');
    this.keys.backspace = this.scene.input.keyboard.addKey('BACKSPACE');
  }

  update() {
    if (!this.active) return;

    const rows = Math.ceil(this.options.length / this.columns);

    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      const newIndex = this.selectedIndex + this.columns;
      if (newIndex < this.options.length) {
        this.selectedIndex = newIndex;
        this.updateCursor();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      const newIndex = this.selectedIndex - this.columns;
      if (newIndex >= 0) {
        this.selectedIndex = newIndex;
        this.updateCursor();
      }
    }
    if (this.columns > 1) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
        if ((this.selectedIndex % this.columns) < this.columns - 1 && this.selectedIndex + 1 < this.options.length) {
          this.selectedIndex++;
          this.updateCursor();
        }
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
        if ((this.selectedIndex % this.columns) > 0) {
          this.selectedIndex--;
          this.updateCursor();
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
      if (this.onSelect) {
        this.onSelect(this.options[this.selectedIndex], this.selectedIndex);
      }
      return; // callback may have destroyed this menu
    }

    if (this.keys && (Phaser.Input.Keyboard.JustDown(this.keys.cancel) || Phaser.Input.Keyboard.JustDown(this.keys.backspace))) {
      if (this.onCancel) {
        this.onCancel();
      }
    }
  }

  destroy() {
    this.active = false;
    this.elements.forEach(e => e.destroy());
    this.elements = [];
    // Don't destroy key objects — they are shared across the scene.
    // Just null the reference so this menu stops responding.
    this.keys = null;
  }
}
