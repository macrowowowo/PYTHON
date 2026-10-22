// Seeded random numbers for the simulation. sfc32 generator, one stream per subsystem so that
// adding random draws in one system never shifts the results of another.

export type RngState = [number, number, number, number];

export const STREAMS = [
  "setup",
  "demand",
  "weather",
  "staff",
  "rivals",
  "events",
  "family",
  "names",
  "deals",
  "bots",
] as const;
export type StreamName = (typeof STREAMS)[number];
export type RngStreams = Record<StreamName, RngState>;

/** cyrb128 string hash, returns four 32-bit words. */
export function hash128(str: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function createStreams(seed: string): RngStreams {
  const out = {} as RngStreams;
  for (const name of STREAMS) {
    const s = hash128(`${seed}:${name}`);
    // Warm up so that similar seeds diverge quickly.
    for (let i = 0; i < 12; i++) nextU32(s);
    out[name] = s;
  }
  return out;
}

/** Advances the state in place and returns an unsigned 32-bit integer. */
export function nextU32(s: RngState): number {
  const a = s[0] >>> 0;
  const b = s[1] >>> 0;
  const c = s[2] >>> 0;
  const d = s[3] >>> 0;
  const t = (((a + b) >>> 0) + d) >>> 0;
  s[3] = (d + 1) >>> 0;
  s[0] = b ^ (b >>> 9);
  s[1] = (c + (c << 3)) >>> 0;
  const c2 = (c << 21) | (c >>> 11);
  s[2] = (c2 + t) >>> 0;
  return t >>> 0;
}

/** Uniform float in [0, 1). */
export function rand(s: RngState): number {
  return nextU32(s) / 4294967296;
}

export function randInt(s: RngState, minInclusive: number, maxInclusive: number): number {
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rand(s) * span);
}

export function randRange(s: RngState, min: number, max: number): number {
  return min + rand(s) * (max - min);
}

export function chance(s: RngState, p: number): boolean {
  return rand(s) < p;
}

export function pick<T>(s: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick from empty list");
  return items[Math.floor(rand(s) * items.length)] as T;
}

/** Picks an index with probability proportional to its weight. Returns -1 if all weights are 0. */
export function pickWeightedIndex(s: RngState, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) total += w > 0 ? w : 0;
  if (total <= 0) return -1;
  let r = rand(s) * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i] as number;
    if (w <= 0) continue;
    r -= w;
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** Approximately normal value (sum of uniforms), mean 0, standard deviation 1. */
export function randNormal(s: RngState): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rand(s);
  return (sum - 3) * 1.4142135623730951;
}
