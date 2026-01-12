/**
 * Black-Scholes Option Pricing and Greeks Calculator
 *
 * This module implements the Black-Scholes model for European-style options pricing
 * and calculates the "Greeks" - sensitivities of option price to various factors.
 */

// Standard normal cumulative distribution function
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

interface BlackScholesInputs {
  stockPrice: number;      // Current stock price (S)
  strikePrice: number;     // Option strike price (K)
  timeToExpiry: number;    // Time to expiration in years (T)
  riskFreeRate: number;    // Risk-free interest rate (r) - usually ~0.05
  volatility: number;      // Implied volatility (σ) - e.g., 0.30 for 30%
  optionType: 'call' | 'put';
  dividendYield?: number;  // Continuous dividend yield (q) - optional
}

interface OptionGreeks {
  price: number;           // Option price
  delta: number;           // dPrice/dStock - directional exposure
  gamma: number;           // dDelta/dStock - delta sensitivity
  theta: number;           // dPrice/dTime - time decay (per day)
  vega: number;            // dPrice/dVolatility - IV sensitivity (per 1% move)
  rho: number;             // dPrice/dRate - interest rate sensitivity
}

/**
 * Calculate d1 and d2 for Black-Scholes formula
 */
function calculateD1D2(
  S: number,  // Stock price
  K: number,  // Strike price
  T: number,  // Time to expiry in years
  r: number,  // Risk-free rate
  v: number,  // Volatility
  q: number   // Dividend yield
): { d1: number; d2: number } {
  const d1 = (Math.log(S / K) + (r - q + 0.5 * v * v) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);
  return { d1, d2 };
}

/**
 * Calculate Black-Scholes option price and all Greeks
 */
export function calculateGreeks(inputs: BlackScholesInputs): OptionGreeks {
  const {
    stockPrice: S,
    strikePrice: K,
    timeToExpiry: T,
    riskFreeRate: r,
    volatility: v,
    optionType,
    dividendYield: q = 0,
  } = inputs;

  // Handle edge cases
  if (T <= 0) {
    // At expiration
    const intrinsicValue =
      optionType === 'call'
        ? Math.max(0, S - K)
        : Math.max(0, K - S);
    return {
      price: intrinsicValue,
      delta: optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const { d1, d2 } = calculateD1D2(S, K, T, r, v, q);
  const sqrtT = Math.sqrt(T);
  const expQT = Math.exp(-q * T);
  const expRT = Math.exp(-r * T);

  let price: number;
  let delta: number;
  let rho: number;

  if (optionType === 'call') {
    price = S * expQT * normalCDF(d1) - K * expRT * normalCDF(d2);
    delta = expQT * normalCDF(d1);
    rho = K * T * expRT * normalCDF(d2) / 100;
  } else {
    price = K * expRT * normalCDF(-d2) - S * expQT * normalCDF(-d1);
    delta = -expQT * normalCDF(-d1);
    rho = -K * T * expRT * normalCDF(-d2) / 100;
  }

  // Gamma is the same for calls and puts
  const gamma = (expQT * normalPDF(d1)) / (S * v * sqrtT);

  // Theta (per day, so divide by 365)
  const thetaTerm1 = -(S * v * expQT * normalPDF(d1)) / (2 * sqrtT);
  let theta: number;
  if (optionType === 'call') {
    theta = (thetaTerm1 - r * K * expRT * normalCDF(d2) + q * S * expQT * normalCDF(d1)) / 365;
  } else {
    theta = (thetaTerm1 + r * K * expRT * normalCDF(-d2) - q * S * expQT * normalCDF(-d1)) / 365;
  }

  // Vega (per 1% move in volatility)
  const vega = (S * expQT * normalPDF(d1) * sqrtT) / 100;

  return {
    price: Math.max(0, price),
    delta: delta,
    gamma: gamma,
    theta: theta,
    vega: vega,
    rho: rho,
  };
}

/**
 * Calculate implied volatility using Newton-Raphson method
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  optionType: 'call' | 'put',
  dividendYield: number = 0,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number {
  // Initial guess using Brenner-Subrahmanyam approximation
  let iv = Math.sqrt((2 * Math.PI) / timeToExpiry) * (marketPrice / stockPrice);

  for (let i = 0; i < maxIterations; i++) {
    const greeks = calculateGreeks({
      stockPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility: iv,
      optionType,
      dividendYield,
    });

    const priceDiff = greeks.price - marketPrice;

    if (Math.abs(priceDiff) < tolerance) {
      return iv;
    }

    // Newton-Raphson update using vega
    // vega is per 1%, so multiply by 100
    const vega = greeks.vega * 100;
    if (vega === 0) break;

    iv = iv - priceDiff / vega;

    // Keep IV in reasonable bounds
    if (iv <= 0.01) iv = 0.01;
    if (iv > 5) iv = 5;
  }

  return iv;
}

/**
 * Calculate probability of profit for an option position
 */
export function calculateProbabilityOfProfit(
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  volatility: number,
  optionType: 'call' | 'put',
  isSelling: boolean
): number {
  // Standard deviation of expected move
  const stdDev = stockPrice * volatility * Math.sqrt(timeToExpiry);

  // Z-score for the strike price
  const zScore = (strikePrice - stockPrice) / stdDev;

  let probability: number;

  if (optionType === 'call') {
    // Probability stock stays below strike (seller wins) or above strike (buyer wins)
    probability = isSelling ? normalCDF(zScore) : 1 - normalCDF(zScore);
  } else {
    // Probability stock stays above strike (seller wins) or below strike (buyer wins)
    probability = isSelling ? 1 - normalCDF(zScore) : normalCDF(zScore);
  }

  return probability;
}

/**
 * Calculate expected move based on implied volatility
 */
export function calculateExpectedMove(
  stockPrice: number,
  volatility: number,
  daysToExpiry: number
): { oneStdDev: number; twoStdDev: number } {
  const timeToExpiry = daysToExpiry / 365;
  const oneStdDev = stockPrice * volatility * Math.sqrt(timeToExpiry);
  const twoStdDev = oneStdDev * 2;

  return { oneStdDev, twoStdDev };
}

export default {
  calculateGreeks,
  calculateImpliedVolatility,
  calculateProbabilityOfProfit,
  calculateExpectedMove,
};
