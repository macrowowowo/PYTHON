// Engine-independent math. Math.exp, Math.log and Math.pow may differ in the last bit between
// JavaScript engines. These versions only use + - * / and Math.sqrt, which IEEE 754 defines
// exactly, so a seed gives the same game in every browser and in Node.

export const LN2 = 0.6931471805599453;
export const PI = 3.141592653589793;

/** 2 to an integer power, exact. */
function pow2i(k: number): number {
  let r = 1;
  if (k >= 0) {
    for (let i = 0; i < k; i++) r *= 2;
  } else {
    for (let i = 0; i < -k; i++) r *= 0.5;
  }
  return r;
}

export function exp(x: number): number {
  if (x !== x) return NaN;
  if (x > 709) return Infinity;
  if (x < -745) return 0;
  const k = Math.round(x / LN2);
  const r = x - k * LN2;
  // Taylor series on |r| <= 0.347, 18 terms is far beyond double precision.
  let term = 1;
  let sum = 1;
  for (let n = 1; n < 18; n++) {
    term = (term * r) / n;
    sum += term;
  }
  return sum * pow2i(k);
}

export function log(x: number): number {
  if (x !== x || x < 0) return NaN;
  if (x === 0) return -Infinity;
  if (x === Infinity) return Infinity;
  let m = x;
  let e = 0;
  while (m > 1.4142135623730951) {
    m *= 0.5;
    e++;
  }
  while (m < 0.7071067811865476) {
    m *= 2;
    e--;
  }
  const s = (m - 1) / (m + 1);
  const s2 = s * s;
  let term = s;
  let sum = 0;
  for (let n = 1; n < 40; n += 2) {
    sum += term / n;
    term *= s2;
  }
  return e * LN2 + 2 * sum;
}

/** Integer exponent power by repeated squaring. */
export function powInt(base: number, n: number): number {
  if (n < 0) return 1 / powInt(base, -n);
  let result = 1;
  let b = base;
  let k = n;
  while (k > 0) {
    if (k & 1) result *= b;
    b *= b;
    k = k >>> 1;
  }
  return result;
}

export function pow(base: number, e: number): number {
  if (e === 0) return 1;
  if (Number.isInteger(e) && Math.abs(e) < 64) return powInt(base, e);
  if (base === 0) return e > 0 ? 0 : Infinity;
  if (base < 0) return NaN;
  return exp(e * log(base));
}

export function sin(x: number): number {
  // Reduce to [-pi, pi].
  const twoPi = 2 * PI;
  let r = x - Math.round(x / twoPi) * twoPi;
  // Reduce to [-pi/2, pi/2] using sin(pi - r) = sin(r).
  if (r > PI / 2) r = PI - r;
  else if (r < -PI / 2) r = -PI - r;
  const r2 = r * r;
  let term = r;
  let sum = r;
  for (let n = 1; n < 12; n++) {
    term = (-term * r2) / ((2 * n) * (2 * n + 1));
    sum += term;
  }
  return sum;
}

export function cos(x: number): number {
  return sin(x + PI / 2);
}

export function logistic(x: number): number {
  return 1 / (1 + exp(-x));
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Linear interpolation in a table of [x, y] points sorted by x, clamped at the ends. */
export function interpTable(table: readonly (readonly [number, number])[], x: number): number {
  const first = table[0];
  const last = table[table.length - 1];
  if (!first || !last) return 0;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < table.length; i++) {
    const b = table[i] as readonly [number, number];
    if (x <= b[0]) {
      const a = table[i - 1] as readonly [number, number];
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
    }
  }
  return last[1];
}
