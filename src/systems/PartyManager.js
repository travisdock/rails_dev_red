const PartyManager = {
  party: [],

  init(saveData) {
    if (saveData && saveData.player.party) {
      this.party = saveData.player.party.map(d => GemInstance.deserialize(d));
    } else {
      this.party = [];
    }
  },

  addGem(gem) {
    if (this.party.length >= MAX_PARTY_SIZE) return false;
    this.party.push(gem);
    return true;
  },

  removeGem(index) {
    if (this.party.length <= 1) return false; // Must keep at least one
    this.party.splice(index, 1);
    return true;
  },

  swapGems(indexA, indexB) {
    const temp = this.party[indexA];
    this.party[indexA] = this.party[indexB];
    this.party[indexB] = temp;
  },

  getLeadGem() {
    return this.party.find(g => !g.isFainted) || this.party[0];
  },

  getFirstAlive() {
    return this.party.find(g => !g.isFainted);
  },

  healAll() {
    this.party.forEach(g => g.fullHeal());
  },

  isAllFainted() {
    return this.party.every(g => g.isFainted);
  },

  hasAliveGem() {
    return this.party.some(g => !g.isFainted);
  },

  isFull() {
    return this.party.length >= MAX_PARTY_SIZE;
  }
};
