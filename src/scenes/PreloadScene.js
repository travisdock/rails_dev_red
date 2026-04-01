class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show loading text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      ...TEXT_STYLE_WHITE
    }).setOrigin(0.5);

    // Progress bar
    const barBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 160, 8, 0x333333);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 79, GAME_HEIGHT / 2 + 16, 1, 6, 0x22cc44).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.displayWidth = 158 * value;
    });

    // Load JSON data
    this.load.json('gems-data', 'src/data/gems.json');
    this.load.json('bugs-data', 'src/data/bugs.json');
    this.load.json('moves-data', 'src/data/moves.json');
    this.load.json('trainers-data', 'src/data/trainers.json');
    this.load.json('gym-leaders-data', 'src/data/gym-leaders.json');
    this.load.json('encounters-data', 'src/data/encounters.json');
    this.load.json('type-chart-data', 'src/data/type-chart.json');
    this.load.json('marts-data', 'src/data/marts.json');

    // Load sprites
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 32, frameHeight: 32
    });

    // NPC sprites
    const npcIds = ['01','02','03','04','05','06','07','09','10'];
    for (const id of npcIds) {
      this.load.spritesheet('npc' + id, 'assets/sprites/npc' + id + '.png', {
        frameWidth: 32, frameHeight: 32
      });
    }

    // Load tilesets
    this.load.spritesheet('tiles-path', 'assets/tilesets/path.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-grass', 'assets/tilesets/grass.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-trees', 'assets/tilesets/trees.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-elements', 'assets/tilesets/elements.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-interior', 'assets/tilesets/interior.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-floor', 'assets/tilesets/floor.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-city', 'assets/tilesets/city.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-house', 'assets/tilesets/TilesetHouse.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-path_06', 'assets/tilesets/path_06.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-general_UI', 'assets/tilesets/general_UI.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-rocket2', 'assets/tilesets/rocket2.png', {
      frameWidth: 16, frameHeight: 16
    });

    // Load audio
    this.load.audio('music-hotel', 'assets/audio/hotel.ogg');
    this.load.audio('music-battle', 'assets/audio/battle.ogg');

    // Load map data
    this.load.json('map-hotel', 'assets/maps/hotel.json');
    this.load.json('map-old-town', 'assets/maps/old_town.json');
    this.load.json('map-park', 'assets/maps/park.json');
    this.load.json('map-venue', 'assets/maps/venue.json');
    this.load.json('map-parking-lot', 'assets/maps/parking_lot.json');
  }

  create() {
    // Store game data globally
    window.GAME_DATA = {
      gems: this.cache.json.get('gems-data'),
      bugs: this.cache.json.get('bugs-data'),
      moves: this.cache.json.get('moves-data'),
      trainers: this.cache.json.get('trainers-data'),
      gymLeaders: this.cache.json.get('gym-leaders-data'),
      encounters: this.cache.json.get('encounters-data'),
      typeChart: this.cache.json.get('type-chart-data'),
      marts: this.cache.json.get('marts-data')
    };

    // Initialize type chart
    TypeChart.init(window.GAME_DATA.typeChart);

    // Initialize encounter manager
    EncounterManager.init(window.GAME_DATA.encounters);

    this.scene.start('TitleScene');
  }
}
