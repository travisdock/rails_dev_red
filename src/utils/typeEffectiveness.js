const TypeChart = {
  chart: null,

  init(typeChartData) {
    this.chart = typeChartData;
  },

  getEffectiveness(attackType, defendType) {
    if (!this.chart || !this.chart[attackType]) return 1;
    return this.chart[attackType][defendType] || 1;
  },

  getEffectivenessText(multiplier) {
    if (multiplier >= 2) return "It's super effective!";
    if (multiplier <= 0.5) return "It's not very effective...";
    return null;
  }
};
