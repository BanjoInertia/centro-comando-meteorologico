import { NextRequest, NextResponse } from "next/server";
import { generateWeatherBriefing } from "@/lib/groq/client";
import { MetarData, TafData, WeatherAlert, AlertLevel } from "@/types";

export async function POST(req: NextRequest) {
  let metar: MetarData | null = null;
  let taf: TafData | null = null;
  try {
    const body = await req.json();
    const { airport, metar: parsedMetar, taf: parsedTaf } = body as {
      airport: { name: string };
      metar: MetarData | null;
      taf: TafData | null;
    };
    metar = parsedMetar;
    taf = parsedTaf;

    if (!airport?.name) {
      return NextResponse.json(
        { data: null, error: "Campo 'airport' é obrigatório", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const data = await generateWeatherBriefing(airport.name, metar, taf);

    return NextResponse.json({
      data,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    try {
      console.warn("Retornando fallback determinístico:", err?.message || String(err));

      const vis = metar?.visibility?.meters;
      const ceilFt = (metar as any)?.ceiling?.feet ??
        metar?.sky_conditions
          ?.filter((c) => c.sky_cover === "BKN" || c.sky_cover === "OVC")
          .sort((a, b) => a.base_feet_agl - b.base_feet_agl)[0]?.base_feet_agl;

      const flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR" =
        (vis !== undefined && vis < 1600) || (ceilFt !== undefined && ceilFt < 500) ? "LIFR" :
          (vis !== undefined && vis < 5000) || (ceilFt !== undefined && ceilFt < 1000) ? "IFR" :
            (vis !== undefined && vis < 8000) || (ceilFt !== undefined && ceilFt < 3000) ? "MVFR" : "VFR";

      const alerts: WeatherAlert[] = [{
        level: "info",
        title: "Previsão AI Indisponível",
        description: "A IA está temporariamente indisponível. Os alertas abaixo foram gerados diretamente a partir dos blocos do TAF.",
      }];

      if (taf?.forecast?.length) {
        for (const block of taf.forecast) {
          const type = block.change?.type ?? "INITIAL";
          if (type === "INITIAL") continue;
          if (type === "PROB30" || type === "PROB40") continue;

          const from = block.change?.period?.from;
          const to = block.change?.period?.to;

          const parts: string[] = [];
          if (block.wind) {
            const deg = block.wind.degrees != null ? `${block.wind.degrees}°` : "VRB";
            const gust = block.wind.gust_kts ? ` rajadas ${block.wind.gust_kts}kt` : "";
            parts.push(`Vento ${deg}/${block.wind.speed_kts}kt${gust}`);
          }
          if (block.visibility?.meters !== undefined) parts.push(`Vis. ${block.visibility.meters}m`);
          if (block.clouds?.length) {
            parts.push(block.clouds.map((c) => `${c.code} ${c.feet}ft`).join(" · "));
          }
          if (parts.length === 0) continue;

          const bv = block.visibility?.meters ?? Infinity;
          const bceil = block.clouds?.filter((c) => c.code === "BKN" || c.code === "OVC").sort((a, b) => a.feet - b.feet)[0]?.feet ?? Infinity;
          const level: AlertLevel =
            bv < 1600 || bceil < 500 ? "danger" :
              bv < 5000 || bceil < 1000 ? "attention" :
                bv < 8000 || bceil < 3000 ? "attention" : "info";

          const typeLabel: Record<string, string> = { TEMPO: "TEMPO", BECMG: "BECMG", FM: "Mudança" };
          alerts.push({
            level,
            title: `${typeLabel[type] ?? "Previsão"}: ${parts[0]}`,
            description: parts.join(" · "),
            validFrom: from,
            validTo: to,
          });
        }
      }

      return NextResponse.json({
        data: {
          summary: metar?.raw_text ? `Previsão AI indisponível. METAR: ${metar.raw_text}` : "Previsão AI indisponível.",
          conditions: metar?.raw_text ?? "Condições atuais indisponíveis.",
          alerts,
          flightCategory,
          updatedAt: new Date().toISOString(),
          isMock: true,
          forecast: metar ?? undefined,
        },
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (mockErr: any) {
      return NextResponse.json({
        data: null,
        error: `Falha dupla: IA falhou (${err?.message}) e fallback falhou (${mockErr?.message})`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
