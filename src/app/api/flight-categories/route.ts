import { NextRequest, NextResponse } from "next/server";

const CHECKWX_BASE = "https://api.checkwx.com";

const CAT_RANK: Record<string, number> = { VFR: 0, MVFR: 1, IFR: 2, LIFR: 3 };

function worstCategory(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a && !b) return null;
  if (!a) return b ?? null;
  if (!b) return a;
  return (CAT_RANK[a] ?? 0) >= (CAT_RANK[b] ?? 0) ? a : b;
}

function computeCategory(item: any): string | null {
  const rawCat: string | null = item?.flight_category ?? null;

  const vis: number | undefined = item?.visibility?.meters;
  const clouds: any[] = item?.sky_conditions ?? item?.clouds ?? [];
  const ceilFt: number | undefined =
    item?.ceiling?.feet ??
    clouds
      .filter((c: any) => c.sky_cover === "BKN" || c.sky_cover === "OVC" || c.code === "BKN" || c.code === "OVC")
      .map((c: any) => c.base_feet_agl ?? c.feet ?? Infinity)
      .sort((a: number, b: number) => a - b)[0];

  if (vis === undefined && ceilFt === undefined) return rawCat;

  const v = vis ?? Infinity;
  const c = ceilFt ?? Infinity;
  const computed =
    v < 1600 || c < 500 ? "LIFR" :
      v < 5000 || c < 1000 ? "IFR" :
        v < 8000 || c < 3000 ? "MVFR" : "VFR";

  return worstCategory(computed, rawCat);
}

export async function GET(req: NextRequest) {
  const icaosParam = req.nextUrl.searchParams.get("icaos");

  if (!icaosParam) {
    return NextResponse.json(
      { data: null, error: "Parâmetro 'icaos' é obrigatório" },
      { status: 400 }
    );
  }

  const icaos = icaosParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length >= 4 && s.length <= 4);

  if (icaos.length === 0) {
    return NextResponse.json(
      { data: null, error: "Nenhum ICAO válido fornecido" },
      { status: 400 }
    );
  }

  const apiKey = process.env.CHECKWX_API_KEY;

  if (!apiKey || apiKey === "your_checkwx_api_key_here") {
    const MOCK_CATS = ["VFR", "VFR", "VFR", "MVFR", "MVFR", "IFR", "LIFR"];
    const mock: Record<string, string> = {};
    for (const icao of icaos) {
      const hash = icao.charCodeAt(0) + icao.charCodeAt(1) + icao.charCodeAt(2) + icao.charCodeAt(3);
      mock[icao] = MOCK_CATS[hash % MOCK_CATS.length];
    }
    return NextResponse.json({ data: mock, error: null });
  }


  try {
    const results: Record<string, string> = {};

    const BATCH_SIZE = 20;
    for (let i = 0; i < icaos.length; i += BATCH_SIZE) {
      if (i > 0) await new Promise((r) => setTimeout(r, 1100));
      const batch = icaos.slice(i, i + BATCH_SIZE).join(",");
      const res = await fetch(`${CHECKWX_BASE}/metar/${batch}/decoded`, {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        console.warn(`[flight-categories] CheckWX HTTP ${res.status} para batch ${i}`);
        continue;
      }

      const json = await res.json();
      const items: any[] = Array.isArray(json.data) ? json.data : [];

      console.log(`[flight-categories] Batch ${i}: ${items.length} resultados da CheckWX`);

      for (const item of items) {
        const icao: string | undefined = item?.icao ?? item?.station ?? item?.ICAO ?? item?.Station;
        const cat = computeCategory(item);
        console.log(`[flight-categories] ${icao ?? "?"} → vis=${item?.visibility?.meters} ceil=${item?.ceiling?.feet} cat=${cat} raw_cat=${item?.flight_category}`);
        if (icao && cat) {
          results[icao] = cat;
        }
      }
    }

    if (Object.keys(results).length === 0) {
      console.warn("[flight-categories] Nenhum resultado da CheckWX — usando mock");
      const MOCK_CATS = ["VFR", "VFR", "VFR", "MVFR", "MVFR", "IFR", "LIFR"];
      for (const icao of icaos) {
        const hash = icao.charCodeAt(0) + icao.charCodeAt(1) + icao.charCodeAt(2) + icao.charCodeAt(3);
        results[icao] = MOCK_CATS[hash % MOCK_CATS.length];
      }
    }

    return NextResponse.json({ data: results, error: null });
  } catch (err: any) {
    console.error("[flight-categories] Erro:", err);
    const MOCK_CATS = ["VFR", "VFR", "VFR", "MVFR", "MVFR", "IFR", "LIFR"];
    const fallback: Record<string, string> = {};
    for (const icao of icaos) {
      const hash = icao.charCodeAt(0) + icao.charCodeAt(1) + icao.charCodeAt(2) + icao.charCodeAt(3);
      fallback[icao] = MOCK_CATS[hash % MOCK_CATS.length];
    }
    return NextResponse.json({ data: fallback, error: null });
  }
}
