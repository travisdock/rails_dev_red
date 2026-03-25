class MartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MartScene' });
  }

  init(data) {
    this.martId = data.martId || 'localhost';
  }

  create() {
    const martData = window.GAME_DATA.marts[this.martId];
    if (!martData) {
      this.closeMart();
      return;
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);

    // Title
    this.add.text(GAME_WIDTH / 2, 8, martData.name, {
      ...TEXT_STYLE_WHITE
    }).setOrigin(0.5).setDepth(1000);

    // Money display
    this.moneyText = this.add.text(GAME_WIDTH - 8, 8, `$${InventoryManager.money}`, {
      ...TEXT_STYLE, fontSize: '8px', color: '#ffcc00'
    }).setOrigin(1, 0).setDepth(1000);

    // Build options
    const options = martData.inventory.map(item => {
      const gemDef = window.GAME_DATA.gems[item.gemId];
      return {
        text: `${gemDef.name} Lv${item.level} - $${item.price}`,
        value: item
      };
    });
    options.push({ text: 'EXIT', value: null });

    this.menu = new MenuBox(this, 8, 24, options, {
      itemWidth: 200,
      depth: 1000,
      onSelect: (opt) => {
        if (opt.value === null) {
          this.closeMart();
          return;
        }
        this.tryBuy(opt.value);
      },
      onCancel: () => this.closeMart()
    });
  }

  tryBuy(item) {
    if (PartyManager.isFull()) {
      this.showMessage("Your party is full! (Max 6 gems)");
      return;
    }
    if (!InventoryManager.canAfford(item.price)) {
      this.showMessage("Not enough money!");
      return;
    }

    InventoryManager.spendMoney(item.price);
    const gem = new GemInstance(item.gemId, item.level);
    PartyManager.addGem(gem);

    this.moneyText.setText(`$${InventoryManager.money}`);
    this.showMessage(`Bought ${gem.name}!`);
  }

  showMessage(text) {
    if (this._msgText) this._msgText.destroy();
    this._msgText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, text, {
      ...TEXT_STYLE_WHITE,
      backgroundColor: '#333333', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(1100);

    this.time.delayedCall(1500, () => {
      if (this._msgText) this._msgText.destroy();
    });
  }

  closeMart() {
    const overworld = this.scene.get('OverworldScene');
    overworld.player.unfreeze();
    this.scene.resume('OverworldScene');
    this.scene.stop();
  }

  update() {
    if (this.menu && this.menu.active) {
      this.menu.update();
    }
  }
}
