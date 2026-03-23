class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show loading text
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff'
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

    // Load map data
    this.load.json('map-localhost', 'assets/maps/localhost.json');
    this.load.json('map-route1', 'assets/maps/route1.json');
    this.load.json('map-route2-west', 'assets/maps/route2_west.json');
    this.load.json('map-route2-east', 'assets/maps/route2_east.json');
    this.load.json('map-route3', 'assets/maps/route3.json');
    this.load.json('map-staging-springs', 'assets/maps/staging_springs.json');
    this.load.json('map-testing-terrace', 'assets/maps/testing_terrace.json');
    this.load.json('map-production-city', 'assets/maps/production_city.json');
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
