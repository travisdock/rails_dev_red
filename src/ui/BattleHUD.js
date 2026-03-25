class BattleHUD {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  createPlayerHUD(gem) {
    const x = 125;
    const y = 76;
    this.playerHUD = this.createGemHUD(x, y, gem, true);
  }

  createEnemyHUD(gem) {
    const x = 8;
    const y = 16;
    this.enemyHUD = this.createGemHUD(x, y, gem, false);
  }

  createGemHUD(x, y, gem, showHP) {
    const hud = {};
    const width = 105;

    // Background box
    hud.bg = this.scene.add.rectangle(x + width / 2, y + 16, width, 32, 0xf8f8f8)
      .setStrokeStyle(1, 0x888888)
      .setScrollFactor(0).setDepth(900);
    this.elements.push(hud.bg);

    // Name and level
    hud.nameText = this.scene.add.text(x + 4, y + 2, `${gem.name}`, {
      ...TEXT_STYLE
    }).setScrollFactor(0).setDepth(901);
    this.elements.push(hud.nameText);

    hud.levelText = this.scene.add.text(x + width - 4, y + 2, `Lv${gem.level}`, {
      ...TEXT_STYLE
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(901);
    this.elements.push(hud.levelText);

    // Type indicator
    const typeColor = TYPE_COLORS[gem.type] || 0x888888;
    hud.typeBar = this.scene.add.rectangle(x + 4, y + 13, 40, 3, typeColor)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(901);
    this.elements.push(hud.typeBar);

    // HP bar background
    const barX = x + 24;
    const barY = y + 19;
    const barWidth = 72;
    const barHeight = 4;

    hud.hpBarBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x444444)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(901);
    this.elements.push(hud.hpBarBg);

    // HP bar fill
    const hpRatio = gem.currentHp / gem.maxHp;
    hud.hpBar = this.scene.add.rectangle(barX, barY, barWidth * hpRatio, barHeight, this.hpColor(hpRatio))
      .setOrigin(0, 0).setScrollFactor(0).setDepth(902);
    this.elements.push(hud.hpBar);

    // HP label
    hud.hpLabel = this.scene.add.text(x + 4, y + 18, 'HP', {
      ...TEXT_STYLE, fontSize: '7px'
    }).setScrollFactor(0).setDepth(901);
    this.elements.push(hud.hpLabel);

    // HP numbers (player only)
    if (showHP) {
      hud.hpText = this.scene.add.text(x + width - 4, y + 25, `${gem.currentHp}/${gem.maxHp}`, {
        ...TEXT_STYLE, fontSize: '7px'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(901);
      this.elements.push(hud.hpText);
    }

    hud.barX = barX;
    hud.barWidth = barWidth;
    hud.barHeight = barHeight;
    hud.gem = gem;
    hud.showHP = showHP;
    hud.hudX = x;
    hud.hudWidth = width;

    return hud;
  }

  updateHP(side, currentHp, maxHp) {
    const hud = side === 'player' ? this.playerHUD : this.enemyHUD;
    if (!hud || !hud.hpBar || !hud.hpBar.active) return;

    const ratio = Math.max(0, currentHp / maxHp);
    const targetWidth = Math.max(0.1, hud.barWidth * ratio);
    hud.hpBar.displayWidth = targetWidth;
    hud.hpBar.setFillStyle(this.hpColor(ratio));
    if (hud.showHP && hud.hpText) {
      hud.hpText.setText(`${currentHp}/${maxHp}`);
    }
  }

  updateGemInfo(side, gem) {
    const hud = side === 'player' ? this.playerHUD : this.enemyHUD;
    if (!hud) return;

    hud.nameText.setText(gem.name);
    hud.levelText.setText(`Lv${gem.level}`);
    const typeColor = TYPE_COLORS[gem.type] || 0x888888;
    hud.typeBar.setFillStyle(typeColor);
    this.updateHP(side, gem.currentHp, gem.maxHp);
  }

  hpColor(ratio) {
    if (ratio > 0.5) return 0x22cc44;
    if (ratio > 0.25) return 0xddaa22;
    return 0xdd3333;
  }

  destroy() {
    this.elements.forEach(e => e.destroy());
    this.elements = [];
  }
}
