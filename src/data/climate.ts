// Climate profiles. Monthly probabilities of each kind of weather day (January first).

export type WeatherKind = "clear" | "cloudy" | "rain" | "storm" | "snow" | "heat";

export interface ClimateProfile {
  id: string;
  rain: readonly number[];
  storm: readonly number[];
  snow: readonly number[];
  heat: readonly number[];
}

export const CLIMATES: Record<string, ClimateProfile> = {
  tropical_monsoon: {
    id: "tropical_monsoon",
    rain: [0.45, 0.45, 0.4, 0.33, 0.22, 0.15, 0.1, 0.08, 0.12, 0.2, 0.3, 0.4],
    storm: [0.18, 0.2, 0.12, 0.06, 0.03, 0.02, 0.01, 0.01, 0.02, 0.05, 0.08, 0.14],
    snow: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    heat: [0.02, 0.02, 0.04, 0.08, 0.12, 0.12, 0.14, 0.18, 0.2, 0.16, 0.08, 0.04],
  },
  humid_continental: {
    id: "humid_continental",
    rain: [0.18, 0.18, 0.22, 0.25, 0.25, 0.22, 0.2, 0.2, 0.18, 0.2, 0.22, 0.2],
    storm: [0.03, 0.03, 0.04, 0.04, 0.05, 0.06, 0.06, 0.05, 0.04, 0.03, 0.03, 0.03],
    snow: [0.18, 0.16, 0.08, 0.01, 0, 0, 0, 0, 0, 0, 0.03, 0.12],
    heat: [0, 0, 0, 0, 0.02, 0.07, 0.14, 0.11, 0.03, 0, 0, 0],
  },
  temperate_oceanic: {
    id: "temperate_oceanic",
    rain: [0.4, 0.35, 0.33, 0.3, 0.28, 0.25, 0.22, 0.25, 0.28, 0.35, 0.4, 0.4],
    storm: [0.06, 0.05, 0.04, 0.02, 0.02, 0.02, 0.02, 0.02, 0.03, 0.05, 0.06, 0.06],
    snow: [0.04, 0.04, 0.01, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.03],
    heat: [0, 0, 0, 0, 0.01, 0.03, 0.06, 0.05, 0.01, 0, 0, 0],
  },
  arid: {
    id: "arid",
    rain: [0.06, 0.06, 0.05, 0.03, 0.02, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.06],
    storm: [0.01, 0.01, 0.01, 0.01, 0.01, 0, 0, 0, 0, 0.01, 0.01, 0.01],
    snow: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    heat: [0.02, 0.05, 0.12, 0.25, 0.45, 0.6, 0.65, 0.62, 0.45, 0.2, 0.06, 0.02],
  },
};

/** Effect of weather on trips, by segment order students, office, families, laborers, tourists, night. */
export const WEATHER_EFFECT: Record<WeatherKind, readonly number[]> = {
  clear: [1, 1, 1, 1, 1, 1],
  cloudy: [1, 1, 0.98, 1, 0.97, 1],
  rain: [0.88, 0.92, 0.82, 0.86, 0.8, 0.85],
  storm: [0.65, 0.72, 0.55, 0.6, 0.5, 0.55],
  snow: [0.7, 0.75, 0.6, 0.7, 0.65, 0.6],
  heat: [0.93, 0.95, 0.9, 0.88, 0.92, 1.05],
};

export const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: "Clear day",
  cloudy: "Cloudy day",
  rain: "Rainy day",
  storm: "Heavy storm",
  snow: "Snow",
  heat: "Hot day",
};
