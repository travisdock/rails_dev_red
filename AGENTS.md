# Blastoff Rails: The Game — Agent Guide

## What Is This?

A Pokemon Red/Blue-style web RPG built with Phaser.js, themed around Ruby on Rails development. Players collect Ruby gems and battle software bugs. Being built for the **Blastoff Rails** conference in Albuquerque, NM (summer 2026).

The game is fully client-side (no backend). Maps are designed in the Tiled map editor and exported as JSON. All game content (gems, bugs, moves, trainers, encounters) is data-driven via JSON config files.

## Quick Start

```bash
npx serve . -p 8080
```

Run tests:
```bash
npm test          # single run
npm run test:watch # watch mode
```

## Tech Stack

- **Phaser.js 3.80+** via CDN (Canvas mode, not WebGL)
- **Vanilla JavaScript** — no modules, no build step, loaded via `<script>` tags in `index.html`
- **Tiled Map Editor** — maps designed visually, exported as JSON
- **16x16 tiles** at 4x zoom, **32x32 character sprites**
- **localStorage** for save data
- **Vitest** for tests (300+ tests)
- **Press Start 2P** Google Font for pixel-perfect text

## Project Structure

```
├── index.html                  # Entry point, script load order matters!
├── src/
│   ├── main.js                 # Phaser config, DEBUG tools
│   ├── constants.js            # TILE_SIZE, ZOOM, TEXT_STYLE, type colors
│   ├── scenes/                 # Phaser scenes (game screens)
│   │   ├── BootScene.js        # Waits for font load, then PreloadScene
│   │   ├── PreloadScene.js     # Loads ALL assets + JSON data
│   │   ├── TitleScene.js       # Title screen, New/Continue
│   │   ├── OverworldScene.js   # Main gameplay: maps, movement, NPCs, encounters
│   │   ├── BattleScene.js      # Battle rendering, event queue (drainQueue)
│   │   ├── MenuScene.js        # Pause menu
│   │   ├── PartyScene.js       # View gem party
│   │   ├── MartScene.js        # Shop UI
│   │   └── HealScene.js        # (placeholder)
│   ├── systems/                # Pure logic, no Phaser dependency (testable)
│   │   ├── BattleManager.js    # Turn resolution, damage calc, XP
│   │   ├── EncounterManager.js # Wild encounter checks per zone
│   │   ├── PartyManager.js     # Party CRUD, healing
│   │   ├── InventoryManager.js # Money management
│   │   ├── SaveManager.js      # localStorage save/load
│   │   ├── DialogManager.js    # Typewriter text, message queue
│   │   └── ProgressManager.js  # Badges, defeated trainers, flags
│   ├── entities/
│   │   ├── Player.js           # Grid movement via tweens, sprite animations
│   │   ├── NPC.js              # Sprite + dialog, faces player on interact
│   │   ├── Trainer.js          # Extends NPC: line-of-sight, battle, defeated state
│   │   └── GemInstance.js      # Runtime gem/bug state (HP, XP, moves, serialize)
│   ├── data/                   # JSON config files (the game's content)
│   │   ├── gems.json           # All gem definitions
│   │   ├── bugs.json           # Wild encounter bug definitions
│   │   ├── moves.json          # Move definitions (power, type, effects)
│   │   ├── trainers.json       # Trainer parties and dialogue
│   │   ├── gym-leaders.json    # Boss definitions
│   │   ├── encounters.json     # Per-zone encounter tables
│   │   ├── type-chart.json     # 6x6 type effectiveness matrix
│   │   └── marts.json          # Shop inventories per location
│   ├── ui/                     # UI components
│   │   ├── TextBox.js          # Bordered text box
│   │   ├── MenuBox.js          # Selectable option list
│   │   ├── BattleHUD.js        # HP bars, level display
│   │   └── TransitionFX.js     # Fade/flash transitions
│   └── utils/                  # Pure utility functions (testable)
│       ├── math.js             # Damage formula, XP curve, weighted random
│       ├── grid.js             # Tile/pixel conversions
│       └── typeEffectiveness.js
├── assets/
│   ├── sprites/                # player.png, npc01-npc10.png (32x32 frames)
│   ├── tilesets/               # grass, path, trees, elements, interior, floor, city
│   ├── maps/                   # Tiled JSON exports (game loads these)
│   └── audio/                  # .ogg music files (hotel.ogg, battle.ogg)
├── tiled/                      # Tiled editor source files (.tmx + .tsx)
├── tests/
│   ├── setup/testHelper.js     # Loads source via vm.runInThisContext
│   ├── unit/                   # Unit tests for systems and entities
│   ├── integration/            # Save/load round-trip tests
│   └── data/                   # JSON cross-reference validation
└── PLAN.md                     # Full game design document
```

