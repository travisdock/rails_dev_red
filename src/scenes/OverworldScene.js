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
    this.player.updateDirectionIndicator();

    // Camera
    this.cameras.main.startFollow(this.player.sprite, true);
    this.cameras.main.setRoundPixels(true);
    if (this.mapWidth && this.mapHeight) {
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    // Fade in
    TransitionFX.fadeIn(this, 300);

    // Intro and starter selection on new game
    if (!ProgressManager.hasSeenStory('intro') && this.mapKey === 'localhost') {
      ProgressManager.seeStory('intro');
      this.player.freeze();
      this.time.delayedCall(400, () => {
        this.dialogManager.show([
          "Welcome to the world of Rails!",
          "I'm Prof. Matz, the Ruby creator.",
          "In this world, developers collect\ngems to battle bugs in codebases.",
          "But first, you'll need your\nvery first gem!"
        ], () => {
          this.player.unfreeze();
          if (!this.starterChosen) {
            this.showStarterSelection();
          }
        });
      });
    } else if (!this.starterChosen && this.mapKey === 'localhost') {
      // Edge case: intro seen but starter not chosen (e.g. refreshed mid-selection)
      this.time.delayedCall(500, () => this.showStarterSelection());
    }
  }

  loadMap(mapKey) {
    const mapData = this.cache.json.get('map-' + mapKey);
    // Use procedural maps until Tiled maps are created
    // (placeholder files contain empty objects)
    if (!mapData || !mapData.layers) {
      this.createProceduralMap(mapKey);
      return;
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
      'route1': () => this.generateRoute('route_1', 10, 20, 'Route 1', [
        { type: 'trainer', x: 5, y: 10, trainerId: 'junior_dev_01', facing: 'left' },
        { type: 'door', x: 5, y: 19, targetMap: 'localhost', targetX: 10, targetY: 2, facing: 'down' },
        { type: 'door', x: 5, y: 0, targetMap: 'route2-split', targetX: 10, targetY: 18, facing: 'up' },
        { type: 'sign', x: 3, y: 17, text: 'Route 1\n"The First Deployment"' }
      ]),
      'route2-split': () => this.generateSplitRoute(),
      'route2-west': () => this.generateRoute('route2_west', 10, 20, 'Route 2 West', [
        { type: 'trainer', x: 5, y: 8, trainerId: 'mid_dev_01', facing: 'right' },
        { type: 'trainer', x: 5, y: 14, trainerId: 'mid_dev_03', facing: 'left' },
        { type: 'door', x: 5, y: 19, targetMap: 'route2-split', targetX: 4, targetY: 2, facing: 'down' },
        { type: 'door', x: 5, y: 0, targetMap: 'staging-springs', targetX: 10, targetY: 14, facing: 'up' },
        { type: 'sign', x: 3, y: 17, text: 'Route 2 West\n"Spaghetti Code Trail"' }
      ]),
      'route2-east': () => this.generateRoute('route2_east', 10, 20, 'Route 2 East', [
        { type: 'trainer', x: 5, y: 8, trainerId: 'mid_dev_02', facing: 'left' },
        { type: 'trainer', x: 5, y: 14, trainerId: 'mid_dev_03', facing: 'right' },
        { type: 'door', x: 5, y: 19, targetMap: 'route2-split', targetX: 16, targetY: 2, facing: 'down' },
        { type: 'door', x: 5, y: 0, targetMap: 'testing-terrace', targetX: 10, targetY: 14, facing: 'up' },
        { type: 'sign', x: 3, y: 17, text: 'Route 2 East\n"Untested Waters"' }
      ]),
      'route3': () => this.generateRoute('route_3', 10, 25, 'Route 3', [
        { type: 'trainer', x: 5, y: 8, trainerId: 'senior_dev_01', facing: 'down' },
        { type: 'trainer', x: 5, y: 14, trainerId: 'senior_dev_02', facing: 'left' },
        { type: 'trainer', x: 5, y: 20, trainerId: 'senior_dev_03', facing: 'right' },
        { type: 'door', x: 5, y: 24, targetMap: 'route2-split', targetX: 10, targetY: 2, facing: 'down' },
        { type: 'door', x: 5, y: 0, targetMap: 'production-city', targetX: 10, targetY: 14, facing: 'up' },
        { type: 'sign', x: 3, y: 22, text: 'Route 3\n"Legacy Monolith Path"' }
      ]),
      'staging-springs': () => this.generateTown('staging-springs', 20, 16, 'Staging Springs', [
        { type: 'npc', x: 5, y: 8, name: 'Speed Freak', dialog: ["Benchmarks don't lie!\nBut they can be misleading..."] },
        { type: 'heal', x: 3, y: 5, name: 'CI/CD Center' },
        { type: 'mart', x: 17, y: 5, name: 'Gem Mart', martId: 'staging_springs' },
        { type: 'gym_entrance', x: 10, y: 3, gymId: 'bench_mark', badge: 'benchmark_badge', requiredBadges: 1, name: 'Performance Gym' },
        { type: 'door', x: 10, y: 15, targetMap: 'route2-west', targetX: 5, targetY: 1, facing: 'down' },
        { type: 'sign', x: 10, y: 2, text: 'Performance Gym\nLeader: Bench Mark' }
      ]),
      'testing-terrace': () => this.generateTown('testing-terrace', 20, 16, 'Testing Terrace', [
        { type: 'npc', x: 14, y: 8, name: 'QA Enthusiast', dialog: ["100% test coverage or bust!\n...Well, maybe 95% is fine."] },
        { type: 'heal', x: 3, y: 5, name: 'CI/CD Center' },
        { type: 'mart', x: 17, y: 5, name: 'Gem Mart', martId: 'testing_terrace' },
        { type: 'gym_entrance', x: 10, y: 3, gymId: 'tess_driven', badge: 'green_badge', requiredBadges: 1, name: 'Testing Gym' },
        { type: 'door', x: 10, y: 15, targetMap: 'route2-east', targetX: 5, targetY: 1, facing: 'down' },
        { type: 'sign', x: 10, y: 2, text: 'Testing Gym\nLeader: Tess Driven' }
      ]),
      'production-city': () => this.generateTown('production-city', 24, 18, 'Production City', [
        { type: 'npc', x: 6, y: 8, name: 'DevOps Engineer', dialog: ["Welcome to Production City!\nEverything runs at scale here."] },
        { type: 'npc', x: 18, y: 10, name: 'Senior DBA', dialog: ["DBA Dan is the toughest\ngym leader around.\nMake sure you're prepared!"] },
        { type: 'heal', x: 3, y: 5, name: 'CI/CD Center' },
        { type: 'mart', x: 21, y: 5, name: 'Gem Mart', martId: 'production_city' },
        { type: 'gym_entrance', x: 12, y: 3, gymId: 'dba_dan', badge: 'migration_badge', requiredBadges: 2, name: 'Database Gym' },
        { type: 'door', x: 12, y: 17, targetMap: 'route3', targetX: 5, targetY: 1, facing: 'down' },
        { type: 'sign', x: 12, y: 2, text: 'Database Gym\nLeader: DBA Dan' }
      ])
    };

    const generator = maps[mapKey];
    if (generator) {
      generator();
    } else {
      this.generateTown(mapKey, 20, 16, mapKey, []);
    }
  }

  generateTown(mapKey, width, height, name, objects) {
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = null;

    const gfx = this.add.graphics();

    // Draw ground
    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        const isPath = (x >= 9 && x <= 11) || (y >= 4 && y <= 6);

        if (isBorder) {
          gfx.fillStyle(0x556655, 1);
          this.collisionMap[y][x] = 1; // blocked
        } else if (isPath) {
          gfx.fillStyle(0xddccaa, 1);
          this.collisionMap[y][x] = 0;
        } else {
          gfx.fillStyle(0x88bb66, 1);
          this.collisionMap[y][x] = 0;
        }
        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Grid lines (subtle)
        gfx.lineStyle(1, 0x000000, 0.05);
        gfx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw buildings
    this.drawBuilding(gfx, 2, 4, 3, 2, 0xee5544, 'CI/CD'); // CI/CD Center
    this.drawBuilding(gfx, 15, 4, 3, 2, 0x4488ee, 'MART');  // Mart

    // Town name label
    this.add.text(width * TILE_SIZE / 2, 12, name, {
      fontFamily: 'monospace', fontSize: '6px', color: '#ffffff',
      backgroundColor: '#33333388', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Process objects
    this.processObjects(objects);
  }

  generateRoute(encounterZone, width, height, name, objects) {
    this.mapWidth = width * TILE_SIZE;
    this.mapHeight = height * TILE_SIZE;
    this.collisionMap = [];
    this.grassTiles = [];
    this.encounterZone = encounterZone;

    const gfx = this.add.graphics();

    for (let y = 0; y < height; y++) {
      this.collisionMap[y] = [];
      for (let x = 0; x < width; x++) {
        const isBorder = x === 0 || x === width - 1;
        const isPath = x >= 4 && x <= 6;
        const isGrass = !isBorder && !isPath;

        if (isBorder) {
          gfx.fillStyle(0x446644, 1);
          this.collisionMap[y][x] = 1;
        } else if (isPath) {
          gfx.fillStyle(0xccbb99, 1);
          this.collisionMap[y][x] = 0;
        } else if (isGrass) {
          // Tall grass (encounter zone)
          gfx.fillStyle(0x44aa33, 1);
          this.collisionMap[y][x] = 0;
          this.grassTiles.push({ x, y });
          // Draw grass tufts
          gfx.fillStyle(0x338822, 1);
          gfx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 4, 2, 6);
          gfx.fillRect(x * TILE_SIZE + 6, y * TILE_SIZE + 2, 2, 8);
          gfx.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 5, 2, 5);
        }

        gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        gfx.lineStyle(1, 0x000000, 0.05);
        gfx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Redraw grass tufts on top
        if (isGrass) {
          gfx.fillStyle(0x338822, 1);
          gfx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 4, 2, 6);
          gfx.fillRect(x * TILE_SIZE + 7, y * TILE_SIZE + 2, 2, 8);
          gfx.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 5, 2, 5);
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
            facing: obj.facing || 'down'
          }));
          break;

        case 'trainer': {
          const trainerDef = window.GAME_DATA.trainers[obj.trainerId];
          if (trainerDef) {
            const t = new Trainer(this, obj.x, obj.y, {
              ...trainerDef,
              facing: obj.facing || 'down'
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
          this.npcs.push(new NPC(this, obj.x, obj.y + 2, {
            name: obj.name || 'Nurse',
            dialog: ['heal'],
            color: 0xff88aa,
            facing: 'down'
          }));
          break;

        case 'mart':
          this.npcs.push(new NPC(this, obj.x, obj.y + 2, {
            name: obj.name || 'Clerk',
            dialog: ['mart:' + (obj.martId || 'localhost')],
            color: 0x4488ee,
            facing: 'down'
          }));
          break;

        case 'gym_entrance': {
          const leaderDef = window.GAME_DATA.gymLeaders[obj.gymId];
          if (leaderDef) {
            // Gym sign
            this.signs.push({ x: obj.x - 1, y: obj.y, text: `${leaderDef.title} Gym\nLeader: ${leaderDef.name}` });

            // Gym leader as trainer
            const t = new Trainer(this, obj.x, obj.y + 1, {
              ...leaderDef,
              facing: 'down',
              color: 0xffcc00
            });
            this.trainers.push(t);
            this.npcs.push(t);
          }

          // Draw gym building
          const gymGfx = this.add.graphics();
          gymGfx.fillStyle(0xddaa00, 1);
          gymGfx.fillRect((obj.x - 1) * TILE_SIZE, (obj.y - 1) * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE);
          gymGfx.lineStyle(2, 0x886600, 1);
          gymGfx.strokeRect((obj.x - 1) * TILE_SIZE, (obj.y - 1) * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE);

          // Block gym roof tiles
          for (let tx = obj.x - 1; tx <= obj.x + 1; tx++) {
            if (this.collisionMap[obj.y - 1]) this.collisionMap[obj.y - 1][tx] = 1;
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
      const messages = trainer.interact(this.player.facing);
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
      { gemId: 'devise', name: 'Devise', type: 'Auth', desc: 'Balanced special attacker' },
      { gemId: 'rspec', name: 'RSpec', type: 'Testing', desc: 'All-around solid' },
      { gemId: 'sidekiq', name: 'Sidekiq', type: 'DevOps', desc: 'Fast physical attacker' }
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
            "Now go explore and battle\nthose bugs!"
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
            msgs.push("You've collected all 4 badges!");
            msgs.push("Congratulations! You've mastered\nRails Dev: Red Edition!");
            msgs.push("Your gems are battle-tested and\nproduction-ready!");
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
          mapKey: 'localhost',
          playerX: 4,
          playerY: 7,
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
