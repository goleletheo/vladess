export type RiskLevel = "Low" | "Medium" | "High";

export type ForecastResult = {
  targetMultiplier: number;
  dataStabilityScore: number;
  confidenceLabel: string;
  riskLevel: RiskLevel;
  modelEstimatedProbability: number;
  movingAverage: number;
  distributionMedian: number;
  sampleSize: number;
  disclaimer: string;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Exploratory estimate, not a validated prediction of a future crash.
 * The exponential distribution is an unverified modelling assumption.
 * dataStabilityScore is not probability of forecast correctness.
 */
export function forecastNextRound(raw: number[], target = 2): ForecastResult {
  const values = raw.filter(v => Number.isFinite(v) && v >= 1);

  if (values.length < 5) throw new Error("Enter at least five valid multipliers.");
  if (!Number.isFinite(target) || target < 1) throw new Error("Target must be at least 1.00x.");

  const recent = values.slice(-10);
  const weights = recent.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const movingAverage = Math.exp(
    recent.reduce((sum, value, i) => sum + weights[i] * Math.log(value), 0) / weightSum
  );

  const excess = values.map(v => v - 1);
  const meanExcess = excess.reduce((a, b) => a + b, 0) / excess.length;
  const lambda = 1 / Math.max(meanExcess, 0.01);
  const distributionMedian = 1 + Math.log(2) / lambda;

  const targetMultiplier = round2(clamp(0.55 * movingAverage + 0.45 * distributionMedian, 1.01, 100));

  // This tail probability is conditional on the assumed exponential model,
  // not a measured probability for the real game.
  const modelEstimatedProbability = clamp(Math.exp(-lambda * Math.max(0, target - 1)), 0, 1);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / Math.max(mean, 0.01);
  const sampleScore = Math.min(values.length / 30, 1) * 50;
  const stabilityScore = 50 / (1 + Math.max(0, cv - 0.5));
  const dataStabilityScore = Math.round(clamp(sampleScore + stabilityScore, 0, 100));

  const riskLevel: RiskLevel =
    modelEstimatedProbability >= 0.5 ? "Low" :
    modelEstimatedProbability >= 0.2 ? "Medium" : "High";

  return {
    targetMultiplier,
    dataStabilityScore,
    confidenceLabel: "Data stability — not predictive confidence",
    riskLevel,
    modelEstimatedProbability: round2(modelEstimatedProbability * 100),
    movingAverage: round2(movingAverage),
    distributionMedian: round2(distributionMedian),
    sampleSize: values.length,
    disclaimer: "Exploratory model output only. Historical results cannot reliably predict the next independently generated crash. The probability depends on an unvalidated exponential-distribution assumption."
  };
}
