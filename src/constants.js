const TILE_SIZE = 16;
const GAME_WIDTH = 240;
const GAME_HEIGHT = 160;
const ZOOM = 4;
const MOVE_DURATION = 150; // ms per tile step
const ENCOUNTER_RATE = 0.15;
const MAX_PARTY_SIZE = 6;
const MAX_MOVES = 4;

const TYPES = ['auth', 'performance', 'testing', 'database', 'frontend', 'devops'];

// Text style defaults for crisp pixel text
const TEXT_STYLE = {
  fontFamily: '"Press Start 2P", cursive',
  fontSize: '8px',
  color: '#111111'
};
const TEXT_STYLE_WHITE = {
  fontFamily: '"Press Start 2P", cursive',
  fontSize: '8px',
  color: '#ffffff'
};

const TYPE_COLORS = {
  auth: 0xe74c3c,
  performance: 0xf39c12,
  testing: 0x2ecc71,
  database: 0x3498db,
  frontend: 0x9b59b6,
  devops: 0x1abc9c
};

const DIRECTIONS = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const STAT_STAGE_MULTIPLIERS = {
  '-6': 2/8, '-5': 2/7, '-4': 2/6, '-3': 2/5, '-2': 2/4, '-1': 2/3,
  '0': 1,
  '1': 3/2, '2': 4/2, '3': 5/2, '4': 6/2, '5': 7/2, '6': 8/2
};
