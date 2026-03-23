const InventoryManager = {
  money: 0,

  init(saveData) {
    this.money = saveData ? saveData.player.money : 500; // Start with 500
  },

  addMoney(amount) {
    this.money += amount;
  },

  spendMoney(amount) {
    if (this.money < amount) return false;
    this.money -= amount;
    return true;
  },

  canAfford(amount) {
    return this.money >= amount;
  }
};
