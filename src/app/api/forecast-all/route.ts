import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const base = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1";
  const url = `${base}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,pressure_msl,windspeed_10m,winddirection_10m,windgusts_10m,visibility&timezone=UTC&forecast_days=3`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const json = await res.json();
    const times: string[] = json.hourly?.time ?? [];
    const temps: number[] = json.hourly?.temperature_2m ?? [];
    const pressures: number[] = json.hourly?.pressure_msl ?? [];
    const windspeed: number[] = json.hourly?.windspeed_10m ?? [];
    const winddir: number[] = json.hourly?.winddirection_10m ?? [];
    const windgusts: number[] = json.hourly?.windgusts_10m ?? [];
    const visibility: number[] = json.hourly?.visibility ?? [];

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const baseStr = now.toISOString().slice(0, 16);
    const baseIdx = times.findIndex((t) => t === baseStr);

    if (baseIdx === -1) {
      return NextResponse.json({ error: "Hora atual não encontrada" }, { status: 404 });
    }

    const result: Record<number, {
      temperature: number;
      pressure: number;
      wind_degrees: number | null;
      wind_kts: number | null;
      wind_gust_kts: number | null;
      visibility_m: number | null;
    }> = {};

    for (let offset = 0; offset <= 24; offset++) {
      const idx = baseIdx + offset;
      if (idx >= times.length) break;

      const speedKts = windspeed[idx] != null ? Math.round(windspeed[idx] / 1.852) : null;
      const gustKts = windgusts[idx] != null ? Math.round(windgusts[idx] / 1.852) : null;

      result[offset] = {
        temperature: Math.round(temps[idx] * 10) / 10,
        pressure: Math.round(pressures[idx]),
        wind_degrees: winddir[idx] != null ? Math.round(winddir[idx]) : null,
        wind_kts: speedKts,
        wind_gust_kts: gustKts,
        visibility_m: visibility[idx] != null ? Math.round(visibility[idx]) : null,
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
