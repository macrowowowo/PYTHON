// Calendar arithmetic on integer day numbers (days since 1970-01-01), proleptic Gregorian.

export interface YMD {
  y: number;
  m: number; // 1 to 12
  d: number; // 1 to 31
}

export function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(z0: number): YMD {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: m <= 2 ? y + 1 : y, m, d };
}

/** 0 = Sunday to 6 = Saturday. */
export function weekday(epochDay: number): number {
  return (((epochDay + 4) % 7) + 7) % 7;
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  const table = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return table[m - 1] as number;
}

/** Fractional year, used for era curves: 1985.5 is about July 1985. */
export function fractionalYear(epochDay: number): number {
  const { y } = civilFromDays(epochDay);
  const start = daysFromCivil(y, 1, 1);
  const len = isLeap(y) ? 366 : 365;
  return y + (epochDay - start) / len;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function monthName(m: number): string {
  return MONTHS[m - 1] as string;
}

export function monthShort(m: number): string {
  return MONTHS_SHORT[m - 1] as string;
}

export function weekdayName(wd: number): string {
  return WEEKDAYS[wd] as string;
}

/** "Mon 14 Mar 1931" */
export function formatDate(epochDay: number): string {
  const { y, m, d } = civilFromDays(epochDay);
  return `${(WEEKDAYS[weekday(epochDay)] as string).slice(0, 3)} ${d} ${monthShort(m)} ${y}`;
}

/** Month key, months since year 0: comparable and easy to subtract. */
export function monthKey(epochDay: number): number {
  const { y, m } = civilFromDays(epochDay);
  return y * 12 + (m - 1);
}

export function formatMonthKey(key: number): string {
  return `${monthShort((key % 12) + 1)} ${Math.floor(key / 12)}`;
}
