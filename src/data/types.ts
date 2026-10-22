// Shared content types for the data files.
import type { GravitySegment } from "./segments";

export type BusinessTypeId = "coffee" | "bakery" | "restaurant" | "bookshop" | "tailor" | "tutoring";
export type StoreSize = "stall" | "small" | "medium" | "large";
export type SupplierTier = "budget" | "standard" | "premium";

export type SegmentWeights = Record<GravitySegment, number>;

export interface ProductDef {
  id: string;
  name: string;
  /** Reference price in 2026 US dollars at a US cost level. */
  refPrice: number;
  /** Ingredient or goods cost as a share of the reference price, standard supplier. */
  costShare: number;
  /** Main items are what a customer comes for; add-ons are bought alongside. */
  kind: "main" | "addon";
  /** Share of stock lost per day when not sold (0 for goods that keep). */
  spoilage: number;
  /** Appeal to each segment, around 1. */
  fit: SegmentWeights;
  /** Appeal by time bucket, around 1. */
  timeFit: readonly number[];
  /** Available from this year (inclusive) to this year (exclusive). */
  fromYear: number;
  toYear?: number;
  /** Base quality 0 to 1 before supplier and staff. */
  quality: number;
  startsActive?: boolean;
}

export interface BusinessTypeDef {
  id: BusinessTypeId;
  name: string;
  /** Trips per person present, per time bucket, for this kind of business (all shops combined). */
  propensity: Record<GravitySegment, readonly number[]>;
  /** Strength of everything else in the category (warungs, chains, home) by segment. */
  outsideBase: SegmentWeights;
  /** Customers one worker serves per hour at full speed. */
  servedPerWorkerHour: number;
  /** Chance a served customer also buys an add-on, by segment. */
  addOnRate: SegmentWeights;
  /** Days of stock delivered with the opening order. */
  openingStockDays: number;
  products: ProductDef[];
}

export interface StoreSizeDef {
  id: StoreSize;
  label: string;
  /** 2026 US dollars at US cost levels; scaled by region and year. */
  fitOut: number;
  rent: number;
  utilities: number;
  maxStaff: number;
  /** Small comfort bonus to attractiveness. */
  comfort: number;
  /** Equipment wear per served customer. */
  wearPerCustomer: number;
}
