// Money is stored as integer cents (US dollars, see ARCHITECTURE.md Section 18).

export type Cents = number;

export function cents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

export function toDollars(c: Cents): number {
  return c / 100;
}

/** Rounds any computed amount to whole cents. */
export function roundCents(x: number): Cents {
  const r = Math.round(x);
  return r === 0 ? 0 : r; // avoid -0
}

function groupThousands(intPart: string): string {
  let out = "";
  for (let i = 0; i < intPart.length; i++) {
    const fromEnd = intPart.length - i;
    out += intPart[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ",";
  }
  return out;
}

/** "$1,234" or "$1,234.50" when showCents is set and the value is small. */
export function formatMoney(c: Cents, opts: { showCents?: boolean; sign?: boolean } = {}): string {
  const neg = c < 0;
  const abs = Math.abs(c);
  const showCents = opts.showCents ?? abs < 10000;
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  let body = "$" + groupThousands(String(whole));
  if (showCents) body += "." + String(frac).padStart(2, "0");
  if (neg) return "-" + body;
  if (opts.sign && c > 0) return "+" + body;
  return body;
}

/** Compact form for popups and tight spaces: "$340", "$1.2k", "$4.8M". */
export function formatMoneyShort(c: Cents, opts: { sign?: boolean } = {}): string {
  const neg = c < 0;
  const d = Math.abs(c) / 100;
  let body: string;
  if (d >= 1e9) body = trimNum(d / 1e9) + "B";
  else if (d >= 1e6) body = trimNum(d / 1e6) + "M";
  else if (d >= 1e4) body = trimNum(d / 1e3) + "k";
  else if (d >= 100) body = String(Math.round(d));
  else body = d.toFixed(d >= 10 ? 0 : 2);
  body = "$" + body;
  if (neg) return "-" + body;
  if (opts.sign && c > 0) return "+" + body;
  return body;
}

function trimNum(x: number): string {
  const s = x >= 100 ? x.toFixed(0) : x.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}
