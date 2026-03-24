# Tiled Map Editor Setup

## Install Tiled
Download from https://www.mapeditor.org/ (free)

## Open a Map
Open any `.tmx` file in this folder (e.g., `localhost.tmx`).

The tilesets (`grass.tsx`, `path.tsx`) will load automatically — they reference the PNG files in `assets/tilesets/`.

## Layers

Each map has these layers (paint on the right one!):

| Layer | What to paint | Notes |
|-------|--------------|-------|
| **ground** | Grass and dirt path tiles | The base terrain. Fill everything with grass first, then paint paths. |
| **world** | Buildings, trees, decorations | Rendered on top of ground. |
| **collisions** | Blocked tiles | Use ANY tile to mark a cell as blocked (walls, trees, water). This layer is invisible in-game. |
| **objects** | NPCs, doors, signs, trainers | This is an Object Layer — place rectangles, not tiles. See below. |
| **encounters** | Tall grass zones | Mark areas where wild encounters happen. |

## How to Paint Tiles

1. Select a layer (e.g., "ground") in the Layers panel
2. Select a tile from the tileset panel on the right
3. Click/drag to paint on the map
4. Use the Fill tool (bucket icon) to fill large areas quickly

### Recommended Workflow
1. Select the "ground" layer
2. Fill the entire map with a grass tile (select a grass tile, then use Edit > Fill Area or the bucket tool)
3. Paint dirt paths where you want walkable roads
4. Switch to "world" layer for buildings and trees
5. Switch to "collisions" layer and paint over anything the player shouldn't walk through (border, buildings, trees, water)

## Placing Objects

Switch to the "objects" layer, then use the Rectangle tool to place objects. Set these **Custom Properties** on each object (right-click > Object Properties):

### NPC
- **type**: `npc`
- **name**: NPC's display name (e.g., "Ruby Fan")
- **dialog**: What they say (e.g., "I love Ruby!\nIt's so elegant!")

### Trainer
- **type**: `trainer`
- **trainerId**: Must match a key in `src/data/trainers.json` (e.g., "junior_dev_01")
- **facing**: `down`, `up`, `left`, or `right`

### Gym Leader
- **type**: `gym_entrance`
- **gymId**: Must match a key in `src/data/gym-leaders.json` (e.g., "sarah_security")
- **requiredBadges**: Number of badges needed to challenge (e.g., 0)

### Door / Map Transition
- **type**: `door`
- **targetMap**: Map key to transition to (e.g., "route1")
- **targetX**: X tile to spawn at in target map
- **targetY**: Y tile to spawn at in target map
- **facing**: Direction player faces after transition
- **requiredBadges**: (optional) Badges needed to pass
- **blockMessage**: (optional) Message shown if blocked

### Sign
- **type**: `sign`
- **text**: What the sign says

### CI/CD Center (Healer)
- **type**: `heal`
- **name**: "CI/CD Center"

### Gem Mart (Shop)
- **type**: `mart`
- **martId**: Must match a key in `src/data/marts.json` (e.g., "localhost")

## Map Sizes

Current map sizes (width x height in tiles):

| Map | Size | Notes |
|-----|------|-------|
| Localhost | 20 x 18 | Starting town |
| Route 1 | 10 x 20 | Vertical route |
| Crossroads | 20 x 20 | Route split |
| Route 2 West | 10 x 20 | To Staging Springs |
| Route 2 East | 10 x 20 | To Testing Terrace |
| Route 3 | 10 x 25 | To Production City |
| Staging Springs | 20 x 16 | Performance town |
| Testing Terrace | 20 x 16 | Testing town |
| Production City | 24 x 18 | Final town |

## Exporting

When done editing, go to **File > Export As** and save as JSON (`.json`) into `assets/maps/`. Use the map key as the filename:
- `localhost.json`
- `route1.json`
- `route2_west.json`
- etc.

Make sure to select **"JSON map files (*.json)"** as the format.

## Tileset Reference

### grass.tsx (tiles 1-72 in Tiled)
- Solid grass varieties: row 1-4, cols 1-3 (good for ground fill)
- Edge/transition tiles: scattered around for grass-to-transparent borders

### path.tsx (tiles 73-120 in Tiled)
- Pure dirt: tile 91 (row 1, col 6 of path.png)
- Grass-dirt transitions: edges and corners for smooth path borders
- Use these to paint roads and walkways
