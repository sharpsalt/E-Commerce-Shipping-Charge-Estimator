/**
 * General-purpose numeric helpers.
 */

/** Round a number to `n` decimal places (default 2). */
export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
