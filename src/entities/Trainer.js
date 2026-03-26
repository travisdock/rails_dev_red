class Trainer extends NPC {
  constructor(scene, tileX, tileY, config) {
    super(scene, tileX, tileY, {
      name: config.name,
      dialog: config.dialogBefore ? config.dialogBefore.split('\n') : ['Time for a code review!'],
      color: config.color || 0xcc4444,
      facing: config.facing || 'down',
      spriteKey: config.spriteKey || null
    });

    this.trainerId = config.id;
    this.trainerData = config;
    this.dialogAfter = config.dialogAfter ? config.dialogAfter.split('\n') : ['Good code review!'];
    this.party = (config.party || []).map(p => new BugInstance(p.bugId, p.level));
    this.prizeMoney = config.prizeMoney || 100;
    this.lineOfSight = config.lineOfSight || 3;
    this.defeated = ProgressManager.isTrainerDefeated(this.trainerId);
    this.isGymLeader = config.badge !== undefined;
    this.badge = config.badge;
    this.badgeName = config.badgeName;

    // Change color if defeated
    if (this.defeated) {
      if (this.hasSprite) {
        this.sprite.setTint(0x888888);
      } else {
        this.sprite.setFillStyle(0x888888);
      }
    }
  }

  interact(playerFacing) {
    if (this.defeated) {
      return this.dialogAfter;
    }
    return super.interact(playerFacing);
  }

  canSeeTile(tileX, tileY) {
    if (this.defeated) return false;
    if (this.isGymLeader) return false; // Gym leaders only fight when talked to

    const dir = DIRECTIONS[this.facing];
    for (let i = 1; i <= this.lineOfSight; i++) {
      const checkX = this.tileX + dir.x * i;
      const checkY = this.tileY + dir.y * i;
      if (checkX === tileX && checkY === tileY) return true;
      // Stop if there's a blocking tile
      if (this.scene.isBlocked(checkX, checkY)) break;
    }
    return false;
  }

  getBattleParty() {
    // Create fresh copies for battle
    return this.trainerData.party.map(p => new BugInstance(p.bugId, p.level));
  }

  onDefeat() {
    this.defeated = true;
    ProgressManager.defeatTrainer(this.trainerId);
    if (this.hasSprite) {
      this.sprite.setTint(0x888888);
    } else {
      this.sprite.setFillStyle(0x888888);
    }
  }

  destroy() {
    super.destroy();
  }
}
