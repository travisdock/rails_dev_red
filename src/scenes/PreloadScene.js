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


    // Load logo
    this.load.image('logo', 'assets/logo.png');
    this.load.image('prof_ruby', 'assets/prof_ruby.png');

    // Load sprites
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: 32, frameHeight: 32
    });

    // NPC sprites
    const npcIds = ['01','02','03','04','05','06','07','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26'];
    for (const id of npcIds) {
      this.load.spritesheet('npc' + id, 'assets/sprites/npc' + id + '.png', {
        frameWidth: 32, frameHeight: 32
      });
    }

    // Load portrait-style NPC sprites (single row, 4 directions: down, left, right, up)
    const pgIds = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];
    for (const id of pgIds) {
      this.load.spritesheet('pg' + id, 'assets/sprites/pg' + id + '.png', {
        frameWidth: 36, frameHeight: 48
      });
    }

    // DHH (portrait-style, down-facing only)
    this.load.spritesheet('dhh', 'assets/sprites/dhh.png', {
      frameWidth: 36, frameHeight: 48
    });

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
    this.load.spritesheet('tiles-rocket5', 'assets/tilesets/rocket5.png', {
      frameWidth: 16, frameHeight: 16
    });
    this.load.spritesheet('tiles-rocket2', 'assets/tilesets/rocket2.png', {
      frameWidth: 16, frameHeight: 16
    });

    // Load bug sprites (loaded by convention — missing files fall back to colored rectangles)
    const bugIds = [
      'n_plus_one', 'no_method_error', 'request_timeout', 'sql_injection',
      'memory_leak', 'race_condition', 'xss_attack', 'flaky_test', 'brittle_spec',
      'slow_test_suite', 'external_dependency', 'test_pollution', 'phantom_failure',
      'cors_error', 'centered_div', 'z_index_hell',
      'circular_dependency', 'infinite_loop', 'cache_stampede',
      'mass_assignment', 'pending_migration', 'missing_assets', 'csrf_vuln'
    ];
    for (const id of bugIds) {
      this.load.image('bug-' + id, 'assets/sprites/bugs/' + id + '.png');
    }

    // Load gem sprites (loaded by convention — missing files fall back to colored rectangles)
    const gemIds = [
      'rspec', 'bullet', 'brakeman', 'herb', 'proposite'
    ];
    for (const id of gemIds) {
      this.load.image('gem-' + id, 'assets/sprites/gems/' + id + '.png');
    }

    // Load audio
    this.load.audio('music-menu', 'assets/audio/menu.ogg');
    this.load.audio('music-hotel', 'assets/audio/hotel.ogg');
    this.load.audio('music-battle', 'assets/audio/battle.ogg');
    this.load.audio('music-old-town', 'assets/audio/old_town.ogg');
    this.load.audio('music-park', 'assets/audio/park.ogg');
    this.load.audio('music-parking-lot', 'assets/audio/parking_lot.ogg');
    this.load.audio('music-venue', 'assets/audio/venue.ogg');
    this.load.audio('music-credits', 'assets/audio/credits.ogg');

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
      typeChart: this.cache.json.get('type-chart-data')
    };

    // Initialize type chart
    TypeChart.init(window.GAME_DATA.typeChart);

    // Initialize encounter manager
    EncounterManager.init(window.GAME_DATA.encounters);

    this.scene.start('TitleScene');
  }
}
