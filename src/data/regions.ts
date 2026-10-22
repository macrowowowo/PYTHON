// Regions set cost levels relative to the United States (all money is US dollars), city density
// over time, climate and which name pools to use.
import type { GravitySegment } from "./segments";

type Curve = readonly (readonly [number, number])[];

export interface RegionDef {
  id: string;
  name: string;
  country: string;
  /** Price of local goods relative to the United States, by year. */
  priceLevel: Curve;
  /** Wages relative to the United States, by year. */
  wageLevel: Curve;
  /** Shop rents relative to the United States, by year. */
  rentLevel: Curve;
  /** Residents per square km in an ordinary built-up neighborhood, by year. */
  density: Curve;
  climate: string;
  namePool: string;
  /** Mix of residents by segment (students, office, families, laborers, night). Tourists come from POIs. */
  residentMix: Record<Exclude<GravitySegment, "tourists">, Curve>;
  /** Monthly cost of keeping the family, as a share of US level, before the price index. */
  livingLevel: Curve;
}

export const REGIONS: Record<string, RegionDef> = {
  jakarta: {
    id: "jakarta",
    name: "Jakarta",
    country: "ID",
    priceLevel: [[1920, 0.42], [1950, 0.34], [1970, 0.3], [1990, 0.33], [1997, 0.34], [1998, 0.24], [2003, 0.3], [2026, 0.37]],
    wageLevel: [[1920, 0.12], [1950, 0.09], [1980, 0.09], [1997, 0.12], [1998, 0.07], [2010, 0.1], [2026, 0.115]],
    rentLevel: [[1920, 0.18], [1950, 0.14], [1980, 0.16], [1997, 0.24], [1998, 0.16], [2026, 0.24]],
    density: [[1920, 5200], [1950, 8500], [1970, 11000], [1990, 13500], [2010, 14500], [2026, 15000], [2100, 15500]],
    climate: "tropical_monsoon",
    namePool: "indonesia",
    residentMix: {
      students: [[1920, 0.05], [1970, 0.1], [2026, 0.12]],
      office: [[1920, 0.05], [1970, 0.12], [2026, 0.2]],
      families: [[1920, 0.5], [2026, 0.46]],
      laborers: [[1920, 0.38], [1970, 0.28], [2026, 0.18]],
      night: [[1920, 0.01], [1990, 0.03], [2026, 0.04]],
    },
    livingLevel: [[1920, 0.3], [2026, 0.3]],
  },
  new_york: {
    id: "new_york",
    name: "New York",
    country: "US",
    priceLevel: [[1900, 1.15], [2026, 1.2]],
    wageLevel: [[1900, 1.1], [2026, 1.2]],
    rentLevel: [[1920, 1.4], [1975, 1.0], [1985, 1.8], [2000, 2.4], [2026, 2.9]],
    density: [[1920, 30000], [1950, 28000], [1980, 22000], [2026, 27000], [2100, 28000]],
    climate: "humid_continental",
    namePool: "usa",
    residentMix: {
      students: [[1920, 0.05], [2026, 0.08]],
      office: [[1920, 0.2], [2026, 0.34]],
      families: [[1920, 0.4], [2026, 0.32]],
      laborers: [[1920, 0.32], [2026, 0.16]],
      night: [[1920, 0.03], [2026, 0.1]],
    },
    livingLevel: [[1900, 1.2], [2026, 1.3]],
  },
  boston: {
    id: "boston",
    name: "Boston",
    country: "US",
    priceLevel: [[1900, 1.1], [2026, 1.15]],
    wageLevel: [[1900, 1.05], [2026, 1.15]],
    rentLevel: [[1920, 1.1], [1980, 1.0], [2000, 1.7], [2026, 2.2]],
    density: [[1920, 18000], [1980, 13000], [2026, 15000], [2100, 15500]],
    climate: "humid_continental",
    namePool: "usa",
    residentMix: {
      students: [[1920, 0.1], [2000, 0.3], [2026, 0.32]],
      office: [[1920, 0.15], [2026, 0.25]],
      families: [[1920, 0.45], [2026, 0.28]],
      laborers: [[1920, 0.28], [2026, 0.08]],
      night: [[1920, 0.02], [2026, 0.07]],
    },
    livingLevel: [[1900, 1.1], [2026, 1.2]],
  },
  generic_us: {
    id: "generic_us",
    name: "United States",
    country: "US",
    priceLevel: [[1900, 1.0], [2026, 1.0]],
    wageLevel: [[1900, 1.0], [2026, 1.0]],
    rentLevel: [[1900, 1.0], [2026, 1.0]],
    density: [[1920, 9000], [2026, 8000]],
    climate: "humid_continental",
    namePool: "usa",
    residentMix: {
      students: [[1920, 0.06], [2026, 0.1]],
      office: [[1920, 0.15], [2026, 0.28]],
      families: [[1920, 0.48], [2026, 0.42]],
      laborers: [[1920, 0.3], [2026, 0.14]],
      night: [[1920, 0.01], [2026, 0.06]],
    },
    livingLevel: [[1900, 1.0], [2026, 1.0]],
  },
};

export function getRegion(id: string): RegionDef {
  const r = REGIONS[id];
  if (!r) throw new Error(`Unknown region ${id}`);
  return r;
}
