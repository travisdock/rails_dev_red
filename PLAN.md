# Rails Dev: Red Edition — Game Plan

## Context

A Pokemon Red/Blue-style web game themed around Ruby on Rails development. Players are web developers who collect Ruby gems (instead of Pokemon) and battle bugs, vulnerabilities, and performance issues encountered in codebases. The MVP is a single-map, client-only game with 4 towns, 4 gyms, and a complete gameplay loop from starter gem selection to defeating the final gym leader.

## Tech Stack

- **Phaser.js 3.80+** via CDN — 2D game framework with native tilemap, sprite, and scene support
- **Tiled Map Editor** — visual map design, exported as JSON (future; currently procedural)
- **Vanilla JavaScript** (no TypeScript for MVP simplicity)
- **localStorage** for save data (no backend)
- **16x16 pixel tiles** at 3x zoom (720x480 display), `pixelArt: true` for crisp scaling
- **Docker Compose** for local development

## Game Design

### Types (6)
`auth`, `performance`, `testing`, `database`, `frontend`, `devops`

### Type Effectiveness Chart

| Attacker \ Defender | Auth | Performance | Testing | Database | Frontend | DevOps |
|---------------------|------|-------------|---------|----------|----------|--------|
| **Auth**            | 1x   | 1x          | 0.5x    | 2x       | 1x       | 1x     |
| **Performance**     | 1x   | 0.5x        | 2x      | 1x       | 0.5x     | 2x     |
| **Testing**         | 2x   | 0.5x        | 0.5x    | 1x       | 2x       | 1x     |
| **Database**        | 0.5x | 1x          | 1x      | 0.5x     | 1x       | 2x     |
| **Frontend**        | 1x   | 2x          | 0.5x    | 1x       | 0.5x     | 1x     |
| **DevOps**          | 1x   | 0.5x        | 1x      | 0.5x     | 1x       | 0.5x   |

### Starter Gems (choose 1 in Prof. Matz's Lab)
- **Devise** (Auth) — balanced special attacker
- **RSpec** (Testing) — all-rounder
- **Sidekiq** (DevOps) — fast physical attacker

### All Gems

| Gem | Type | HP | Atk | Def | SpA | SpD | Spd | Role |
|-----|------|----|-----|-----|-----|-----|-----|------|
| Devise | Auth | 50 | 35 | 55 | 60 | 65 | 40 | Special attacker, starter |
| Pundit | Auth | 45 | 30 | 60 | 55 | 70 | 35 | Defensive |
| Bcrypt | Auth | 65 | 25 | 80 | 40 | 75 | 20 | Tank |
| Bullet | Performance | 40 | 55 | 30 | 65 | 35 | 70 | Fast special attacker |
| Rack-Mini-Profiler | Performance | 55 | 40 | 45 | 60 | 50 | 55 | Balanced |
| RSpec | Testing | 50 | 45 | 50 | 55 | 55 | 50 | All-rounder, starter |
| Capybara | Testing | 60 | 35 | 55 | 50 | 60 | 35 | Bulky |
| FactoryBot | Testing | 45 | 50 | 40 | 60 | 45 | 55 | Offensive |
| ActiveRecord | Database | 70 | 50 | 50 | 55 | 50 | 30 | HP tank |
| Sidekiq | DevOps | 55 | 60 | 45 | 50 | 40 | 55 | Physical attacker, starter |
| Puma | DevOps | 60 | 45 | 50 | 40 | 50 | 60 | Fast |
| Turbo | Frontend | 50 | 55 | 40 | 55 | 45 | 65 | Speed |
| Pry | Testing | 35 | 40 | 30 | 45 | 35 | 50 | Early-game |

### All Bugs (Wild Encounters)

| Bug | Type | Where Found | Notes |
|-----|------|-------------|-------|
| N+1 Query | Database | Route 1-2 | Common early bug |
| Nil Reference | Testing | Route 1-2 | Fast, fragile |
| Missing Template | Frontend | Route 1-2 | Easy |
| SQL Injection | Database | Route 2-3 | High attack |
| Memory Leak | Performance | Route 2-3 | Tanky, slow |
| Race Condition | DevOps | Route 2-3 | Very fast |
| XSS Attack | Auth | Route 3 | Glass cannon |
| CSRF Vuln | Auth | Route 3 | Mid-tier |
| Circular Dependency | Performance | Route 2 | Slow, bulky |
| Unhandled Promise | Frontend | Route 3 | Fast |

