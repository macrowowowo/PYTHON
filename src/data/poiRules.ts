// How points of interest bring people into a hex. "size" on a POI is a relative scale (1 = typical).
import type { SegmentWeights } from "./types";

export const POI_KINDS = [
  "school",
  "university",
  "office",
  "market",
  "mall",
  "station",
  "bus_stop",
  "park",
  "hospital",
  "tourism",
  "hotel",
  "nightlife",
  "worship",
  "food",
  "retail",
  "apartments",
  "factory",
] as const;
export type PoiKind = (typeof POI_KINDS)[number];

export interface PoiRule {
  label: string;
  /** Visitors per day brought to the hex, by segment, for size 1. */
  visitors: Partial<SegmentWeights>;
  /** Extra residents (housing). */
  residents?: number;
  /** Multiplies all foot traffic in the hex (stations). */
  trafficBoost?: number;
  /** Adds to the strength of the outside option (other food and retail already there). */
  competition?: number;
}

export const POI_RULES: Record<PoiKind, PoiRule> = {
  school: { label: "School", visitors: { students: 420, families: 60 } },
  university: { label: "University", visitors: { students: 1500, office: 120 } },
  office: { label: "Office Building", visitors: { office: 320 } },
  market: { label: "Market", visitors: { laborers: 300, families: 260, tourists: 20 }, competition: 0.25 },
  mall: { label: "Shopping Mall", visitors: { families: 700, students: 300, office: 150, tourists: 80 }, competition: 0.6 },
  station: { label: "Train Station", visitors: { office: 400, students: 200, laborers: 250 }, trafficBoost: 1.35 },
  bus_stop: { label: "Bus Stop", visitors: { office: 25, students: 25, laborers: 25 }, trafficBoost: 1.03 },
  park: { label: "Park", visitors: { families: 160, students: 40, tourists: 20 } },
  hospital: { label: "Hospital", visitors: { families: 300, office: 150 } },
  tourism: { label: "Attraction", visitors: { tourists: 350, families: 80 } },
  hotel: { label: "Hotel", visitors: { tourists: 160, office: 40 } },
  nightlife: { label: "Nightlife", visitors: { night: 160 }, competition: 0.05 },
  worship: { label: "Place of Worship", visitors: { families: 120 } },
  food: { label: "Food and Drink", visitors: { office: 10, families: 10 }, competition: 0.12 },
  retail: { label: "Shop", visitors: { families: 25, students: 8 }, competition: 0.02 },
  apartments: { label: "Apartments", visitors: {}, residents: 450 },
  factory: { label: "Workshop or Factory", visitors: { laborers: 260 } },
};
