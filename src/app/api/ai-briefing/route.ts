import { NextRequest, NextResponse } from "next/server";
import { generateWeatherBriefing } from "@/lib/gemini/client";
import { MetarData, TafData, WeatherAlert } from "@/types";
import { parseTafAtHour } from "@/lib/weather/taf-parser";

export async function POST(req: NextRequest) {
  let hourOffset = 0;
  let metar: MetarData | null = null;
  let taf: TafData | null = null;
  try {
    const body = await req.json();
    const { airport, metar: parsedMetar, taf: parsedTaf, hourOffset: parsedHourOffset = 0 } = body as {
      airport: { name: string };
      metar: MetarData | null;
      taf: TafData | null;
      hourOffset?: number;
    };
    hourOffset = parsedHourOffset;
    metar = parsedMetar;
    taf = parsedTaf;

    if (!airport?.name) {
      return NextResponse.json(
        { data: null, error: "Campo 'airport' é obrigatório", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const data = await generateWeatherBriefing(airport.name, metar, taf, hourOffset);

    return NextResponse.json({
      data,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    try {
      console.warn("Retornando Mock Data devido a falha na API do Gemini/Groq:", err?.message || String(err));
      
      let flightCategory = metar?.flight_category || "VFR";
      let summary = `Briefing indisponível (A IA excedeu o limite de uso). Exibindo condições atuais do METAR.`;
      let conditions = metar?.raw_text ? `METAR: ${metar.raw_text}` : "Condições atuais indisponíveis.";
      let alerts: WeatherAlert[] = [
        {
          level: "info",
          title: "Previsão AI Indisponível",
          description: "A inteligência artificial atingiu o limite de consultas gratuitas. As condições mostradas refletem a observação atual (METAR).",
        }
      ];

      let forecast: any = metar ? { ...metar } : {};

      if (hourOffset > 0 && taf) {
        summary = `Briefing indisponível (A IA excedeu o limite de uso). Exibindo previsão estruturada do TAF para +${hourOffset}H.`;
        conditions = taf.raw_text ? `TAF base: ${taf.raw_text}` : "Condições previstas baseadas no TAF.";
        alerts[0].description = `A inteligência artificial está indisponível. As condições e a categoria de voo (cor do aeroporto) refletem a extração determinística do TAF para o horário selecionado (+${hourOffset}H).`;

        const snap = parseTafAtHour(taf, hourOffset);

        if (snap.wind)       forecast.wind       = snap.wind;
        if (snap.visibility) forecast.visibility = snap.visibility;
        if (snap.sky_conditions) {
          forecast.sky_conditions = snap.sky_conditions;
        }

        const v = snap.visibility?.meters ?? Infinity;
        const c = snap.ceiling_ft ?? Infinity;
        if      (v < 1600 || c < 500)  flightCategory = "LIFR";
        else if (v < 5000 || c < 1000) flightCategory = "IFR";
        else if (v < 8000 || c < 3000) flightCategory = "MVFR";
        else                            flightCategory = "VFR";
      }

      return NextResponse.json({
        data: {
          summary,
          conditions,
          alerts,
          flightCategory,
          updatedAt: new Date().toISOString(),
          isMock: true,
          forecast,
        },
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (mockErr: any) {
      return NextResponse.json({
        data: null,
        error: `Falha dupla: a IA falhou (${err?.message}) e o fallback falhou (${mockErr?.message})`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
