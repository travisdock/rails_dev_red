const config = {
  type: Phaser.CANVAS,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zoom: ZOOM,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  parent: document.body,
  backgroundColor: '#111111',
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    OverworldScene,
    BattleScene,
    BattleUIScene,
    DialogScene,
    MenuScene,
    PartyScene,
    MartScene,
    HealScene
  ]
};

const game = new Phaser.Game(config);

// Debug tools
window.DEBUG = {
  healParty() {
    PartyManager.healAll();
    console.log('Party healed!');
  },
  addGem(gemId, level) {
    const gem = new GemInstance(gemId, level || 10);
    if (PartyManager.addGem(gem)) {
      console.log(`Added ${gem.name} Lv${gem.level}`);
    } else {
      console.log('Party is full!');
    }
  },
  setMoney(amount) {
    InventoryManager.money = amount;
    console.log(`Money set to $${amount}`);
  },
  addBadge(badgeId) {
    ProgressManager.addBadge(badgeId);
    console.log(`Badge ${badgeId} added!`);
  },
  listGems() {
    console.table(PartyManager.party.map(g => ({
      name: g.name, level: g.level, hp: `${g.currentHp}/${g.maxHp}`,
      type: g.type, moves: g.moves.join(', ')
    })));
  },
  gameState() {
    console.log('Money:', InventoryManager.money);
    console.log('Badges:', ProgressManager.badges);
    console.log('Trainers defeated:', ProgressManager.trainersDefeated);
    console.log('Party:', PartyManager.party.map(g => `${g.name} Lv${g.level}`));
  },
  deleteSave() {
    SaveManager.deleteSave();
    console.log('Save deleted!');
  }
};

console.log('%cBlastoff Rails: The Game v0.2.0', 'color: #ff6633; font-size: 16px; font-weight: bold');
console.log('Debug tools available: DEBUG.healParty(), DEBUG.addGem(id, level), DEBUG.setMoney(n), DEBUG.listGems(), DEBUG.gameState()');
