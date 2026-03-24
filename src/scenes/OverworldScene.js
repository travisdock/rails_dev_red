class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data) {
    this.mapKey = data.mapKey || 'localhost';
    this.startX = data.playerX || 10;
    this.startY = data.playerY || 12;
    this.startFacing = data.facing || 'down';
    this.starterChosen = data.starterChosen || false;
  }

  create() {
    this.npcs = [];
    this.trainers = [];
    this.signs = [];
    this.doors = [];
    this.dialogManager = new DialogManager(this);
    this.inDialog = false;
    this.inMenu = false;

    this.loadMap(this.mapKey);
    this.player = new Player(this, this.startX, this.startY);
    this.player.facing = this.startFacing;
    if (this.player.hasSprite) {
      this.player.sprite.play(`player-idle-${this.startFacing}`, true);
    }

    // Camera
    this.cameras.main.startFollow(this.player.sprite, true);
    this.cameras.main.setRoundPixels(true);
    if (this.mapWidth && this.mapHeight) {
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    // Fade in
    TransitionFX.fadeIn(this, 300);

    // Intro and starter selection on new game
    if (!ProgressManager.hasSeenStory('intro') && this.mapKey === 'hotel') {
      ProgressManager.seeStory('intro');
      this.player.freeze();
      this.time.delayedCall(400, () => {
        this.dialogManager.show([
          "Welcome to Albuquerque!",
          "You're here for Blastoff Rails,\nthe conference that's literally\nout of this world!",
          "To board the rocket, you'll\nneed to earn Boarding Passes\nfrom four challenge masters.",
          "But first, you'll need\na gem to get started!"
        ], () => {
          this.player.unfreeze();
          if (!this.starterChosen) {
            this.showStarterSelection();
          }
        });
      });
    } else if (!this.starterChosen && this.mapKey === 'hotel') {
      this.time.delayedCall(500, () => this.showStarterSelection());
    }
  }

  loadMap(mapKey) {
    const mapData = this.cache.json.get('map-' + mapKey);
    // Use Tiled JSON if it has layers, otherwise fall back to procedural
    if (mapData && mapData.layers) {
      this.loadTiledMap(mapData, mapKey);
      return;
    }
    this.createProceduralMap(mapKey);
  }

  loadTiledMap(mapData, mapKey) {
    const width = mapData.width;
    const height = mapData.height;
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = null;
    this.hasTiledObjects = false;

    // Initialize collision map
    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = new Array(width).fill(0);
    }

    // Build tileset lookup: GID -> { textureKey, frameIndex }
    const tilesetLookup = {};
    for (const ts of mapData.tilesets) {
      // Determine which spritesheet this tileset maps to
      let textureKey = null;
      if (ts.source && ts.source.includes('grass')) textureKey = 'tiles-grass';
      else if (ts.source && ts.source.includes('path')) textureKey = 'tiles-path';
      else if (ts.source && ts.source.includes('trees')) textureKey = 'tiles-trees';
      else if (ts.source && ts.source.includes('elements')) textureKey = 'tiles-elements';
      else if (ts.source && ts.source.includes('interior')) textureKey = 'tiles-interior';
      else if (ts.source && ts.source.includes('floor')) textureKey = 'tiles-floor';

      if (textureKey && this.textures.exists(textureKey)) {
        // Map each GID to the texture + local frame index
        const firstgid = ts.firstgid;
        // We need tilecount from the tileset; estimate from texture
        const tex = this.textures.get(textureKey);
        const frameNames = tex.getFrameNames();
        const frameCount = frameNames.length || 100; // fallback
        for (let i = 0; i < frameCount; i++) {
          tilesetLookup[firstgid + i] = { key: textureKey, frame: i };
        }
      }
    }

    // Render tile layers
    for (const layer of mapData.layers) {
      if (layer.type === 'tilelayer' && layer.data) {
        const depth = layer.name === 'world' ? 2 : (layer.name === 'above' ? 10 : 0);
        const isCollision = layer.name === 'collisions';

        for (let i = 0; i < layer.data.length; i++) {
          const gid = layer.data[i];
          if (gid === 0) continue; // empty tile

          const x = i % width;
          const y = Math.floor(i / width);

          if (isCollision) {
            // Any non-zero tile on collision layer = blocked
            this.collisionMap[y][x] = 1;
            continue;
          }

          const tileInfo = tilesetLookup[gid];
          if (tileInfo) {
            this.add.sprite(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              tileInfo.key, tileInfo.frame
            ).setDepth(depth);
          }
        }
      }

      // Parse object layers for encounters
      if (layer.type === 'objectgroup' && layer.name === 'encounters') {
        for (const obj of layer.objects) {
          const startX = Math.floor(obj.x / TILE_SIZE);
          const startY = Math.floor(obj.y / TILE_SIZE);
          const endX = startX + Math.max(1, Math.ceil(obj.width / TILE_SIZE));
          const endY = startY + Math.max(1, Math.ceil(obj.height / TILE_SIZE));
          for (let gy = startY; gy < endY; gy++) {
            for (let gx = startX; gx < endX; gx++) {
              this.grassTiles.push({ x: gx, y: gy });
            }
          }
          if (obj.properties) {
            for (const prop of obj.properties) {
              if (prop.name === 'encounterZone') {
                this.encounterZone = prop.value;
              }
            }
          }
        }
      }

      // Parse object layers for NPCs, doors, trainers, etc.
      if (layer.type === 'objectgroup' && layer.name === 'objects') {
        const tiledObjects = [];
        for (const obj of layer.objects) {
          const tileX = Math.floor(obj.x / TILE_SIZE);
          const tileY = Math.floor(obj.y / TILE_SIZE);

          // Convert Tiled properties array to a flat object
          const props = {};
          if (obj.properties) {
            for (const prop of obj.properties) {
              props[prop.name] = prop.value;
            }
          }

          const parsed = {
            type: obj.type,
            x: tileX,
            y: tileY,
            name: obj.name || props.name,
            dialog: props.dialog ? props.dialog.split('|') : undefined,
            facing: props.facing,
            spriteKey: props.spriteKey,
            trainerId: props.trainerId,
            gymId: props.gymId,
            badge: props.badge,
            requiredBadges: props.requiredBadges ? parseInt(props.requiredBadges) : undefined,
            targetMap: props.targetMap,
            targetX: props.targetX ? parseInt(props.targetX) : undefined,
            targetY: props.targetY ? parseInt(props.targetY) : undefined,
            blockMessage: props.blockMessage,
            martId: props.martId,
            text: props.text
          };

          tiledObjects.push(parsed);
        }

        if (tiledObjects.length > 0) {
          this.hasTiledObjects = true;
          this.processObjects(tiledObjects);
        }
      }
    }

    // Fall back to procedural objects if no objects were defined in Tiled
    if (!this.hasTiledObjects) {
      this.loadProceduralObjects(mapKey);
    }

    // Town name label
    const names = {
      'hotel': 'The Hotel', 'old-town': 'Old Town',
      'park': 'The Park', 'venue': 'The Venue'
    };
    const displayName = names[mapKey] || mapKey;
    this.add.text(this.mapWidth / 2, 12, displayName, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff',
      backgroundColor: '#33333388', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
  }

  // Load NPC/door/trainer objects from the procedural definitions
  // (used until objects are placed in Tiled)
  loadProceduralObjects(mapKey) {
    const objectDefs = {
      // hotel: all objects defined in Tiled
      'old-town': [
        { type: 'npc', x: 5, y: 8, name: 'Local Guide', dialog: ["Old Town has been here\nsince 1706. Watch out for\nsecurity bugs in the\nold code!"], spriteKey: 'npc09' },
        { type: 'npc', x: 15, y: 12, name: 'Souvenir Seller', dialog: ["Buy a gem, take on\nthe world!"], spriteKey: 'npc03' },
        { type: 'heal', x: 3, y: 5, name: 'Old Town Clinic', spriteKey: 'npc05' },
        { type: 'mart', x: 17, y: 5, name: 'Old Town Gem Shop', martId: 'old_town', spriteKey: 'npc04' },
        { type: 'gym_entrance', x: 10, y: 3, gymId: 'greg_molnar', requiredBadges: 1, name: 'Security Audit', spriteKey: 'npc06' },
        { type: 'door', x: 10, y: 19, targetMap: 'hotel', targetX: 10, targetY: 1, facing: 'down' },
        { type: 'door', x: 10, y: 0, targetMap: 'park', targetX: 10, targetY: 18, facing: 'up' },
        { type: 'sign', x: 10, y: 2, text: 'Security Audit Room\nChallenger: Greg Molnar' },
        { type: 'trainer', x: 8, y: 10, trainerId: 'attendee_02', facing: 'right', spriteKey: 'npc01' },
        { type: 'trainer', x: 14, y: 8, trainerId: 'attendee_03', facing: 'left', spriteKey: 'npc10' }
      ],
      'park': [
        { type: 'npc', x: 6, y: 10, name: 'Jogger', dialog: ["Running in production\nis like running in the park.\nYou gotta go fast!"], spriteKey: 'npc09' },
        { type: 'heal', x: 3, y: 5, name: 'Park First Aid', spriteKey: 'npc05' },
        { type: 'mart', x: 17, y: 5, name: 'Park Vendor', martId: 'park', spriteKey: 'npc04' },
        { type: 'gym_entrance', x: 10, y: 3, gymId: 'nate_berkopec', requiredBadges: 2, name: 'Performance Lab', spriteKey: 'npc10' },
        { type: 'door', x: 10, y: 19, targetMap: 'old-town', targetX: 10, targetY: 1, facing: 'down' },
        { type: 'door', x: 10, y: 0, targetMap: 'venue', targetX: 10, targetY: 18, facing: 'up' },
        { type: 'sign', x: 10, y: 2, text: 'Performance Lab\nChallenger: Nate Berkopec' },
        { type: 'trainer', x: 5, y: 8, trainerId: 'speaker_01', facing: 'right', spriteKey: 'npc02' },
        { type: 'trainer', x: 15, y: 14, trainerId: 'speaker_02', facing: 'left', spriteKey: 'npc06' },
        { type: 'trainer', x: 8, y: 16, trainerId: 'speaker_03', facing: 'down', spriteKey: 'npc10' }
      ],
      'venue': [
        { type: 'npc', x: 6, y: 10, name: 'Volunteer', dialog: ["The rocket is almost ready!\nDefeat DHH to earn your\nCaptain's Pass!"], spriteKey: 'npc03' },
        { type: 'npc', x: 16, y: 8, name: 'Mission Control', dialog: ["All systems nominal.\nAwaiting final passenger\nclearance..."], spriteKey: 'npc09' },
        { type: 'heal', x: 3, y: 5, name: 'Venue Med Bay', spriteKey: 'npc05' },
        { type: 'mart', x: 17, y: 5, name: 'Conference Merch Booth', martId: 'venue', spriteKey: 'npc04' },
        { type: 'gym_entrance', x: 10, y: 3, gymId: 'dhh', requiredBadges: 3, name: 'The Launch Pad', spriteKey: 'npc06' },
        { type: 'door', x: 10, y: 19, targetMap: 'park', targetX: 10, targetY: 1, facing: 'down' },
        { type: 'sign', x: 10, y: 2, text: 'The Launch Pad\nFinal Challenge: DHH' },
        { type: 'trainer', x: 7, y: 14, trainerId: 'organizer_01', facing: 'right', spriteKey: 'npc06' }
      ]
    };
    const objects = objectDefs[mapKey];
    if (objects) {
      this.processObjects(objects);
    }
  }

  createProceduralMap(mapKey) {
    // Generate maps programmatically for MVP (until Tiled maps are created)
    const maps = {
      'localhost': () => this.generateTown('localhost', 20, 18, 'Localhost', [
        { type: 'npc', x: 5, y: 8, name: 'Ruby Fan', dialog: ["I love coding in Ruby!\nIt's so elegant!"] },
        { type: 'npc', x: 14, y: 6, name: 'Gem Collector', dialog: ["Have you visited the Gem Mart?\nThey have great deals!"] },
        { type: 'sign', x: 10, y: 5, text: 'Prof. Matz\'s Lab\n"Choose your first gem!"' },
        { type: 'sign', x: 10, y: 2, text: 'Route 1 - North\n"Beware of bugs in the grass!"' },
        { type: 'heal', x: 3, y: 5, name: 'CI/CD Center' },
        { type: 'mart', x: 17, y: 5, name: 'Gem Mart', martId: 'localhost' },
        { type: 'gym_entrance', x: 7, y: 3, gymId: 'sarah_security', badge: 'ssl_badge', name: 'Security Gym' },
        { type: 'door', x: 10, y: 1, targetMap: 'route1', targetX: 5, targetY: 18, facing: 'up' }
      ]),
      'hotel': () => this.generateTown('hotel', 30, 20, 'The Hotel', []),
      'old-town': () => this.generateTown('old-town', 40, 40, 'Old Town', []),
      'park': () => this.generateTown('park', 40, 40, 'The Park', []),
      'venue': () => this.generateTown('venue', 30, 30, 'The Venue', [])
    };

    const generator = maps[mapKey];
    if (generator) {
      generator();
    } else {
      this.generateTown(mapKey, 20, 16, mapKey, []);
    }
  }

  // Tile indices in the path tileset (12 cols per row)
  // We map based on which neighbors are path/dirt vs grass
  getPathTileIndex(x, y, isPathFn) {
    const up = isPathFn(x, y - 1);
    const down = isPathFn(x, y + 1);
    const left = isPathFn(x - 1, y);
    const right = isPathFn(x + 1, y);

    // Pure dirt (surrounded by path)
    if (up && down && left && right) return 18; // row1,col6

    // Edges (grass on one side)
    if (!up && down && left && right) return 5;    // top edge
    if (up && !down && left && right) return 29;   // bottom edge
    if (up && down && !left && right) return 16;   // left edge
    if (up && down && left && !right) return 8;    // right edge

    // Corners
    if (!up && !left && down && right) return 4;   // top-left corner
    if (!up && !right && down && left) return 6;   // top-right corner
    if (!down && !left && up && right) return 28;  // bottom-left corner
    if (!down && !right && up && left) return 30;  // bottom-right corner

    // Dead ends / single tiles
    if (!up && !down && left && right) return 18;  // horizontal
    if (up && down && !left && !right) return 18;  // vertical

    // Fallback to plain dirt
    return 18;
  }

  placeTile(x, y, frameIndex) {
    if (this.textures.exists('tiles-path')) {
      this.add.sprite(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        'tiles-path', frameIndex
      ).setDepth(0);
    }
  }

  placeGrassTile(x, y) {
    // Use grass tileset if available, with random variation
    if (this.textures.exists('tiles-grass')) {
      // Grass tiles: row1-4, cols 1-3 = indices 13,14,15, 25,26,27, 37,38,39, 49,50,51
      // Use a few variations for visual interest, seeded by position for consistency
      const variations = [13, 14, 25, 26, 37, 38];
      const idx = variations[(x * 7 + y * 13) % variations.length];
      this.add.sprite(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        'tiles-grass', idx
      ).setDepth(0);
    } else if (this.textures.exists('tiles-path')) {
      this.add.sprite(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        'tiles-path', 3
      ).setDepth(0);
    }
  }

  generateTown(mapKey, width, height, name, objects) {
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = null;

    const hasTiles = this.textures.exists('tiles-path');
    const gfx = this.add.graphics();

    const isPathTile = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
      return (tx >= 9 && tx <= 11) || (ty >= 4 && ty <= 6);
    };

    // Draw ground
    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        const isPath = isPathTile(x, y);

        if (isBorder) {
          this.collisionMap[y][x] = 1;
          if (hasTiles) {
            this.placeGrassTile(x, y);
          } else {
            gfx.fillStyle(0x556655, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else if (isPath) {
          this.collisionMap[y][x] = 0;
          if (hasTiles) {
            const tileIdx = this.getPathTileIndex(x, y, isPathTile);
            this.placeTile(x, y, tileIdx);
          } else {
            gfx.fillStyle(0xddccaa, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else {
          this.collisionMap[y][x] = 0;
          if (hasTiles) {
            this.placeGrassTile(x, y);
          } else {
            gfx.fillStyle(0x88bb66, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Draw buildings
    this.drawBuilding(gfx, 2, 4, 3, 2, 0xee5544, 'CI/CD');
    this.drawBuilding(gfx, 15, 4, 3, 2, 0x4488ee, 'MART');

    // Town name label
    this.add.text(width * TILE_SIZE / 2, 12, name, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff',
      backgroundColor: '#33333388', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.processObjects(objects);
  }

  generateRoute(encounterZone, width, height, name, objects) {
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = encounterZone;

    const hasTiles = this.textures.exists('tiles-path');
    const gfx = this.add.graphics();

    const isPathTile = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
      return tx >= 4 && tx <= 6;
    };

    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const isBorder = x === 0 || x === width - 1;
        const isPath = isPathTile(x, y);
        const isGrass = !isBorder && !isPath;

        if (isBorder) {
          this.collisionMap[y][x] = 1;
          if (hasTiles) {
            this.placeGrassTile(x, y);
          } else {
            gfx.fillStyle(0x446644, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else if (isPath) {
          this.collisionMap[y][x] = 0;
          if (hasTiles) {
            const tileIdx = this.getPathTileIndex(x, y, isPathTile);
            this.placeTile(x, y, tileIdx);
          } else {
            gfx.fillStyle(0xccbb99, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else if (isGrass) {
          this.collisionMap[y][x] = 0;
          this.grassTiles.push({ x, y });
          if (hasTiles) {
            // Use grass tile for encounter grass (darker or same grass for now)
            this.placeGrassTile(x, y);
            // Add a visual indicator for tall grass (tufts overlay)
            const tufts = this.add.graphics();
            tufts.fillStyle(0x338822, 1);
            tufts.fillRect(x * TILE_SIZE + 3, y * TILE_SIZE + 6, 2, 5);
            tufts.fillRect(x * TILE_SIZE + 7, y * TILE_SIZE + 4, 2, 7);
            tufts.fillRect(x * TILE_SIZE + 11, y * TILE_SIZE + 7, 2, 4);
            tufts.setDepth(1);
          } else {
            gfx.fillStyle(0x44aa33, 1);
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            gfx.fillStyle(0x338822, 1);
            gfx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 4, 2, 6);
            gfx.fillRect(x * TILE_SIZE + 7, y * TILE_SIZE + 2, 2, 8);
            gfx.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 5, 2, 5);
          }
        }
      }
    }

    // Route name label
    this.add.text(GAME_WIDTH / 2, 12, name, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff',
      backgroundColor: '#33333388', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.processObjects(objects);
  }

  generateSplitRoute() {
    const width = 20;
    const height = 20;
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = 'route_1'; // Use route 1 encounters for the split area

    const gfx = this.add.graphics();

    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
        // Center path from south
        const isSouthPath = (x >= 9 && x <= 11) && y >= 15;
        // Split paths
        const isWestPath = (x >= 2 && x <= 5) && y <= 4;
        const isEastPath = (x >= 14 && x <= 17) && y <= 4;
        // North path
        const isNorthPath = (x >= 9 && x <= 11) && y <= 4;
        // Connecting horizontal
        const isConnector = y >= 8 && y <= 10 && ((x >= 3 && x <= 17));
        // Vertical connectors
        const isWestVertical = (x >= 3 && x <= 5) && y >= 4 && y <= 10;
        const isEastVertical = (x >= 15 && x <= 17) && y >= 4 && y <= 10;
        const isCenterVertical = (x >= 9 && x <= 11) && y >= 10 && y <= 15;
        const isNorthVertical = (x >= 9 && x <= 11) && y >= 2 && y <= 10;

        const isPath = isSouthPath || isWestPath || isEastPath || isNorthPath ||
                      isConnector || isWestVertical || isEastVertical ||
                      isCenterVertical || isNorthVertical;

        if (isBorder && !isPath) {
          gfx.fillStyle(0x446644, 1);
          this.collisionMap[y][x] = 1;
        } else if (isPath) {
          gfx.fillStyle(0xccbb99, 1);
          this.collisionMap[y][x] = 0;
        } else {
          gfx.fillStyle(0x88bb66, 1);
          this.collisionMap[y][x] = isBorder ? 1 : 0;
        }
        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Label
    this.add.text(GAME_WIDTH / 2, 12, 'Crossroads', {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff',
      backgroundColor: '#33333388', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Signs
    this.processObjects([
      { type: 'sign', x: 7, y: 9, text: '<- Staging Springs\n   (Performance Gym)' },
      { type: 'sign', x: 13, y: 9, text: 'Testing Terrace ->\n   (Testing Gym)' },
      { type: 'sign', x: 10, y: 5, text: 'Route 3 North\n-> Production City\n(Need 2+ badges)' },
      { type: 'door', x: 10, y: 19, targetMap: 'route1', targetX: 5, targetY: 1, facing: 'down' },
      { type: 'door', x: 4, y: 0, targetMap: 'route2-west', targetX: 5, targetY: 18, facing: 'up' },
      { type: 'door', x: 16, y: 0, targetMap: 'route2-east', targetX: 5, targetY: 18, facing: 'up' },
      { type: 'door', x: 10, y: 0, targetMap: 'route3', targetX: 5, targetY: 23, facing: 'up',
        requiredBadges: 2, blockMessage: "You need at least 2 badges\nto enter Route 3!" }
    ]);
  }

  drawBuilding(gfx, x, y, w, h, color, label) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const pw = w * TILE_SIZE;
    const ph = h * TILE_SIZE;

    gfx.fillStyle(color, 1);
    gfx.fillRect(px, py, pw, ph);
    gfx.lineStyle(2, 0x333333, 1);
    gfx.strokeRect(px, py, pw, ph);

    // Roof
    gfx.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(20).color, 1);
    gfx.fillRect(px - 2, py - 4, pw + 4, 6);

    if (label) {
      this.add.text(px + pw / 2, py + ph / 2, label, {
        fontFamily: 'monospace', fontSize: '6px', color: '#ffffff'
      }).setOrigin(0.5).setDepth(10);
    }

    // Block tiles
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        if (this.collisionMap[ty]) this.collisionMap[ty][tx] = 1;
      }
    }
  }

  processObjects(objects) {
    for (const obj of objects) {
      switch (obj.type) {
        case 'npc':
          this.npcs.push(new NPC(this, obj.x, obj.y, {
            name: obj.name,
            dialog: obj.dialog,
            color: obj.color || 0x4488cc,
            facing: obj.facing || 'down',
            spriteKey: obj.spriteKey || null
          }));
          break;

        case 'trainer': {
          const trainerDef = window.GAME_DATA.trainers[obj.trainerId];
          if (trainerDef) {
            const t = new Trainer(this, obj.x, obj.y, {
              ...trainerDef,
              facing: obj.facing || 'down',
              spriteKey: obj.spriteKey || null
            });
            this.trainers.push(t);
            this.npcs.push(t);
          }
          break;
        }

        case 'sign':
          this.signs.push({ x: obj.x, y: obj.y, text: obj.text });
          // Draw sign post
          const signGfx = this.add.graphics();
          signGfx.fillStyle(0x886644, 1);
          signGfx.fillRect(obj.x * TILE_SIZE + 4, obj.y * TILE_SIZE + 2, 8, 12);
          signGfx.fillStyle(0xaa8855, 1);
          signGfx.fillRect(obj.x * TILE_SIZE + 2, obj.y * TILE_SIZE + 2, 12, 8);
          break;

        case 'door':
          this.doors.push({
            x: obj.x, y: obj.y,
            targetMap: obj.targetMap,
            targetX: obj.targetX,
            targetY: obj.targetY,
            facing: obj.facing || 'down',
            requiredBadges: obj.requiredBadges || 0,
            blockMessage: obj.blockMessage
          });
          // Clear collision so player can walk onto the door tile
          if (this.collisionMap[obj.y] !== undefined) {
            this.collisionMap[obj.y][obj.x] = 0;
          }
          break;

        case 'heal':
          this.npcs.push(new NPC(this, obj.x, obj.y, {
            name: obj.name || 'Nurse',
            dialog: ['heal'],
            color: 0xff88aa,
            facing: obj.facing || 'down',
            spriteKey: obj.spriteKey || null
          }));
          break;

        case 'mart':
          this.npcs.push(new NPC(this, obj.x, obj.y, {
            name: obj.name || 'Clerk',
            dialog: ['mart:' + (obj.martId || 'localhost')],
            color: 0x4488ee,
            facing: obj.facing || 'down',
            spriteKey: obj.spriteKey || null
          }));
          break;

        case 'gym_entrance': {
          const leaderDef = window.GAME_DATA.gymLeaders[obj.gymId];
          if (leaderDef) {
            const t = new Trainer(this, obj.x, obj.y, {
              ...leaderDef,
              facing: obj.facing || 'down',
              color: 0xffcc00,
              spriteKey: obj.spriteKey || null
            });
            this.trainers.push(t);
            this.npcs.push(t);
          }
          break;
        }
      }
    }
  }

  isBlocked(tileX, tileY) {
    // Out of bounds
    if (tileY < 0 || tileY >= this.collisionMap.length) return true;
    if (tileX < 0 || tileX >= (this.collisionMap[0] || []).length) return true;

    // Collision map
    if (this.collisionMap[tileY][tileX] === 1) return true;

    // NPC blocking
    for (const npc of this.npcs) {
      if (npc.tileX === tileX && npc.tileY === tileY) return true;
    }

    return false;
  }

  onPlayerStep(tileX, tileY) {
    // Check door transitions
    for (const door of this.doors) {
      if (door.x === tileX && door.y === tileY) {
        // Check badge requirement
        if (door.requiredBadges && ProgressManager.badgeCount() < door.requiredBadges) {
          this.player.freeze();
          const msg = door.blockMessage || `You need ${door.requiredBadges} badges\nto pass!`;
          this.dialogManager.show([msg], () => {
            this.player.unfreeze();
            // Push player back
            const dir = DIRECTIONS[this.player.facing];
            this.player.setPosition(tileX - dir.x, tileY - dir.y);
          });
          return;
        }
        this.transitionToMap(door.targetMap, door.targetX, door.targetY, door.facing);
        return;
      }
    }

    // Check trainer line of sight
    for (const trainer of this.trainers) {
      if (!trainer.defeated && trainer.canSeeTile(tileX, tileY)) {
        this.startTrainerBattle(trainer);
        return;
      }
    }

    // Check wild encounter
    if (this.encounterZone && this.isGrassTile(tileX, tileY)) {
      const bug = EncounterManager.check(this.encounterZone);
      if (bug) {
        this.startWildBattle(bug);
      }
    }
  }

  isGrassTile(tileX, tileY) {
    return this.grassTiles.some(g => g.x === tileX && g.y === tileY);
  }

  handleInteraction(tileX, tileY, facing) {
    if (this.inDialog || this.inMenu) return;

    const target = Grid.facingTile(tileX, tileY, facing);

    // Check signs
    for (const sign of this.signs) {
      if (sign.x === target.x && sign.y === target.y) {
        this.showDialog(sign.text.split('\n').length > 2
          ? sign.text.split('\n').reduce((acc, line, i) => {
              if (i % 2 === 0) acc.push(line);
              else acc[acc.length - 1] += '\n' + line;
              return acc;
            }, [])
          : [sign.text]);
        return;
      }
    }

    // Check NPCs
    for (const npc of this.npcs) {
      if (npc.tileX === target.x && npc.tileY === target.y) {
        const messages = npc.interact(facing);

        // Special NPC actions
        if (messages[0] === 'heal') {
          this.showDialog(['Welcome to the CI/CD Center!', 'Let me heal your gems...', 'Your gems are fully restored!'], () => {
            PartyManager.healAll();
          });
          return;
        }

        if (messages[0] && messages[0].startsWith('mart:')) {
          const martId = messages[0].split(':')[1];
          this.openMart(martId);
          return;
        }

        // Trainer battle check
        if (npc instanceof Trainer && !npc.defeated) {
          this.showDialog(messages, () => {
            this.startTrainerBattle(npc, true);
          });
          return;
        }

        this.showDialog(messages);
        return;
      }
    }
  }

  showDialog(messages, onComplete) {
    this.inDialog = true;
    this.player.freeze();
    this.dialogManager.show(messages, () => {
      this.inDialog = false;
      this.player.unfreeze();
      if (onComplete) onComplete();
    });
  }

  transitionToMap(mapKey, targetX, targetY, facing) {
    this.player.freeze();
    TransitionFX.fadeOut(this, 300, () => {
      this.scene.restart({
        mapKey: mapKey,
        playerX: targetX,
        playerY: targetY,
        facing: facing || 'down',
        starterChosen: this.starterChosen
      });
    });
  }

  startWildBattle(bug) {
    this.player.freeze();
    TransitionFX.battleTransition(this, () => {
      this.scene.pause();
      this.scene.launch('BattleScene', {
        playerParty: PartyManager.party,
        enemyParty: [bug],
        isWild: true,
        trainerData: null
      });
    });
  }

  startTrainerBattle(trainer, skipDialog) {
    this.player.freeze();

    const beginBattle = () => {
      TransitionFX.battleTransition(this, () => {
        this.scene.pause();
        this.scene.launch('BattleScene', {
          playerParty: PartyManager.party,
          enemyParty: trainer.getBattleParty(),
          isWild: false,
          trainerData: {
            id: trainer.trainerId,
            name: trainer.name,
            prizeMoney: trainer.prizeMoney,
            isGymLeader: trainer.isGymLeader,
            badge: trainer.badge,
            badgeName: trainer.badgeName,
            dialogAfter: trainer.dialogAfter
          }
        });
      });
    };

    if (skipDialog) {
      beginBattle();
    } else {
      // Get dialogue without turning the trainer (they spotted you, not the other way around)
      const messages = trainer.defeated ? trainer.dialogAfter :
        (typeof trainer.dialog === 'string' ? [trainer.dialog] : [...trainer.dialog]);
      this.inDialog = true;
      this.dialogManager.show(messages, () => {
        this.inDialog = false;
        beginBattle();
      });
    }
  }

  openMenu() {
    if (this.inDialog || this.inMenu) return;
    this.inMenu = true;
    this.player.freeze();
    this.scene.pause();
    this.scene.launch('MenuScene');
  }

  openMart(martId) {
    this.player.freeze();
    this.scene.pause();
    this.scene.launch('MartScene', { martId });
  }

  showStarterSelection() {
    if (this.starterChosen) return;
    this.player.freeze();
    this.inDialog = true;

    const starters = [
      { gemId: 'rspec', name: 'RSpec', type: 'Testing', desc: 'All-around solid' },
      { gemId: 'bullet', name: 'Bullet', type: 'Performance', desc: 'Fast special attacker' },
      { gemId: 'brakeman', name: 'Brakeman', type: 'Security', desc: 'Tough and defensive' }
    ];

    this.dialogManager.show([
      "Choose your first gem!",
    ], () => {
      // Show starter menu
      const menu = new MenuBox(this, GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 - 30, [
        { text: `${starters[0].name} (${starters[0].type})`, value: starters[0] },
        { text: `${starters[1].name} (${starters[1].type})`, value: starters[1] },
        { text: `${starters[2].name} (${starters[2].type})`, value: starters[2] }
      ], {
        itemWidth: 120,
        depth: 1100,
        onSelect: (opt) => {
          menu.destroy();
          const gem = new GemInstance(opt.value.gemId, 5);
          PartyManager.addGem(gem);
          this.starterChosen = true;

          this.dialogManager.show([
            `You chose ${opt.value.name}!`,
            `${opt.value.name} - ${opt.value.desc}.`,
            "Now explore Albuquerque and\nearn your Boarding Passes!"
          ], () => {
            this.inDialog = false;
            this.player.unfreeze();
          });
        },
        onCancel: () => {} // Can't cancel starter selection
      });

      // Store menu ref so update can call it
      this._starterMenu = menu;
    });
  }

  update() {
    if (this._starterMenu && this._starterMenu.active) {
      this._starterMenu.update();
      return;
    }

    if (this.dialogManager.isActive) {
      if (Phaser.Input.Keyboard.JustDown(this.player.keyZ) ||
          Phaser.Input.Keyboard.JustDown(this.player.keyEnter)) {
        this.dialogManager.advance();
      }
      return;
    }

    this.player.update();
  }

  // Called when returning from battle
  handleBattleResult(result) {
    this.scene.resume();
    TransitionFX.fadeIn(this, 300);

    if (result.result === 'win' && result.trainerData) {
      // Mark trainer defeated
      const trainer = this.trainers.find(t => t.trainerId === result.trainerData.id);
      if (trainer) {
        trainer.onDefeat();
      }

      // Award money
      if (result.trainerData.prizeMoney) {
        InventoryManager.addMoney(result.trainerData.prizeMoney);
      }

      // Gym leader badge
      if (result.trainerData.isGymLeader && result.trainerData.badge) {
        ProgressManager.addBadge(result.trainerData.badge);
        ProgressManager.completeGym(result.trainerData.id);

        this.time.delayedCall(500, () => {
          const msgs = [...(result.trainerData.dialogAfter || ['Great battle!'])];
          msgs.push(`You got the ${result.trainerData.badgeName}!`);

          // Check if all badges collected
          if (ProgressManager.badgeCount() >= 4) {
            msgs.push("You have all 4 Boarding Passes!");
            msgs.push("The rocket is ready.\nWelcome aboard, developer!");
            msgs.push("3... 2... 1... BLASTOFF!");
            msgs.push("Congratulations!\nYou've completed\nBlastoff Rails: The Game!");
          }

          this.showDialog(msgs);
        });
      } else {
        this.time.delayedCall(300, () => {
          this.player.unfreeze();
        });
      }
    } else if (result.result === 'lose') {
      // Blackout - heal and return to last town
      PartyManager.healAll();
      InventoryManager.money = Math.floor(InventoryManager.money / 2);
      this.time.delayedCall(300, () => {
        this.scene.restart({
          mapKey: 'hotel',
          playerX: 27,
          playerY: 13,
          facing: 'down',
          starterChosen: this.starterChosen
        });
      });
    } else {
      this.time.delayedCall(300, () => {
        this.player.unfreeze();
      });
    }
  }
}
