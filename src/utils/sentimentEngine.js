import Sentiment from 'sentiment';

// Initialize the sentiment engine
const sentiment = new Sentiment();

/**
 * Analyzes the text and returns a normalized score and label.
 * @param {string} text 
 * @returns {{ score: number, label: string }}
 */
export function analyzeTextSentiment(text) {
  if (!text) return { score: 0, label: 'neutral' };
  
  const result = sentiment.analyze(text);
  
  // result.comparative is the score / number of words. 
  // It gives a stable normalized score. Usually between -5 and 5.
  // We'll map it to roughly -1 to 1 by limiting and scaling if needed, 
  // but it's typically close to 0 to +/- 1 for average text.
  let normalized = Math.max(-1, Math.min(1, result.comparative * 2)); 

  let label = 'neutral';
  // Small threshold to prevent overly eager labeling
  if (normalized > 0.05) label = 'positive';
  else if (normalized < -0.05) label = 'negative';

  return { score: normalized, label };
}

/**
 * Calculates the Pearson Correlation Coefficient (r) between two arrays of numbers.
 * Expects both arrays to be the same length.
 * @param {number[]} x 
 * @param {number[]} y 
 * @returns {number|null}
 */
export function calculatePearsonCorrelation(x, y) {
  if (!x || !y || x.length !== y.length || x.length === 0) return null;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, idx) => sum + (xi * y[idx]), 0);
  const sumX2 = x.reduce((sum, xi) => sum + (xi * xi), 0);
  const sumY2 = y.reduce((sum, yi) => sum + (yi * yi), 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Detects divergence between price and sentiment slopes over the last `n` days.
 * @param {number[]} priceScores 
 * @param {number[]} sentimentScores 
 * @param {number} n 
 * @returns {string|null} "Bullish Divergence" | "Bearish Divergence" | null
 */
export function detectDivergence(priceScores, sentimentScores, n = 5) {
  if (priceScores.length < n || sentimentScores.length < n) return null;
  
  const recentPrices = priceScores.slice(-n);
  const recentSentiments = sentimentScores.slice(-n);
  
  // Calculate simple slope (last - first)
  const priceSlope = recentPrices[n - 1] - recentPrices[0];
  const sentimentSlope = recentSentiments[n - 1] - recentSentiments[0];
  
  if (priceSlope > 0 && sentimentSlope < 0) {
    return "Bearish Divergence"; // Price up, sentiment down
  } else if (priceSlope < 0 && sentimentSlope > 0) {
    return "Bullish Divergence"; // Price down, sentiment up
  }
  
  return null;
}
