// =============================================================================
// GROQ AI CLIENT - Centro de Comando Meteorológico
// =============================================================================

import Groq from "groq-sdk";
import { MetarData, TafData, AiBriefing, WeatherAlert } from "@/types";
import { parseTafAtHour } from "@/lib/weather/taf-parser";

let groqInstance: Groq | null = null;

function getGroq(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY não encontrada. Configure seu arquivo .env.local"
      );
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

// --- Prompt do Sistema ---

export const SYSTEM_PROMPT = `
Você é um meteorologista especializado em aviação civil e militar, com profundo conhecimento
em decodificação de relatórios METAR e TAF. Seu papel é traduzir dados brutos de aviação
meteorológica em briefings claros, acessíveis e actionáveis para pilotos e controladores de voo.

REGRAS:
1. Sempre use linguagem clara e objetiva, em Português do Brasil.
2. Use emojis para facilitar a leitura rápida (🌬️ vento, 🌫️ nevoeiro, ⛈️ trovoada, 🌧️ chuva, 
   ☀️ sol, ☁️ nuvens, 🌡️ temperatura, 📊 pressão, 👁️ visibilidade).
3. Identifique condições de perigo IMEDIATO e classifique alertas como:
   - "info": informação geral, sem impacto operacional
   - "attention": condições que requerem atenção (IFR, ventos fortes, visibilidade reduzida)
   - "danger": perigo imediato à operação (LIFR, tempestades severas, cizalhamento de vento)
4. Responda SEMPRE em formato JSON válido, sem markdown, conforme o schema abaixo.
5. Se a "Hora de referência" for no futuro (+Xh), você DEVE basear sua previsão prioritariamente no TAF fornecido. Se não houver TAF disponível, avise de forma concisa na resposta ("⚠️ TAF indisponível. Condições assumidas com base no METAR atual.").
6. Nunca invente fenômenos meteorológicos que não estejam presentes no METAR ou TAF fornecidos.
7. PROIBIDO incluir códigos brutos de METAR/TAF nos campos de texto (summary, conditions, description). Traduza TUDO para português claro. Exemplo: NÃO escreva "08034G46KT", escreva "vento de 80° a 34 kt com rajadas de 46 kt".
8. PROIBIDO escrever timestamps ISO (ex: "2026-06-01T21:30:00Z") dentro dos campos "description", "summary" ou "conditions". Timestamps pertencem APENAS aos campos "validFrom" e "validTo". Nas descrições, use linguagem natural como "entre 21h e 23h UTC" ou "nas próximas 3 horas".

INTERPRETAÇÃO DOS BLOCOS TAF:
- Bloco base / FM (From): mudança PERMANENTE — substitui todas as condições anteriores a partir do horário indicado.
- BECMG (Becoming): mudança GRADUAL que se torna permanente ao FINAL do período. Para a hora de referência, aplique se o BECMG já tiver começado (blockFrom ≤ horaRef).
- TEMPO (Temporary): condições TEMPORÁRIAS que podem ocorrer DENTRO da janela indicada. Aplique SOMENTE se a hora de referência cair dentro da janela TEMPO. Considere o PIOR caso (mais restritivo) para segurança operacional.
- PROB30/PROB40: condições com 30% ou 40% de probabilidade. NÃO use como base principal — mencione apenas como risco secundário em um alerta de nível "info".
- Se o bloco BECMG ou FM não listar nuvens (ex: apenas HZ), isso significa céu limpo/NSC naquele período — NÃO carregue nuvens de blocos anteriores.


SCHEMA DE RESPOSTA (JSON):
{
  "summary": "Resumo em 1-2 frases da condição geral",
  "conditions": "Condições atuais detalhadas com emojis",

  "alerts": [
    {
      "level": "info" | "attention" | "danger",
      "title": "Título curto do alerta",
      "description": "Descrição detalhada",
      "validFrom": "ISO 8601 ou null",
      "validTo": "ISO 8601 ou null"
    }
  ],
  "flightCategory": "VFR" | "MVFR" | "IFR" | "LIFR",
  "visibility_meters": número inteiro da visibilidade prevista em metros (ex: 1500),
  "ceiling_ft": número inteiro do teto previsto em pés (camada BKN ou OVC mais baixa, ex: 400),
  "forecast": {
    "temperature": { "celsius": 22 },
    "wind": { "degrees": 180, "speed_kts": 12 },
    "visibility": { "meters": 9999 },
    "barometer": { "hpa": 1012 },
    "sky_conditions": [
      { "sky_cover": "SCT", "base_feet_agl": 2000 }
    ]
  }
}

INSTRUÇÕES PARA O CAMPO "forecast":
Se a hora for no futuro, baseie-se estritamente no TAF para vento, visibilidade e nuvens. O TAF geralmente não traz temperatura e pressão horária, então para esses campos você DEVE estimar valores realistas com base no METAR atual e na variação típica diurna/noturna para a hora solicitada. Se for a hora atual, copie os dados exatos do METAR.

CRITÉRIOS ICAO OBRIGATÓRIOS para flightCategory:
  LIFR = teto < 500 ft  OU visibilidade < 1600 m
  IFR  = teto 500–999 ft OU visibilidade 1600–4999 m
  MVFR = teto 1000–3000 ft OU visibilidade 5000–7999 m
  VFR  = teto > 3000 ft  E  visibilidade >= 8000 m
`;

