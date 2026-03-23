const EncounterManager = {
  encounterData: null,

  init(encounterData) {
    this.encounterData = encounterData;
  },

  check(routeId) {
    if (!this.encounterData || !this.encounterData[routeId]) return null;

    const route = this.encounterData[routeId];
    if (Math.random() > route.encounterRate) return null;

    // Pick a bug using weighted random
    const entry = GameMath.weightedRandom(route.encounters);
    const level = GameMath.randInt(entry.levelRange[0], entry.levelRange[1]);

    return new BugInstance(entry.bugId, level);
  }
};
