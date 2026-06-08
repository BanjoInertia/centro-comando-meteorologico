// =============================================================================
// WEATHER API CLIENT - CheckWX + Open-Meteo
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
    return json.data?.[0] ?? null;
  } catch (err) {
    console.error("[Weather] Erro ao buscar TAF:", err);
    return null;
  }
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

