import { NextRequest, NextResponse } from "next/server";

const CHECKWX_BASE = "https://api.checkwx.com";

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
        const icao = item?.icao ?? item?.station;
        const cat = item?.flight_category;
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

    for (const icao of icaos) {
      if (!results[icao]) {
        results[icao] = "VFR";
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
