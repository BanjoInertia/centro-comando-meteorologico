import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat        = searchParams.get("lat");
  const lon        = searchParams.get("lon");
  const hourOffset = parseInt(searchParams.get("hourOffset") || "0", 10);

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const base = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1";
  const url  = `${base}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,pressure_msl&timezone=UTC&forecast_days=3`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const json = await res.json();
    const times:     string[] = json.hourly?.time            ?? [];
    const temps:     number[] = json.hourly?.temperature_2m  ?? [];
    const pressures: number[] = json.hourly?.pressure_msl    ?? [];

    const target = new Date(Date.now() + hourOffset * 3600 * 1000);
    target.setMinutes(0, 0, 0);
    const targetStr = target.toISOString().slice(0, 16);

    const idx = times.findIndex((t) => t === targetStr);
    if (idx === -1) {
      return NextResponse.json({ error: "Hora não encontrada na previsão" }, { status: 404 });
    }

    return NextResponse.json({
      temperature: Math.round(temps[idx] * 10) / 10,
      pressure:    Math.round(pressures[idx]),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
