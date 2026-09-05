const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;

  temperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;

  fetchedAt: string;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;

  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    weather_code: number;
  };
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const url = new URL(OPEN_METEO_BASE_URL);

  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "weather_code",
    ].join(","),
  );

  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Weather API request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,

    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    rain: data.current.rain,
    weatherCode: data.current.weather_code,

    fetchedAt: new Date().toISOString(),
  };
}