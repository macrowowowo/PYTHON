// Every balance constant in the game lives here. Difficulty levels multiply some of them.
// Money values are 2026 US dollars at US cost level unless stated; the simulation scales them
// by region and year.

export const TUNING = {
  grid: {
    resolution: 9,
    /** Rings of hexes around the start point (7 rings is about 2.2 km). */
    startRings: 7,
    /** Walking distances are straight-line distance times this factor until the road graph arrives. */
    detourFactor: 1.3,
    /** Minimum walking distance from inside the store's own hex, meters. */
    minWalk: 70,
    /** Stores do not pull customers from beyond this walking distance, meters. */
    catchmentCutoff: 1600,
  },

  gravity: {
    /** Distance scale in the decay term 1 / (1 + d / d0) ^ beta, meters. */
    d0: 160,
    /** Outside option strength multiplier per unit of POI competition in the hex. */
    competitionWeight: 1.0,
    /** Global multiplier on the outside option. */
    outsideMult: 1.0,
    /** Global multiplier on trips (all shops in the category). */
    tripMult: 1.0,
  },

  attract: {
    /** Price term exp(-sens * k * (relPrice - 1)). */
    priceK: 1.7,
    /** Quality term (quality / norm) ^ pref. */
    qualityNorm: 0.6,
    reputationMin: 0.55,
    reputationMax: 1.45,
    awarenessFloor: 0.12,
    awarenessScale: 1.1,
    cleanlinessWeight: 0.35,
  },

  awareness: {
    /** Initial awareness at opening for hexes right next to the store, falls with distance. */
    initialNear: 0.22,
    initialFloor: 0.02,
    /** Walk-by awareness target near the store, falls with distance. */
    presenceNear: 0.3,
    presenceRange: 650,
    presenceRate: 0.012,
    /** Word of mouth: awareness gained per served customer from a hex, relative to its population. */
    wordOfMouth: 1.4,
    /** Daily decay of awareness above the presence level. */
    decay: 0.006,
  },

  service: {
    /** Utilization above which customers start walking away from the queue. */
    queueStart: 0.72,
    /** How fast walkaways grow above queueStart, scaled by (1 - tolerance). */
    queueSlope: 0.9,
    /** Founder or family member working the counter counts as this many workers. */
    familyWorker: 1.0,
  },

  stock: {
    leadDays: 1,
    /** Share of unmet demand for a product that switches to another product. */
    switchShare: 0.5,
    /** Supplier tiers: cost multiplier and quality added. */
    tiers: {
      budget: { cost: 0.78, quality: -0.12 },
      standard: { cost: 1.0, quality: 0 },
      premium: { cost: 1.38, quality: 0.14 },
    },
    /** Reputation hit per lost sale from a stockout, as a rating score sample. */
    stockoutScore: 0.15,
  },

  condition: {
    equipmentDecay: 0.0009,
    maintenancePlanDecayMult: 0.2,
    /** Monthly cost of a maintenance plan as a share of fit-out cost. */
    maintenancePlanCost: 0.012,
    /** Repair cost to restore full condition, share of fit-out per missing condition point. */
    repairCost: 0.35,
    breakdownBelow: 0.5,
    breakdownChance: 0.05,
    breakdownDays: 2,
    /** Cleanliness lost per 100 customers. */
    dirtPer100: 0.09,
    /** Cleanliness restored per day per unit of spare staff capacity share. */
    cleanRestore: 0.22,
    cleanRestoreBase: 0.03,
  },

  rating: {
    windowVisits: 200,
    priorScore: 0.62,
    priorVisits: 40,
    samplesPerDay: 25,
  },

  loyalty: {
    /** Share of served customers who become regulars, per day. */
    conversion: 0.0045,
    /** Regulars visit this often per day. */
    visitRate: 0.42,
    /** Daily churn of regulars at a neutral experience. */
    churn: 0.004,
    /** Extra churn per point of bad experience. */
    churnBad: 0.03,
    /** Regulars are capped at this multiple of recent daily walk-in customers. */
    capMultiple: 0.9,
  },

  staff: {
    /** Full-time monthly wage, 2026 US dollars, US level. */
    baseWage: 3000,
    /** Hours per bucket share used to cost shifts: a full shift costs 1.0, a half shift 0.55. */
    halfShiftCost: 0.55,
    moraleDrift: 0.03,
    quitBelow: 0.28,
    quitChance: 0.03,
    severanceWeeks: 2,
    candidatesPerStore: 4,
    candidateRefreshDays: 14,
  },

  family: {
    /** Monthly cost of keeping the family, 2026 US dollars at US level. */
    living: 2400,
    /** Graduated withdrawals: the family takes less when cash is short. */
    livingMinShare: 0.45,
  },

  finance: {
    depositMonths: 1,
    depreciationMonths: 84,
    /** Share of fit-out recovered when closing a store. */
    salvage: 0.25,
    taxRate: 0.1,
    loanRiskPremium: 0.04,
    /** Credit limit as a multiple of trailing 3-month revenue, plus a share of assets. */
    creditRevenueMonths: 2.5,
    creditAssetShare: 0.35,
    /** Small starter credit regardless of history, 2026 US dollars at US level. */
    creditStarter: 12000,
    graceDays: 45,
    /** Business value multiple on trailing 12-month profit, for net worth. */
    valuationMultiple: 2.0,
  },

  marketing: {
    flyers: { cost: 450, days: 21, radius: 600, strength: 0.012 },
    newspaper: { cost: 900, days: 30, radius: 1300, strength: 0.007 },
    social: { cost: 1100, days: 30, radius: 1600, strength: 0.011 },
    openingParty: { cost: 1500, days: 3, radius: 900, strength: 0.08 },
  },

  rivals: {
    startCash: 60000,
    /** Prices relative to reference by strategy. */
    priceMult: { discounter: 0.82, boutique: 1.3, copycat: 1.0, chain: 0.92, oldFavorite: 0.98 },
    qualityAdd: { discounter: -0.1, boutique: 0.18, copycat: 0.0, chain: -0.04, oldFavorite: 0.05 },
    crewSkill: { discounter: 0.45, boutique: 0.7, copycat: 0.55, chain: 0.4, oldFavorite: 0.6 },
    loyalStart: { discounter: 20, boutique: 25, copycat: 10, chain: 15, oldFavorite: 70 },
    awarenessStart: { discounter: 0.45, boutique: 0.4, copycat: 0.35, chain: 0.6, oldFavorite: 0.55 },
    /** Discounter cuts this much when it loses share to the player. */
    discounterCut: 0.04,
    priceFloorOverCost: 1.35,
    closeAfterNegativeDays: 90,
  },

  difficulty: {
    relaxed: { startCash: 1.4, demand: 1.12, rivalAggro: 0.6, grace: 2.0 },
    normal: { startCash: 1.0, demand: 1.0, rivalAggro: 1.0, grace: 1.0 },
    hard: { startCash: 0.8, demand: 0.92, rivalAggro: 1.3, grace: 0.7 },
    ruthless: { startCash: 0.65, demand: 0.85, rivalAggro: 1.6, grace: 0.5 },
  },
} as const;

export type Difficulty = keyof typeof TUNING.difficulty;
export type MarketingKind = keyof typeof TUNING.marketing;
export type RivalStrategy = keyof typeof TUNING.rivals.priceMult;
