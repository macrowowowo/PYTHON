import type { BusinessTypeDef, BusinessTypeId } from "../types";
import { COFFEE } from "./coffee";

// Phase 1 ships the Tea and Coffee House. The other five types arrive with the content phase.
const TYPES: Partial<Record<BusinessTypeId, BusinessTypeDef>> = {
  coffee: COFFEE,
};

export function getBusinessType(id: BusinessTypeId): BusinessTypeDef {
  const def = TYPES[id];
  if (!def) throw new Error(`Business type not available yet: ${id}`);
  return def;
}

export function getProduct(typeId: BusinessTypeId, productId: string) {
  const p = getBusinessType(typeId).products.find((x) => x.id === productId);
  if (!p) throw new Error(`Unknown product ${productId} for ${typeId}`);
  return p;
}
