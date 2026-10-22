// Customer segments. Regulars are handled per store (loyal customers) rather than per hex,
// so the gravity model runs over the first six.

export const GRAVITY_SEGMENTS = ["students", "office", "families", "laborers", "tourists", "night"] as const;
export type GravitySegment = (typeof GRAVITY_SEGMENTS)[number];
export type Segment = GravitySegment | "regulars";
export const SEG_COUNT = GRAVITY_SEGMENTS.length;

/** Time of day buckets: early morning, morning, midday, afternoon, evening, night. */
export const BUCKETS = ["early", "morning", "midday", "afternoon", "evening", "night"] as const;
export type Bucket = (typeof BUCKETS)[number];
export const BUCKET_COUNT = BUCKETS.length;
export const BUCKET_HOURS = [3, 3, 3, 3, 4, 4] as const;
export const BUCKET_LABELS = ["Early Morning", "Morning", "Midday", "Afternoon", "Evening", "Night"] as const;
/** Opening hours as a bitmask over buckets. */
export const HOURS_ALL_DAY = 0b111111;
export const HOURS_DAY = 0b011110;
export const HOURS_EARLY_TO_EVENING = 0b011111;

export interface SegmentDef {
  id: Segment;
  label: string;
  /** How strongly price above the reference pushes them away. */
  priceSensitivity: number;
  /** Exponent on quality: how much they care. */
  qualityPreference: number;
  /** Distance decay exponent: higher means they want something close. */
  distanceDecay: number;
  /** Share of a queue they tolerate before walking away, 0 to 1. */
  queueTolerance: number;
  /** Where residents of this segment are by time bucket (share present in their home hex). */
  residentPresence: readonly number[];
  /** Where visitors of this segment are by time bucket (share present at the place they visit). */
  visitorPresence: readonly number[];
}

export const SEGMENT_DEFS: Record<Segment, SegmentDef> = {
  students: {
    id: "students",
    label: "Students",
    priceSensitivity: 1.6,
    qualityPreference: 0.5,
    distanceDecay: 2.2,
    queueTolerance: 0.55,
    residentPresence: [0.9, 0.3, 0.3, 0.5, 0.8, 0.8],
    visitorPresence: [0.2, 1.0, 0.9, 0.8, 0.3, 0.05],
  },
  office: {
    id: "office",
    label: "Office Workers",
    priceSensitivity: 0.8,
    qualityPreference: 1.0,
    distanceDecay: 2.4,
    queueTolerance: 0.35,
    residentPresence: [0.9, 0.15, 0.1, 0.15, 0.7, 0.9],
    visitorPresence: [0.3, 1.0, 1.0, 0.9, 0.3, 0.02],
  },
  families: {
    id: "families",
    label: "Families",
    priceSensitivity: 1.2,
    qualityPreference: 0.8,
    distanceDecay: 1.9,
    queueTolerance: 0.5,
    residentPresence: [1.0, 0.7, 0.7, 0.75, 0.95, 1.0],
    visitorPresence: [0.2, 0.7, 0.9, 0.9, 0.7, 0.1],
  },
  laborers: {
    id: "laborers",
    label: "Laborers",
    priceSensitivity: 1.9,
    qualityPreference: 0.3,
    distanceDecay: 2.0,
    queueTolerance: 0.6,
    residentPresence: [0.6, 0.2, 0.2, 0.3, 0.8, 1.0],
    visitorPresence: [1.0, 1.0, 0.8, 0.6, 0.2, 0.05],
  },
  tourists: {
    id: "tourists",
    label: "Tourists",
    priceSensitivity: 0.5,
    qualityPreference: 1.1,
    distanceDecay: 1.6,
    queueTolerance: 0.6,
    residentPresence: [0, 0, 0, 0, 0, 0],
    visitorPresence: [0.1, 0.8, 1.0, 1.0, 0.8, 0.3],
  },
  night: {
    id: "night",
    label: "Night Crowd",
    priceSensitivity: 0.9,
    qualityPreference: 0.7,
    distanceDecay: 1.8,
    queueTolerance: 0.45,
    residentPresence: [0.2, 0.1, 0.2, 0.4, 0.8, 0.6],
    visitorPresence: [0, 0, 0.1, 0.3, 0.9, 1.0],
  },
  regulars: {
    id: "regulars",
    label: "Regulars",
    priceSensitivity: 0.4,
    qualityPreference: 0.9,
    distanceDecay: 1.2,
    queueTolerance: 0.75,
    residentPresence: [1, 1, 1, 1, 1, 1],
    visitorPresence: [1, 1, 1, 1, 1, 1],
  },
};
