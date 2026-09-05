import type { WeatherData } from "@/services/weather.service";

export type Season =
  | "WINTER"
  | "SUMMER"
  | "MONSOON"
  | "POST_MONSOON";

export type DemandCategory =
  | "RESPIRATORY"
  | "FEVER_COLD"
  | "GASTROINTESTINAL"
  | "VECTOR_BORNE_PREVENTION"
  | "ALLERGY"
  | "DEHYDRATION"
  | "GENERAL";

export interface SeasonalDemandSignal {
  season: Season;

  temperatureSignal: "LOW" | "MODERATE" | "HIGH";
  humiditySignal: "LOW" | "MODERATE" | "HIGH";
  rainfallSignal: "LOW" | "MODERATE" | "HIGH";

  weatherCondition: string;

  categories: DemandCategory[];

  confidence: "LOW" | "MEDIUM" | "HIGH";

  explanation: string;
}

function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return "SUMMER";
  }

  if (month >= 6 && month <= 9) {
    return "MONSOON";
  }

  if (month >= 10 && month <= 11) {
    return "POST_MONSOON";
  }

  return "WINTER";
}

function getTemperatureSignal(
  temperature: number,
): "LOW" | "MODERATE" | "HIGH" {
  if (temperature < 20) {
    return "LOW";
  }

  if (temperature > 32) {
    return "HIGH";
  }

  return "MODERATE";
}

function getHumiditySignal(
  humidity: number,
): "LOW" | "MODERATE" | "HIGH" {
  if (humidity < 40) {
    return "LOW";
  }

  if (humidity >= 70) {
    return "HIGH";
  }

  return "MODERATE";
}

function getRainfallSignal(
  rain: number,
): "LOW" | "MODERATE" | "HIGH" {
  if (rain <= 0) {
    return "LOW";
  }

  if (rain < 5) {
    return "MODERATE";
  }

  return "HIGH";
}

function getWeatherCondition(weatherCode: number): string {
  if (weatherCode === 0) {
    return "CLEAR";
  }

  if (weatherCode >= 1 && weatherCode <= 3) {
    return "CLOUDY";
  }

  if (weatherCode >= 45 && weatherCode <= 48) {
    return "FOG";
  }

  if (weatherCode >= 51 && weatherCode <= 67) {
    return "RAIN";
  }

  if (weatherCode >= 71 && weatherCode <= 77) {
    return "SNOW";
  }

  if (weatherCode >= 80 && weatherCode <= 82) {
    return "RAIN_SHOWERS";
  }

  if (weatherCode >= 95) {
    return "THUNDERSTORM";
  }

  return "UNKNOWN";
}

export function getSeasonalDemandSignals(
  weather: WeatherData,
): SeasonalDemandSignal {
  const season = getSeason();

  const temperatureSignal = getTemperatureSignal(
    weather.temperature,
  );

  const humiditySignal = getHumiditySignal(
    weather.humidity,
  );

  const rainfallSignal = getRainfallSignal(
    weather.rain,
  );

  const weatherCondition = getWeatherCondition(
    weather.weatherCode,
  );

  const categories = new Set<DemandCategory>();

  if (
    season === "WINTER" ||
    temperatureSignal === "LOW"
  ) {
    categories.add("RESPIRATORY");
    categories.add("FEVER_COLD");
  }

  if (
    season === "SUMMER" ||
    temperatureSignal === "HIGH"
  ) {
    categories.add("DEHYDRATION");
  }

  if (
    season === "MONSOON" ||
    rainfallSignal === "HIGH" ||
    humiditySignal === "HIGH"
  ) {
    categories.add("FEVER_COLD");
    categories.add("GASTROINTESTINAL");
    categories.add("VECTOR_BORNE_PREVENTION");
  }

  if (
    humiditySignal === "HIGH" ||
    weatherCondition === "FOG"
  ) {
    categories.add("ALLERGY");
    categories.add("RESPIRATORY");
  }

  if (categories.size === 0) {
    categories.add("GENERAL");
  }

  let confidence: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (
    season === "MONSOON" &&
    (rainfallSignal !== "LOW" || humiditySignal === "HIGH")
  ) {
    confidence = "HIGH";
  } else if (
    season === "SUMMER" ||
    season === "WINTER"
  ) {
    confidence = "MEDIUM";
  }

  const explanation =
    `Season: ${season}. ` +
    `Temperature is ${temperatureSignal.toLowerCase()}, ` +
    `humidity is ${humiditySignal.toLowerCase()}, ` +
    `and rainfall is ${rainfallSignal.toLowerCase()}. ` +
    `These environmental conditions may influence ` +
    `seasonal pharmacy demand patterns.`;

  return {
    season,
    temperatureSignal,
    humiditySignal,
    rainfallSignal,
    weatherCondition,
    categories: Array.from(categories),
    confidence,
    explanation,
  };
}