### Map Layout
```
                 PRODUCTION CITY (Gym 4: Database, "DBA Dan")
                         |
                     Route 3 (Lv 12-16, 3 trainers)
                         |
                    Crossroads
                    /         \
          Route 2 West     Route 2 East
          (Lv 7-11)       (Lv 7-11)
              |                 |
      STAGING SPRINGS    TESTING TERRACE
      (Gym 2: Perf,     (Gym 3: Testing,
       "Bench Mark")      "Tess Driven")
              \                /
          Route 2 West     Route 2 East
               \              /
                 Crossroads
                      |
                  Route 1 (Lv 3-6, 1 trainer)
                      |
                 LOCALHOST (Start)
                 Gym 1: Security, "Sarah Secure"
                 Prof. Matz's Lab
```

Each town has: Gym, CI/CD Center (heals party), Gem Mart (buy gems with battle winnings)

### Gym Leaders

| Leader | Town | Type | Badge | Party |
|--------|------|------|-------|-------|
| Sarah Secure | Localhost | Auth | SSL Badge | Pundit 14, Bcrypt 14, Devise 16 |
| Bench Mark | Staging Springs | Performance | Benchmark Badge | Rack-Mini-Profiler 18, Bullet 18, Puma 20 |
| Tess Driven | Testing Terrace | Testing | Green Badge | FactoryBot 18, Capybara 18, RSpec 20 |
| DBA Dan | Production City | Database | Migration Badge | ActiveRecord 23, Bullet 22, Sidekiq 22, ActiveRecord 25 |

### Route Trainers

| Trainer | Location | Party |
|---------|----------|-------|
| Junior Dev Alex | Route 1 | Pry 5 |
| Developer Blake | Route 2 West | Pry 8, FactoryBot 9 |
| Developer Dana | Route 2 West | Bullet 9, Puma 8 |
| Developer Casey | Route 2 East | RSpec 9, Capybara 8 |
| Senior Dev Ellis | Route 3 | Devise 13, Sidekiq 12, ActiveRecord 14 |
| Senior Dev Frankie | Route 3 | Turbo 13, RSpec 13, Bullet 14 |
| Senior Dev Gray | Route 3 | ActiveRecord 14, Pundit 13, Rack-Mini-Profiler 15 |

### Battle System
- Pokemon Gen 1-style turn-based combat
- 4 moves per gem, PP system, type effectiveness (2x/0.5x/1x)
- STAB (Same Type Attack Bonus) = 1.5x
- Damage formula: `((2*level/5+2) * power * atk/def / 50 + 2) * STAB * typeEff * random(0.85,1.0)`
- XP from battles, cubic leveling curve (`level^3`), learn moves at specific levels
- Stat stages: +1 = 1.5x, -1 = 0.67x, clamped to [-6, +6]
- Wild encounters in tall grass (~15% per step)
- Money from trainer wins, used at Gem Mart
- Lose = blackout, return to Localhost, lose half money, party healed

### Data-Driven Architecture
All content defined in JSON config files for easy extensibility:
- `src/data/gems.json` — gem definitions (base stats, learnsets, types)
- `src/data/bugs.json` — wild encounter definitions
- `src/data/moves.json` — move definitions (power, accuracy, type, effects)
- `src/data/trainers.json` — trainer parties and dialogue
- `src/data/gym-leaders.json` — gym leader parties, badges, dialogue
- `src/data/encounters.json` — per-route encounter tables with level ranges
- `src/data/type-chart.json` — 6x6 type effectiveness matrix
- `src/data/marts.json` — per-town shop inventories

## Project Structure

