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
    this.playerSpriteKey = data.playerSpriteKey || 'player';
    this.spriteChosen = data.spriteChosen || false;
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
    this.player = new Player(this, this.startX, this.startY, this.playerSpriteKey);
    this.player.facing = this.startFacing;
    if (this.player.hasSprite) {
      this.player.sprite.play(`${this.player.spriteKey}-idle-${this.startFacing}`, true);
    }

    // Camera
    this.cameras.main.startFollow(this.player.sprite, true);
    this.cameras.main.setRoundPixels(true);
    if (this.mapWidth && this.mapHeight) {
      this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    // Fade in
    TransitionFX.fadeIn(this, 300);

    // Play map music
    this.playMapMusic(this.mapKey);

    // Intro and starter selection on new game
    if (!ProgressManager.hasSeenStory('intro') && this.mapKey === 'hotel') {
      ProgressManager.seeStory('intro');
      this.player.freeze();
      this.time.delayedCall(400, () => {
        this.dialogManager.show([
          "Welcome to Albuquerque!",
          "You're here for Blastoff Rails, the conference that's literally out of this world!",
          "To board the rocket, you'll need to earn Boarding Passes from four elite devs.",
          "But first, who are you?"
        ], () => {
          this.showSpriteSelection(() => {
            if (!this.starterChosen) {
              this.showStarterSelection();
            } else {
              this.player.unfreeze();
            }
          });
        });
      });
    } else if (!this.starterChosen && this.mapKey === 'hotel') {
      this.time.delayedCall(500, () => this.showStarterSelection());
    } else {
      // First visit message for each map
      const mapStoryKey = 'visited_' + this.mapKey;
      if (!ProgressManager.hasSeenStory(mapStoryKey)) {
        const mapMessages = {
          'parking-lot': ["You step into the Parking Lot.", "Stray from the pathways and you might encounter wild bugs."],
          'old-town': ["Welcome to Old Town. The oldest code in Albuquerque lives here."],
          'park': ["You enter the Park. Watch out for performance bugs in the tall grass."],
          'venue': ["The Venue. The rocket awaits those with all four Boarding Passes."]
        };
        const msgs = mapMessages[this.mapKey];
        if (msgs) {
          ProgressManager.seeStory(mapStoryKey);
          this.player.freeze();
          this.time.delayedCall(400, () => {
            this.showDialog(msgs, () => {
              this.player.unfreeze();
            });
          });
        }
      }
    }
  }

  playMapMusic(mapKey) {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }

    const musicKey = 'music-' + mapKey;
    if (this.cache.audio.exists(musicKey)) {
      this.time.delayedCall(500, () => {
        this.currentMusic = this.sound.add(musicKey, { loop: true, volume: 0.3 });
        this.currentMusic.play();
      });
    }
  }

  playFinalCutscene() {
    SaveManager.save({
      playerName: 'Rubyist',
      position: {
        map: this.mapKey,
        x: this.player.tileX,
        y: this.player.tileY,
        facing: this.player.facing
      },
      badges: ProgressManager.badges,
      party: PartyManager.party,
      trainersDefeated: ProgressManager.trainersDefeated,
      gymsCompleted: ProgressManager.gymsCompleted,
      storySeen: ProgressManager.storySeen,
      starterChosen: this.starterChosen,
      spriteKey: this.playerSpriteKey
    });

    this.stopMusic();

    // Fade to black and hold for a beat before the video starts
    const blackout = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 1
    ).setScrollFactor(0).setDepth(2000).setAlpha(0);

    this.tweens.add({
      targets: blackout,
      alpha: 1,
      duration: 1200,
      onComplete: () => {
        this.time.delayedCall(700, () => this.startFinalVideo());
      }
    });
  }

  startFinalVideo() {
    const creditsMusic = this.sound.add('music-credits', { loop: false, volume: 0.5 });
    creditsMusic.play();

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;align-items:center;justify-content:center;';

    const video = document.createElement('video');
    video.src = 'assets/final_cutscene.mp4';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.cssText = 'max-width:100%;max-height:100%;';

    const finish = () => {
      overlay.remove();
      this.scene.start('CreditsScene');
    };
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);

    overlay.appendChild(video);
    document.body.appendChild(overlay);
  }

  stopMusic() {
    if (this.currentMusic) {
      const music = this.currentMusic;
      this.currentMusic = null;
      this.tweens.add({
        targets: music,
        volume: 0,
        duration: 500,
        ease: 'Linear',
        onComplete: () => music.stop()
      });
    }
  }

  loadMap(mapKey) {
    const mapData = this.cache.json.get('map-' + mapKey);
    if (mapData && mapData.layers) {
      this.loadTiledMap(mapData, mapKey);
    } else {
      console.error(`No Tiled map found for "${mapKey}"`);
    }
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
      else if (ts.source && ts.source.includes('path_06')) textureKey = 'tiles-path_06';
      else if (ts.source && ts.source.includes('path')) textureKey = 'tiles-path';
      else if (ts.source && ts.source.includes('trees')) textureKey = 'tiles-trees';
      else if (ts.source && ts.source.includes('elements')) textureKey = 'tiles-elements';
      else if (ts.source && ts.source.includes('interior')) textureKey = 'tiles-interior';
      else if (ts.source && ts.source.includes('floor')) textureKey = 'tiles-floor';
      else if (ts.source && ts.source.includes('city')) textureKey = 'tiles-city';
      else if (ts.source && ts.source.includes('house')) textureKey = 'tiles-house';
      else if (ts.source && ts.source.includes('general_UI')) textureKey = 'tiles-general_UI';
      else if (ts.source && ts.source.includes('rocket2')) textureKey = 'tiles-rocket2';
      else if (ts.source && ts.source.includes('rocket5')) textureKey = 'tiles-rocket5';
      else if (ts.source && ts.source.includes('rocket4')) textureKey = 'tiles-rocket4';
      else if (ts.source && ts.source.includes('rocket3')) textureKey = 'tiles-rocket3';
      else if (ts.source && ts.source.includes('rocket_new')) textureKey = 'tiles-rocket_new';

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
        const depth = layer.name === 'world' ? 2 : (layer.name === 'above' ? 500 : 0);
        const isCollision = layer.name === 'collisions';

        for (let i = 0; i < layer.data.length; i++) {
          const rawGid = layer.data[i];
          if (rawGid === 0) continue; // empty tile

          // Tiled stores flip/rotation flags in the high bits of the GID
          const FLIPPED_H = 0x80000000;
          const FLIPPED_V = 0x40000000;
          const FLIPPED_D = 0x20000000;
          const flipH = !!(rawGid & FLIPPED_H);
          const flipV = !!(rawGid & FLIPPED_V);
          const flipD = !!(rawGid & FLIPPED_D);
          const gid = rawGid & ~(FLIPPED_H | FLIPPED_V | FLIPPED_D);

          const x = i % width;
          const y = Math.floor(i / width);

          if (isCollision) {
            // Any non-zero tile on collision layer = blocked
            this.collisionMap[y][x] = 1;
            continue;
          }

          const tileInfo = tilesetLookup[gid];
          if (tileInfo) {
            const sprite = this.add.sprite(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              tileInfo.key, tileInfo.frame
            ).setDepth(depth);

            // Apply Tiled flip/rotation flags
            if (flipD) {
              if (flipH && flipV) {
                sprite.setAngle(-90);
                sprite.setFlipX(true);
              } else if (flipH) {
                sprite.setAngle(90);
              } else if (flipV) {
                sprite.setAngle(-90);
              } else {
                sprite.setAngle(90);
                sprite.setFlipX(true);
              }
            } else {
              if (flipH) sprite.setFlipX(true);
              if (flipV) sprite.setFlipY(true);
            }
          }
        }
      }

      // Parse object layers for encounters
      if (layer.type === 'objectgroup' && layer.name === 'encounters') {
        for (const obj of layer.objects) {
          let zone = null;
          if (obj.properties) {
            for (const prop of obj.properties) {
              if (prop.name === 'encounterZone') {
                zone = prop.value;
              }
            }
          }
          const startX = Math.floor(obj.x / TILE_SIZE);
          const startY = Math.floor(obj.y / TILE_SIZE);
          const endX = startX + Math.max(1, Math.ceil(obj.width / TILE_SIZE));
          const endY = startY + Math.max(1, Math.ceil(obj.height / TILE_SIZE));
          for (let gy = startY; gy < endY; gy++) {
            for (let gx = startX; gx < endX; gx++) {
              this.grassTiles.push({ x: gx, y: gy, zone: zone });
            }
          }
          // Set a default encounter zone (used by procedural maps)
          if (zone && !this.encounterZone) {
            this.encounterZone = zone;
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
            rewardGem: props.rewardGem,
            rewardGemLevel: props.rewardGemLevel ? parseInt(props.rewardGemLevel) : undefined,
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
              spriteKey: obj.spriteKey || null,
              rewardGem: obj.rewardGem || null,
              rewardGemLevel: obj.rewardGemLevel || 10
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

        case 'gym_entrance':
        case 'gym_leader': {
          const leaderDef = window.GAME_DATA.gymLeaders[obj.gymId];
          if (leaderDef) {
            const t = new Trainer(this, obj.x, obj.y, {
              ...leaderDef,
              facing: obj.facing || 'down',
              color: 0xffcc00,
              spriteKey: obj.spriteKey || null,
              rewardGem: obj.rewardGem || null,
              rewardGemLevel: obj.rewardGemLevel || 10
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
          const msg = door.blockMessage || `You need ${door.requiredBadges} badges to pass!`;
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
    const grassTile = this.grassTiles.find(g => g.x === tileX && g.y === tileY);
    if (grassTile) {
      const zone = grassTile.zone || this.encounterZone;
      if (zone) {
        const bug = EncounterManager.check(zone);
        if (bug) {
          this.startWildBattle(bug);
        }
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
          this.showDialog(['Welcome to the CI/CD Center!', 'Let me run bundle pristine...', 'Your gems are fully restored!'], () => {
            PartyManager.healAll();
          }, npc.name);
          return;
        }

        // Trainer battle check
        if (npc instanceof Trainer && !npc.defeated) {
          // DHH only battles players who've earned the other three Boarding Passes
          if (npc.trainerId === 'dhh' && ProgressManager.badgeCount() < 3) {
            this.showDialog([
              "I don't think you are ready yet.",
              "Come back when you've earned the other three Boarding Passes."
            ], null, npc.name);
            return;
          }
          this.showDialog(messages, () => {
            this.startTrainerBattle(npc, true);
          }, npc.name);
          return;
        }

        this.showDialog(messages, null, npc.name);
        return;
      }
    }
  }

  showDialog(messages, onComplete, speakerName) {
    this.inDialog = true;
    this.player.freeze();
    this.dialogManager.show(messages, () => {
      this.inDialog = false;
      this.player.unfreeze();
      if (onComplete) onComplete();
    }, speakerName);
  }

  transitionToMap(mapKey, targetX, targetY, facing) {
    this.player.freeze();
    TransitionFX.fadeOut(this, 300, () => {
      this.scene.restart({
        mapKey: mapKey,
        playerX: targetX,
        playerY: targetY,
        facing: facing || 'down',
        starterChosen: this.starterChosen,
        playerSpriteKey: this.playerSpriteKey,
        spriteChosen: this.spriteChosen
      });
    });
  }

  startWildBattle(bug) {
    this.player.freeze();
    this.stopMusic();
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
    this.stopMusic();

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
      }, trainer.name);
    }
  }

  openMenu() {
    if (this.inDialog || this.inMenu) return;
    this.inMenu = true;
    this.player.freeze();
    this.scene.pause();
    this.scene.launch('MenuScene');
  }

  showSpriteSelection(onDone) {
    if (this.spriteChosen) { if (onDone) onDone(); return; }
    this.player.freeze();
    this.inDialog = true;

    // Only sprites with real 4-frame walk cycles per direction.
    // npc11-26 (16x16 Character Sprites Human Pack 1) repeat one idle frame per row, so no walk animation.
    const npcIds = ['01','02','03','05','06','07','09','10'];
    const options = npcIds.map(id => ({ key: 'npc' + id, label: 'NPC ' + id }))
      .filter(o => this.textures.exists(o.key));

    const picker = new SpritePicker(this, options, {
      onSelect: (opt) => {
        picker.destroy();
        this._spritePicker = null;
        this.applyPlayerSprite(opt.key);
        this.spriteChosen = true;
        this.inDialog = false;
        if (onDone) onDone();
      }
    });
    this._spritePicker = picker;
  }

  applyPlayerSprite(spriteKey) {
    if (!this.textures.exists(spriteKey)) return;
    const facing = this.player.facing;
    const tileX = this.player.tileX;
    const tileY = this.player.tileY;
    const frozen = this.player.frozen;
    this.player.destroy();
    this.player = new Player(this, tileX, tileY, spriteKey);
    this.player.facing = facing;
    if (this.player.hasSprite) {
      this.player.sprite.play(`${spriteKey}-idle-${facing}`, true);
    }
    if (frozen) this.player.freeze();
    this.playerSpriteKey = spriteKey;
    this.cameras.main.startFollow(this.player.sprite, true);
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
      const menu = new MenuBox(this, GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 - 30, [
        { text: `${starters[0].name} (${starters[0].type})`, value: starters[0] },
        { text: `${starters[1].name} (${starters[1].type})`, value: starters[1] },
        { text: `${starters[2].name} (${starters[2].type})`, value: starters[2] }
      ], {
        itemWidth: 175,
        depth: 1100,
        onSelect: (opt) => {
          menu.destroy();
          const gem = new GemInstance(opt.value.gemId, 5);
          PartyManager.addGem(gem);
          this.starterChosen = true;

          this.dialogManager.show([
            `You chose ${opt.value.name}!`,
            `${opt.value.name} - ${opt.value.desc}.`,
            "Now explore Albuquerque and earn your Boarding Passes!"
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
    if (this._spritePicker && this._spritePicker.active) {
      this._spritePicker.update();
      return;
    }

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
    this.playMapMusic(this.mapKey);

    if (result.result === 'win' && result.trainerData) {
      // Mark trainer defeated
      const trainer = this.trainers.find(t => t.trainerId === result.trainerData.id);
      if (trainer) {
        trainer.onDefeat();
      }

      // Build trainer dialog messages
      const trainerMsgs = [];

      // After-battle dialog for non-gym trainers
      if (!result.trainerData.isGymLeader && trainer) {
        trainerMsgs.push(...(trainer.dialogAfter || []));
      }

      // Gym leader badge
      if (result.trainerData.isGymLeader && result.trainerData.badge) {
        ProgressManager.addBadge(result.trainerData.badge);
        ProgressManager.completeGym(result.trainerData.id);

        trainerMsgs.push(...(result.trainerData.dialogAfter || ['Great code review!']));
      }

      // Build system messages (no trainer name)
      const systemMsgs = [];

      // Badge/pass reward
      if (result.trainerData.isGymLeader && result.trainerData.badge) {
        systemMsgs.push(`You got the ${result.trainerData.badgeName}!`);

        if (ProgressManager.badgeCount() >= 4) {
          systemMsgs.push("You have all 4 Boarding Passes!");
          systemMsgs.push("The rocket is ready. Welcome aboard, developer!");
          systemMsgs.push("3... 2... 1... BLASTOFF!");
          systemMsgs.push("Congratulations! You've completed Blastoff Rails: The Game!");
        }
      }

      // Gem reward
      let rewardGem = null;
      if (trainer && trainer.rewardGem && window.GAME_DATA.gems[trainer.rewardGem]) {
        rewardGem = new GemInstance(trainer.rewardGem, trainer.rewardGemLevel);
        PartyManager.addGem(rewardGem);
        systemMsgs.push(`You got ${rewardGem.name} (v${rewardGem.level})!`);
      }

      const isFinale = result.trainerData.id === 'dhh';
      const onEnd = () => {
        if (isFinale) {
          this.playFinalCutscene();
        } else {
          this.player.unfreeze();
        }
      };
      const showSystemMsgs = () => {
        if (systemMsgs.length > 0) {
          this.showDialog(systemMsgs, onEnd);
        } else {
          onEnd();
        }
      };

      if (trainerMsgs.length > 0) {
        this.time.delayedCall(500, () => {
          this.showDialog(trainerMsgs, showSystemMsgs, result.trainerData.name);
        });
      } else {
        this.time.delayedCall(300, showSystemMsgs);
      }
    } else if (result.result === 'lose') {
      // Blackout - heal and return to hotel
      PartyManager.healAll();
      this.time.delayedCall(300, () => {
        this.scene.restart({
          mapKey: 'hotel',
          playerX: 27,
          playerY: 13,
          facing: 'down',
          starterChosen: this.starterChosen,
          playerSpriteKey: this.playerSpriteKey,
          spriteChosen: this.spriteChosen
        });
      });
    } else {
      this.time.delayedCall(300, () => {
        this.player.unfreeze();
      });
    }
  }
}
