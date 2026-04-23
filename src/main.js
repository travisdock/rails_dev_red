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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    IntroScene,
    OverworldScene,
    CreditsScene,
    BattleScene,
    BattleUIScene,
    DialogScene,
    MenuScene,
    PartyScene,
    HealScene
  ]
};

const game = new Phaser.Game(config);
window.game = game;
game.events.once('ready', () => { game.sound.mute = true; });

// Debug tools
window.DEBUG = {
  healParty() {
    PartyManager.healAll();
    console.log('Party healed!');
  },
  addGem(gemId, level) {
    const gem = new GemInstance(gemId, level || 10);
    if (PartyManager.addGem(gem)) {
      console.log(`Added ${gem.name} v${gem.level}`);
    } else {
      console.log('Party is full!');
    }
  },
  setLevel(index, level) {
    const gem = PartyManager.party[index];
    if (!gem) { console.log('No gem at index ' + index); return; }
    const def = window.GAME_DATA.gems[gem.gemId];
    gem.level = level;
    gem.xp = GameMath.xpForLevel(level);
    gem.maxHp = GameMath.calcStat(def.baseStats.hp, level, true);
    gem.currentHp = gem.maxHp;
    gem.stats = {
      attack: GameMath.calcStat(def.baseStats.attack, level, false),
      defense: GameMath.calcStat(def.baseStats.defense, level, false),
      spAttack: GameMath.calcStat(def.baseStats.spAttack, level, false),
      spDefense: GameMath.calcStat(def.baseStats.spDefense, level, false),
      speed: GameMath.calcStat(def.baseStats.speed, level, false)
    };
    console.log(`${gem.name} set to v${level}`);
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
    console.log('Badges:', ProgressManager.badges);
    console.log('Trainers defeated:', ProgressManager.trainersDefeated);
    console.log('Party:', PartyManager.party.map(g => `${g.name} v${g.level}`));
  },
  deleteSave() {
    SaveManager.deleteSave();
    console.log('Save deleted!');
  }
};

console.log('%cBlastoff Rails: The Game v1.0.0', 'color: #ff6633; font-size: 16px; font-weight: bold');
console.log('Debug tools available: DEBUG.healParty(), DEBUG.addGem(id, level), DEBUG.listGems(), DEBUG.gameState()');