## Critical Architecture Patterns

### Script Load Order
Files are loaded via `<script>` tags in `index.html`. **Order matters** — dependencies must load before dependents. If you add a new file, add the `<script>` tag in the right position.

### Global Scope
Everything is global (`class`, `const`, `var` at top level). No modules. `window.GAME_DATA` holds all parsed JSON data. Systems like `PartyManager`, `InventoryManager`, `ProgressManager` are global singletons.

### Phaser Scene Lifecycle
- Phaser **reuses scene objects** across `stop()`/`launch()` cycles
- **All state must be explicitly reset in `create()`** — stale properties from previous runs will persist
- This was the source of the `battleOver` flag bug

### Battle Event System
`BattleScene` uses a sequential event queue processed by `drainQueue()`:
- `BattleManager.executeTurn()` generates an array of events (messages, damage, faints, etc.)
- `drainQueue()` processes them one at a time with delays between each
- Mid-turn messages auto-advance (800ms delay), final message waits for Z/Enter input
- **Never use Promises or racing timers** for event chains — they caused freezes. Use `delayedCall` only.
- `BattleManager` applies side effects (damage) during event **generation**, not display. Switch events must snapshot HP values for correct HUD display.

### Map Loading (Tiled vs Procedural)
`OverworldScene.loadMap()` checks for Tiled JSON first, falls back to procedural:
1. If `assets/maps/<key>.json` has `layers`, load as Tiled map
2. Otherwise, generate procedurally (used for maps not yet designed in Tiled)

Tiled maps are parsed in `loadTiledMap()`:
- Tile layers → sprites placed from tileset spritesheets
- Collision layer → any non-zero tile marks that cell blocked
- Objects layer → parsed into NPCs, doors, trainers, etc.
- Encounters layer → rectangles with `encounterZone` property, stored **per-tile** (not global)

If a Tiled map has objects, procedural objects are skipped. If no Tiled objects, `loadProceduralObjects()` provides defaults.

### Encounter Zones
Each grass tile stores its own `zone` property. The encounter check uses the zone of the specific tile the player is standing on. **Do not use a single global `encounterZone`** — this breaks maps with multiple zones.

### Adding New Tilesets
1. Copy PNG to `assets/tilesets/`
2. Create `.tsx` file in `tiled/` (XML tileset definition)
3. Add `this.load.spritesheet(...)` in `PreloadScene.js`
4. Add `else if (ts.source.includes('name'))` in `OverworldScene.js` tileset lookup
5. In Tiled: Map > Add External Tileset

### Adding New Character Sprites
Source spritesheets are 128x96 (4 cols x 3 rows of 32x32 frames):
- Row 0 = facing down, Row 1 = facing right, Row 2 = facing up

Process into 4-direction sheets (128x128, 4x4 grid) using Python/PIL:
- Row 0 = down, Row 1 = left (flip row 1), Row 2 = right, Row 3 = up

Save to `assets/sprites/npcXX.png`, load in PreloadScene, use `spriteKey: 'npcXX'` on objects.

### Adding New Music
1. Drop `.ogg` file in `assets/audio/`
2. Add `this.load.audio('music-<mapkey>', ...)` in PreloadScene
3. Music auto-plays when entering a map if the key matches `music-<mapKey>`
4. Battle music key is `music-battle`

## Key Bug Patterns to Avoid

| Pattern | Problem | Fix |
|---------|---------|-----|
| Scene state not reset | `battleOver`, `_waitingForInput` persist across battles | Always init all state in `create()` |
| MenuBox destroying shared keys | `key.destroy()` kills input for entire scene | `MenuBox.destroy()` nulls keys, doesn't destroy them |
| MenuBox `onSelect` mid-update | Callback destroys menu while `update()` still running | Return after `onSelect` call, guard `this.keys` |
| `setFillStyle` on Sprite | Trainers with spriteKey use Sprite not Rectangle | Check `this.hasSprite` → use `setTint()` instead |
| HP snapshot on switch | `executeTurn` applies damage during generation | Switch event includes `hp`/`maxHp` snapshot |
| Faint after switch | Enemy KOs switched-in gem | Must check `isFainted` after enemy counter-attack |
| Global encounterZone | Last zone parsed overwrites all | Store zone per grass tile |
| Encounter zone ID mismatch | Code uses `route1`, JSON uses `route_1` | Data integrity test catches this |

