// =============================================================================
// WEATHER API CLIENT
// =============================================================================

import { MetarData, TafData } from "@/types";

const CHECKWX_BASE = "https://api.checkwx.com";

// --- METAR ---

export async function fetchMetar(icao: string): Promise<MetarData | null> {
  const apiKey = process.env.CHECKWX_API_KEY;
  if (!apiKey || apiKey === "your_checkwx_api_key_here") {
    console.warn(
      "[Weather] CHECKWX_API_KEY não configurada. Retornando dados mock."
    );
    return getMockMetar(icao);
  }

  try {
    const res = await fetch(`${CHECKWX_BASE}/metar/${icao}/decoded`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`CheckWX METAR HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.[0] ?? null;
  } catch (err) {
    console.error("[Weather] Erro ao buscar METAR:", err);
    return null;
  }
}

// --- TAF ---

export async function fetchTaf(icao: string): Promise<TafData | null> {
  const apiKey = process.env.CHECKWX_API_KEY;
  if (!apiKey || apiKey === "your_checkwx_api_key_here") {
    console.warn(
      "[Weather] CHECKWX_API_KEY não configurada. Retornando TAF mock."
    );
    return getMockTaf(icao);
  }

  try {
    const res = await fetch(`${CHECKWX_BASE}/taf/${icao}/decoded`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`CheckWX TAF HTTP ${res.status}`);
    const json = await res.json();
    const raw = json.data?.[0] ?? null;
    if (!raw) return null;
    const taf = normalizeTaf(raw);
    if (taf.valid_to && new Date(taf.valid_to) < new Date()) {
      console.warn("[TAF] Descartando TAF expirado para", icao, "valid_to:", taf.valid_to);
      return null;
    }
    return taf;
  } catch (err) {
    console.error("[Weather] Erro ao buscar TAF:", err);
    return null;
  }
}

// --- NORMALIZAÇÃO DO CHECKWX TAF ---

function normalizeTaf(raw: any): TafData {
  const validTo: string | undefined =
    raw.valid_to ??
    raw.period?.to ??
    raw.timestamp?.valid_to ??
    raw.timestamp?.to;

  const validFrom: string | undefined =
    raw.valid_from ??
    raw.period?.from ??
    raw.timestamp?.valid_from ??
    raw.timestamp?.from;

  const forecast: TafData["forecast"] = (raw.forecast ?? []).map((block: any) => {
    const from: string | undefined =
      block.change?.period?.from ??
      block.change?.timestamp?.from ??
      block.timestamp?.from;

    const to: string | undefined =
      block.change?.period?.to ??
      block.change?.timestamp?.to ??
      block.timestamp?.to;

    const changeType: string | undefined =
      block.change?.code ??
      block.change?.type ??
      block.change?.indicator?.code;
    const rawClouds: any[] = block.clouds ?? block.sky ?? [];
    const clouds = rawClouds.map((c: any) => ({
      code: c.code ?? c.sky_cover,
      feet: c.feet ?? c.base_feet_agl ?? 0,
    }));
    let visMet: number | undefined;
    if (block.visibility !== undefined) {
      const raw_m = block.visibility.meters ?? block.visibility.meter;
      if (typeof raw_m === "number") visMet = raw_m;
      else if (typeof raw_m === "string") {
        const parsed = parseFloat(raw_m);
        visMet = isNaN(parsed) ? 9999 : parsed;
      }
    }
    const wind = block.wind
      ? {
        degrees: typeof block.wind.degrees === "number" ? block.wind.degrees : undefined,
        speed_kts: block.wind.speed_kts ?? block.wind.speed ?? 0,
        gust_kts: block.wind.gust_kts ?? block.wind.gust,
      }
      : undefined;

    return {
      change:
        from || changeType
          ? {
            type: changeType,
            period: from || to ? { from: from ?? "", to: to ?? "" } : undefined,
          }
          : undefined,
      wind,
      visibility: visMet !== undefined ? { meters: visMet } : undefined,
      clouds: clouds.length > 0 ? clouds : undefined,
    };
  });

  return {
    raw_text: raw.raw_text ?? "",
    station: raw.icao ?? raw.station ?? "",
    issued: raw.timestamp?.issued ?? raw.issued,
    valid_from: validFrom,
    valid_to: validTo,
    forecast,
  };
}

// --- DADOS MOCK ---

function getMockMetar(icao: string): MetarData {
  const MOCK_CATS = ["VFR", "VFR", "VFR", "MVFR", "MVFR", "IFR", "LIFR"];
  const hash = icao.charCodeAt(0) + icao.charCodeAt(1) + icao.charCodeAt(2) + icao.charCodeAt(3);
  const flight_category = MOCK_CATS[hash % MOCK_CATS.length] as "VFR" | "MVFR" | "IFR" | "LIFR";

  return {
    raw_text: `${icao} 141000Z 12005KT 9999 FEW025 SCT080 24/18 Q1018 NOSIG`,
    station: icao,
    observed: new Date().toISOString(),
    wind: { degrees: 120, speed_kts: 5 },
    visibility: { meters: 9999 },
    sky_conditions: [
      { sky_cover: "FEW", base_feet_agl: 2500 },
      { sky_cover: "SCT", base_feet_agl: 8000 },
    ],
    temperature: { celsius: 24 },
    dewpoint: { celsius: 18 },
    barometer: { hpa: 1018 },
    flight_category,
  };
}

function getMockTaf(icao: string): TafData {
  return {
    raw_text: `TAF ${icao} 280500Z 2806/2912 12005KT 9999 FEW025 \n BECMG 2814/2816 14010KT \n TEMPO 2818/2822 4000 TSRA BKN015CB`,
    station: icao,
  };
}