```
rails-quest/
├── index.html                     # Entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
├── PLAN.md                        # This file
├── src/
│   ├── main.js                    # Phaser config, boot, DEBUG tools
│   ├── constants.js               # TILE_SIZE, SCALE, type colors, etc.
│   ├── scenes/
│   │   ├── BootScene.js           # Minimal boot
│   │   ├── PreloadScene.js        # Load all assets + JSON data
│   │   ├── TitleScene.js          # Title screen, New/Continue
│   │   ├── OverworldScene.js      # Map, movement, NPCs, encounters, transitions
│   │   ├── BattleScene.js         # Battle rendering, event queue, animations
│   │   ├── BattleUIScene.js       # (placeholder for future extraction)
│   │   ├── DialogScene.js         # (placeholder for future extraction)
│   │   ├── MenuScene.js           # Pause menu (Party, Save, Close)
│   │   ├── PartyScene.js          # View gem party stats
│   │   ├── MartScene.js           # Shop UI
│   │   └── HealScene.js          # (placeholder for future extraction)
│   ├── systems/
│   │   ├── BattleManager.js       # Pure battle logic (turns, damage, XP)
│   │   ├── EncounterManager.js    # Wild encounter checks
│   │   ├── PartyManager.js        # Party CRUD, healing
│   │   ├── InventoryManager.js    # Money management
│   │   ├── SaveManager.js         # localStorage save/load
│   │   ├── DialogManager.js       # Typewriter text, message queue
│   │   └── ProgressManager.js     # Badges, defeated trainers, flags
│   ├── entities/
│   │   ├── Player.js              # Grid movement via tweens, input
│   │   ├── NPC.js                 # Sprite, facing, interaction zone
│   │   ├── Trainer.js             # NPC + line-of-sight, party
│   │   └── GemInstance.js         # Runtime gem/bug state (HP, XP, moves)
│   ├── data/                      # All JSON config files
│   ├── ui/
│   │   ├── TextBox.js             # Bordered text box
│   │   ├── BattleHUD.js           # HP bars, level display
│   │   ├── MenuBox.js             # Selectable option list
│   │   └── TransitionFX.js        # Fade/flash transitions
│   └── utils/
│       ├── math.js                # Damage formula, XP curve, weighted random
│       ├── grid.js                # Tile/pixel conversions
│       └── typeEffectiveness.js   # Type chart lookups
├── assets/
│   ├── tilesets/                  # Tileset PNGs (future)
│   ├── sprites/                   # Spritesheets (future)
│   ├── maps/                      # Tiled JSON exports (placeholder stubs)
│   ├── ui/                        # UI assets (future)
│   └── fonts/                     # Game Boy-style font (future)
└── tools/
    └── placeholder-gen.html       # (future) Generate placeholder sprites
```

## Controls

- **Arrow keys** — Move
- **Z / Enter** — Confirm / Interact
- **X / Backspace** — Cancel / Menu
- **M** — Open pause menu

## Implementation Status

### Phase 1: Scaffolding + Overworld — DONE
- [x] Phaser config, boot/preload/title pipeline
- [x] Player grid movement with tween-based stepping
- [x] Procedural map generation for all 8 areas
- [x] Camera follow, collision detection
- [x] Zone transitions with fade effects
- [x] Docker Compose setup

### Phase 2: Dialogue + NPCs — DONE
- [x] DialogManager with typewriter effect
- [x] NPC interaction on action key
- [x] Sign/readable object support

### Phase 3: Data Layer + Gem System — DONE
- [x] All JSON data files populated (13 gems, 10 bugs, 30 moves)
- [x] GemInstance class with stats, leveling, move learning
- [x] BugInstance class for wild encounters
- [x] PartyManager, InventoryManager
- [x] Type effectiveness system

### Phase 4: Battle System — DONE
- [x] BattleManager with turn-based logic
- [x] Damage formula, STAB, type effectiveness
- [x] Stat stages (+/- modifiers)
- [x] BattleScene with event queue system (drainQueue)
- [x] HP bar animations, shake effects
- [x] Mid-turn messages auto-advance, final message waits for input
- [x] Battle logging (window.BATTLE_LOG) for debugging

### Phase 5: Wild Encounters — DONE
- [x] EncounterManager with per-route tables
- [x] Weighted random bug selection with level ranges
- [x] Run mechanic (speed-based escape chance)

### Phase 6: Trainer Battles — DONE
- [x] Trainer entity with line-of-sight
- [x] Pre/post battle dialogue
- [x] Prize money, defeated tracking
- [x] No re-battles after defeat