## Game World: Blastoff Rails

### Maps
| Map Key | Location | Boss |
|---------|----------|------|
| `hotel` | The Hotel (start) | Jason Swett (Testing) |
| `parking-lot` | Parking Lot (hub) | None — encounter areas |
| `old-town` | Old Town | Greg Molnar (Security) |
| `park` | The Park | Nate Berkopec (Performance) |
| `venue` | The Venue (final) | DHH (Rails) |

### Progression
Hotel → Parking Lot → Old Town (1 pass) → Park (2 passes) → Venue (3 passes)

### Starters
RSpec (Testing), Bullet (Performance), Brakeman (Security)

### Types (6)
`auth`, `performance`, `testing`, `database`, `frontend`, `devops`

## Tiled Map Editor Workflow

Maps are designed in Tiled and exported as JSON to `assets/maps/`.

### Layers
| Layer | Purpose |
|-------|---------|
| `ground` | Base terrain (grass, paths) |
| `world` | Buildings, trees, decorations (depth 2, rendered above ground) |
| `collisions` | Invisible; any non-zero tile = blocked |
| `objects` | NPCs, doors, trainers, signs (Object layer, not tile layer) |
| `encounters` | Rectangles marking wild encounter zones |

### Object Types (set as Class/Type on the object)
| Type | Key Properties |
|------|---------------|
| `npc` | `dialog` (string, `\|` separates pages), `spriteKey`, `facing` |
| `trainer` | `trainerId`, `spriteKey`, `facing` |
| `gym_entrance` | `gymId`, `spriteKey`, `requiredBadges` |
| `heal` | `spriteKey` |
| `mart` | `martId`, `spriteKey` |
| `door` | `targetMap`, `targetX` (int), `targetY` (int), `facing` |
| `sign` | `text` |

### Encounter zones
Draw rectangle on `encounters` layer, add property: `encounterZone` = zone ID from encounters.json.

## Testing

Tests use Vitest. Source files are loaded into Node via `vm.runInThisContext` (see `tests/setup/testHelper.js`). Only pure logic is tested — no Phaser rendering.

### Test Categories
- **Unit tests**: GameMath, TypeChart, GemInstance, BattleManager, managers
- **Integration tests**: Save/load round-trip
- **Data integrity tests**: All JSON cross-references (gems in trainer parties exist, moves in learnsets exist, encounter zones match, etc.)

### Running Tests
```bash
npm test                    # run all
npx vitest run tests/unit   # run unit only
npx vitest run -t "damage"  # run tests matching "damage"
```

### After Changing JSON Data
The data integrity tests will catch broken references. Always run tests after modifying `src/data/*.json`.

## Debug Tools (Browser Console)

```javascript
DEBUG.healParty()           // Full heal
DEBUG.addGem('bullet', 15)  // Add gem at level
DEBUG.setMoney(9999)        // Set money
DEBUG.addBadge('test_pass') // Add badge
DEBUG.listGems()            // Show party table
DEBUG.gameState()           // Dump full state
DEBUG.deleteSave()          // Clear save

// During battle:
BATTLE_LOG                  // Array of all battle events with timestamps
copy(JSON.stringify(BATTLE_LOG, null, 2))  // Copy log to clipboard
```

### Badge IDs
`test_pass`, `security_pass`, `speed_pass`, `captains_pass`

### Gem IDs
`rspec`, `bullet`, `brakeman`, `devise`, `pundit`, `bcrypt`, `rack_mini_profiler`, `capybara`, `factory_bot`, `active_record`, `sidekiq`, `puma`, `turbo`, `pry`

### Trainer IDs
`test_minion_01`-`05`, `attendee_01`-`03`, `speaker_01`-`03`, `organizer_01`

### Sprite Keys
`npc01`-`npc07`, `npc09`, `npc10` (no `npc08`)

## Controls
- **Arrow keys** — Move
- **Z / Enter** — Confirm / Interact
- **X / Backspace** — Cancel / Back
- **M** — Open pause menu
