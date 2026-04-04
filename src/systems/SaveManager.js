const SaveManager = {
  SAVE_KEY: 'rails_quest_save',
  SAVE_VERSION: 1,

  save(gameState) {
    const data = {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      player: {
        name: gameState.playerName || 'Rubyist',
        position: { ...gameState.position },
        badges: [...gameState.badges],
        party: gameState.party.map(g => g.serialize()),
        starterChosen: gameState.starterChosen
      },
      flags: {
        trainersDefeated: [...gameState.trainersDefeated],
        gymsCompleted: [...gameState.gymsCompleted],
        storySeen: [...gameState.storySeen]
      }
    };
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch, ignoring save');
        return null;
      }
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  },

  deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