// --- Cálculo Flight Category ---

function computeFlightCategory(
  visMetersFallback: number | undefined,
  ceilingFtFallback: number | undefined
): "VFR" | "MVFR" | "IFR" | "LIFR" | undefined {
  if (visMetersFallback === undefined && ceilingFtFallback === undefined) return undefined;

  const vis = visMetersFallback ?? Infinity;
  const ceil = ceilingFtFallback ?? Infinity;

  if (vis < 1600 || ceil < 500) return "LIFR";
  if (vis < 5000 || ceil < 1000) return "IFR";
  if (vis < 8000 || ceil < 3000) return "MVFR";
  return "VFR";
}

function extractMetarLimits(metar: MetarData | null): { visMet?: number; ceilFt?: number } {
  if (!metar) return {};
  const visMet = metar.visibility?.meters;
  const ceilFt =
    (metar as any).ceiling?.feet ??
    metar.sky_conditions
      ?.filter((l) => l.sky_cover === "BKN" || l.sky_cover === "OVC")
      .sort((a, b) => a.base_feet_agl - b.base_feet_agl)[0]
      ?.base_feet_agl;
  return { visMet, ceilFt };
}

// --- Função de Geração de Briefing ---

export async function generateWeatherBriefing(
  airportName: string,
  metar: MetarData | null,
  taf: TafData | null,
  hourOffset: number = 0
): Promise<AiBriefing> {
  const groq = getGroq();

  const nowIso = new Date().toISOString();

  const tafSnapshot = hourOffset > 0 && taf ? parseTafAtHour(taf, hourOffset) : null;

  const parsedConditionsBlock = tafSnapshot
    ? `
CONDIÇÕES CALCULADAS PARA +${hourOffset}H (use estes valores exatos no campo "forecast"):
- Vento: ${tafSnapshot.wind
      ? `${tafSnapshot.wind.degrees}° a ${tafSnapshot.wind.speed_kts}kt${tafSnapshot.wind.gust_kts ? ` rajadas ${tafSnapshot.wind.gust_kts}kt` : ""}`
      : "não disponível no TAF"
    }
- Visibilidade: ${tafSnapshot.visibility ? `${tafSnapshot.visibility.meters}m` : "não disponível no TAF"}
- Nuvens: ${tafSnapshot.sky_conditions?.length
      ? tafSnapshot.sky_conditions.map((s) => `${s.sky_cover} ${s.base_feet_agl}ft`).join(", ")
      : "sem camadas BKN/OVC (céu limpo ou FEW/SCT)"
    }${tafSnapshot.hasTempo ? "\n- ⚠️ TEMPO ativo nesta janela — condições temporárias mais restritivas aplicadas." : ""}
`
    : "";

  const userPrompt = `
Aeroporto: ${airportName}
Data/hora atual (UTC): ${nowIso}
Hora de referência: Agora ${hourOffset > 0 ? `+ ${hourOffset}h` : ""}

METAR (Observação atual):
${metar?.raw_text ?? "Não disponível"}

TAF (Previsão):
${taf?.raw_text ?? "Não disponível"}
${parsedConditionsBlock}
Gere o briefing meteorológico completo em JSON conforme o schema do sistema. Considere a hora de referência solicitada. Os campos validFrom e validTo dos alertas DEVEM ser calculados a partir da "Data/hora atual (UTC)" acima — nunca use as datas brutas do TAF/METAR como estão.
  `.trim();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1024,
  });

  const rawJson = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(rawJson);

  let flightCategory: AiBriefing["flightCategory"];

  if (hourOffset === 0 && metar) {
    const { visMet, ceilFt } = extractMetarLimits(metar);
    flightCategory = metar.flight_category ?? computeFlightCategory(visMet, ceilFt);
  } else if (tafSnapshot) {
    flightCategory = computeFlightCategory(
      tafSnapshot.visibility?.meters,
      tafSnapshot.ceiling_ft
    );
  } else {
    flightCategory = parsed.flightCategory;
  }

  let forecast: AiBriefing["forecast"];

  if (hourOffset === 0) {
    forecast = metar ?? undefined;
  } else if (tafSnapshot) {
    forecast = {
      wind: tafSnapshot.wind,
      visibility: tafSnapshot.visibility,
      sky_conditions: tafSnapshot.sky_conditions,
      temperature: metar?.temperature,
      barometer: metar?.barometer,
      dewpoint: metar?.dewpoint,
    };
  } else {
    forecast = parsed.forecast;
  }

  return {
    summary: parsed.summary ?? "",
    conditions: parsed.conditions ?? "",
    alerts: (parsed.alerts ?? []) as WeatherAlert[],
    flightCategory,
    updatedAt: new Date().toISOString(),
    forecast,
  };
}

