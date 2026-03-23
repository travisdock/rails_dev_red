import fs from 'fs';
import vm from 'vm';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../..');

// Minimal browser globals
globalThis.window = globalThis;
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

// Load source files in the same order as index.html
const sourceFiles = [
  'src/constants.js',
  'src/utils/math.js',
  'src/utils/grid.js',
  'src/utils/typeEffectiveness.js',
  'src/entities/GemInstance.js',
  'src/systems/SaveManager.js',
  'src/systems/ProgressManager.js',
  'src/systems/PartyManager.js',
  'src/systems/InventoryManager.js',
  'src/systems/EncounterManager.js',
  'src/systems/BattleManager.js',
];

for (const file of sourceFiles) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInThisContext(code, { filename: file });
}

// Load game data
globalThis.window.GAME_DATA = {
  gems: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/gems.json'), 'utf8')),
  bugs: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/bugs.json'), 'utf8')),
  moves: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/moves.json'), 'utf8')),
  trainers: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/trainers.json'), 'utf8')),
  gymLeaders: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/gym-leaders.json'), 'utf8')),
  encounters: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/encounters.json'), 'utf8')),
  typeChart: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/type-chart.json'), 'utf8')),
  marts: JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/marts.json'), 'utf8')),
};

TypeChart.init(window.GAME_DATA.typeChart);
EncounterManager.init(window.GAME_DATA.encounters);