### Phase 7: Towns + Services — DONE
- [x] 4 towns with CI/CD Centers and Gem Marts
- [x] Healing restores all HP and PP
- [x] Shop UI with buy confirmation

### Phase 8: Gym Battles + Progression — DONE
- [x] 4 gym leaders with badge rewards
- [x] Badge-gated routes (1 badge for Route 2, 2 badges for Route 3)
- [x] Victory condition (beat all 4 gyms)

### Phase 9: Menus + Save/Load — DONE
- [x] Pause menu (Party, Save, Close)
- [x] Party screen with stats
- [x] Save/Load via localStorage
- [x] Continue option on title screen

### Phase 10: Polish + Content — IN PROGRESS
- [x] Battle event system rewrite (drainQueue approach)
- [x] Battle debug logging
- [x] Bug fixes: scene state reset, key lifecycle, switch-in HP snapshot, faint after switch
- [x] Bug fixes: door collision on borders, encounter zone ID mismatch, double trainer dialogue
- [x] Full playthrough tested (starter → all 4 gyms → victory)
- [ ] Balance gem stats, move powers, encounter rates
- [ ] More NPC dialogue variety
- [ ] Battle animations polish

## Future Phases (Post-MVP)

### Phase 11: Pixel Art + Tiled Maps
- Replace colored rectangles with 16x16 pixel art sprites
- Create proper tilemaps in Tiled editor
- Interior maps for gyms, marts, CI/CD centers
- Walk cycle animations for player and NPCs
- Battle sprites (48x48 front/back) for all gems and bugs

### Phase 12: Audio
- Chiptune overworld music
- Battle music (normal + gym leader variant)
- Victory jingle
- Sound effects (menu select, damage, faint, level up, heal)

### Phase 13: Enhanced Battle Features
- Move learning choice when party has 4 moves
- Gym puzzle trainers (must defeat in order before leader)
- Critical hits
- Multi-hit moves
- Status conditions (burned, frozen, etc.)

### Phase 14: Enhanced Overworld
- More NPC types (Product Managers, QA, Customers)
- Items on the ground
- Hidden items
- Ledges (one-way jumps)
- Cut/Surf equivalent abilities

### Phase 15: Rails Backend
- User accounts
- Save data on server (cross-device play)
- Leaderboards
- Multiplayer trainer battles

### Phase 16: Content Expansion
- New maps / regions
- More gems, bugs, and moves
- Side quests
- Post-game content (harder encounters, legendary bugs)
- Evil team storyline ("Team Monolith")

## Known Issues / Tech Debt

- Maps are procedurally generated — should migrate to Tiled JSON maps for visual editing
- Leveling/grinding is slow on Route 1 — balance pass needed
- No move learning choice when party has 4 moves (auto-replaces oldest)
- Battle logging is always on — should be behind a debug flag for production

## Lessons Learned (Bug Patterns)

- Phaser reuses scene objects across stop/launch cycles — all state must be explicitly reset in `create()`
- MenuBox key objects are shared across the scene — `destroy()` must not call `key.destroy()`
- MenuBox `onSelect` callback can destroy the menu mid-update — `update()` must return after `onSelect`
- BattleManager applies damage during event generation, not display — switch events must snapshot HP values
- Encounter zone IDs must match between code (`generateRoute` arg) and `encounters.json` keys
- Door tiles on map borders need collision cleared explicitly after map generation
- Multiple timers / promise-based event chains are fragile in Phaser — simple sequential `drainQueue` with `delayedCall` is more reliable

## Debug Tools

Browser console:
- `DEBUG.healParty()` — full heal
- `DEBUG.addGem(id, level)` — add gem to party
- `DEBUG.setMoney(amount)` — set money
- `DEBUG.addBadge(badgeId)` — add badge
- `DEBUG.listGems()` — table of party
- `DEBUG.gameState()` — dump full state
- `DEBUG.deleteSave()` — clear save data

Battle debugging:
- `BATTLE_LOG` — array of all battle events with timestamps
- `copy(JSON.stringify(BATTLE_LOG, null, 2))` — copy log to clipboard
