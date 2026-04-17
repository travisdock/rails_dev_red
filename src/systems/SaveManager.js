const SaveManager = {
  SAVE_KEY_PREFIX: 'rails_quest_save_',
  SAVE_VERSION: 1,
  activeSlot: 1,
  sessionStart: 0,
  playtime: 0,

  startSession(previousPlaytime) {
    this.playtime = previousPlaytime || 0;
    this.sessionStart = Date.now();
  },

  getPlaytime() {
    return this.playtime + (Date.now() - this.sessionStart);
  },

  formatPlaytime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  _key(slot) {
    return this.SAVE_KEY_PREFIX + (slot || this.activeSlot);
  },

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
      playtime: this.getPlaytime(),
      flags: {
        trainersDefeated: [...gameState.trainersDefeated],
        gymsCompleted: [...gameState.gymsCompleted],
        storySeen: [...gameState.storySeen]
      }
    };
    try {
      localStorage.setItem(this._key(), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  load(slot) {
    try {
      const raw = localStorage.getItem(this._key(slot));
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

  hasSave(slot) {
    return localStorage.getItem(this._key(slot)) !== null;
  },

  deleteSave(slot) {
    localStorage.removeItem(this._key(slot));
  },

  // Get display info for a slot without full deserialization
  slotInfo(slot) {
    const data = this.load(slot);
    if (!data) return null;
    const party = data.player.party || [];
    const firstGem = party[0];
    let gemName = '???';
    if (firstGem) {
      const gemDef = window.GAME_DATA && window.GAME_DATA.gems[firstGem.gemId];
      gemName = gemDef ? gemDef.name : (firstGem.gemId || '???');
    }
    const badges = (data.player.badges || []).length;
    let savedDate = '';
    if (data.timestamp) {
      const d = new Date(data.timestamp);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      savedDate = `${d.getFullYear()}/${mm}/${dd}`;
    }
    const playtime = this.formatPlaytime(data.playtime || 0);
    return { gemName, badges, savedDate, playtime };
  }
};
