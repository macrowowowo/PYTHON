// State hashing for determinism tests and save checksums. FNV-1a over a canonical JSON string.

export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}

export function hashState(value: unknown): string {
  const json = canonicalJson(value);
  // Two hashes over the two halves widen the result to 64 bits.
  const mid = Math.floor(json.length / 2);
  return fnv1a(json) + fnv1a(json.slice(mid) + json.slice(0, mid));
}
