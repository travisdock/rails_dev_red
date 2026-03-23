const ProgressManager = {
  badges: [],
  trainersDefeated: [],
  gymsCompleted: [],
  storySeen: [],

  init(saveData) {
    if (saveData) {
      this.badges = saveData.player.badges || [];
      this.trainersDefeated = saveData.flags.trainersDefeated || [];
      this.gymsCompleted = saveData.flags.gymsCompleted || [];
      this.storySeen = saveData.flags.storySeen || [];
    } else {
      this.badges = [];
      this.trainersDefeated = [];
      this.gymsCompleted = [];
      this.storySeen = [];
    }
  },

  hasBadge(badgeId) {
    return this.badges.includes(badgeId);
  },

  addBadge(badgeId) {
    if (!this.badges.includes(badgeId)) {
      this.badges.push(badgeId);
    }
  },

  isTrainerDefeated(trainerId) {
    return this.trainersDefeated.includes(trainerId);
  },

  defeatTrainer(trainerId) {
    if (!this.trainersDefeated.includes(trainerId)) {
      this.trainersDefeated.push(trainerId);
    }
  },

  isGymCompleted(gymId) {
    return this.gymsCompleted.includes(gymId);
  },

  completeGym(gymId) {
    if (!this.gymsCompleted.includes(gymId)) {
      this.gymsCompleted.push(gymId);
    }
  },

  hasSeenStory(storyId) {
    return this.storySeen.includes(storyId);
  },

  seeStory(storyId) {
    if (!this.storySeen.includes(storyId)) {
      this.storySeen.push(storyId);
    }
  },

  badgeCount() {
    return this.badges.length;
  },

  getState() {
    return {
      badges: [...this.badges],
      trainersDefeated: [...this.trainersDefeated],
      gymsCompleted: [...this.gymsCompleted],
      storySeen: [...this.storySeen]
    };
  }
};
