import { NextResponse } from "next/server";
import { WindPoint } from "@/types";

function buildGrid(): { lat: number; lon: number }[] {
  const points: { lat: number; lon: number }[] = [];
  const lats = Array.from({ length: 18 }, (_, i) => Math.round(-85 + i * 10));
  const lons = Array.from({ length: 36 }, (_, i) => -180 + i * 10);
  for (const lat of lats) {
    for (const lon of lons) {
      points.push({ lat, lon });
    }
  }
  return points;
}


export async function GET() {
  const grid = buildGrid();

  const latStr = grid.map((p) => p.lat).join(",");
  const lonStr = grid.map((p) => p.lon).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latStr}` +
    `&longitude=${lonStr}` +
    `&current=wind_speed_10m,wind_direction_10m,temperature_2m` +
    `&wind_speed_unit=ms` +
    `&forecast_days=1`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = await res.json();

    const results: any[] = Array.isArray(json) ? json : [json];

    const points: WindPoint[] = results.map((r, i) => {
      const current = r.current ?? {};
      const speedMs: number = current.wind_speed_10m ?? 0;
      const dirDeg: number = current.wind_direction_10m ?? 0;
      const tempC: number = current.temperature_2m ?? 0;

      const dirRad = (dirDeg * Math.PI) / 180;
      const u = -speedMs * Math.sin(dirRad);
      const v = -speedMs * Math.cos(dirRad);

      return {
        lat: grid[i]?.lat ?? 0,
        lon: grid[i]?.lon ?? 0,
        u,
        v,
        temp: tempC,
      };
    });

    return NextResponse.json({
      data: { points, fetchedAt: new Date().toISOString() },
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Wind API] Erro ao buscar Open-Meteo:", err);

    const fallback: WindPoint[] = buildGrid().map(({ lat, lon }) => {
      const latRad = (lat * Math.PI) / 180;
      const speedMs = 3 + Math.abs(Math.cos(latRad)) * 8;
      const dirDeg = (lon + 180) % 360;
      const dirRad = (dirDeg * Math.PI) / 180;
      return {
        lat,
        lon,
        u: -speedMs * Math.sin(dirRad),
        v: -speedMs * Math.cos(dirRad),
        temp: 25 * Math.sin(latRad) + (Math.random() - 0.5) * 5,
      };
    });

    return NextResponse.json({
      data: { points: fallback, fetchedAt: new Date().toISOString() },
      error: "Open-Meteo indisponível — usando dados simulados",
      timestamp: new Date().toISOString(),
    });
  }
}
