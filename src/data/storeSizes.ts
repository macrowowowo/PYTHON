import type { StoreSize, StoreSizeDef } from "./types";

export const STORE_SIZES: Record<StoreSize, StoreSizeDef> = {
  stall: {
    id: "stall",
    label: "Stall",
    fitOut: 9000,
    rent: 1300,
    utilities: 250,
    maxStaff: 2,
    comfort: 0.9,
    wearPerCustomer: 0.0000045,
  },
  small: {
    id: "small",
    label: "Small Shop",
    fitOut: 24000,
    rent: 3400,
    utilities: 650,
    maxStaff: 5,
    comfort: 1.0,
    wearPerCustomer: 0.000003,
  },
  medium: {
    id: "medium",
    label: "Medium Shop",
    fitOut: 55000,
    rent: 6800,
    utilities: 1300,
    maxStaff: 9,
    comfort: 1.06,
    wearPerCustomer: 0.0000018,
  },
  large: {
    id: "large",
    label: "Large Shop",
    fitOut: 130000,
    rent: 13500,
    utilities: 2600,
    maxStaff: 15,
    comfort: 1.1,
    wearPerCustomer: 0.0000012,
  },
};

export const STORE_SIZE_ORDER: StoreSize[] = ["stall", "small", "medium", "large"];
