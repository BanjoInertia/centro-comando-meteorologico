// =============================================================================
// GROQ AI CLIENT - Centro de Comando Meteorológico
// =============================================================================

import Groq from "groq-sdk";
import { MetarData, TafData, AiBriefing } from "@/types";

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
5. Nunca invente fenômenos meteorológicos que não estejam presentes no METAR ou TAF fornecidos.
6. PROIBIDO incluir códigos brutos de METAR/TAF nos campos de texto (summary, conditions, description). Traduza TUDO para português claro.
7. PROIBIDO escrever timestamps ISO dentro dos campos "description", "summary" ou "conditions". Use linguagem natural como "entre 21h e 23h UTC".

INTERPRETAÇÃO DOS BLOCOS TAF:
- Bloco base / FM (From): mudança PERMANENTE — substitui todas as condições anteriores.
- BECMG (Becoming): mudança GRADUAL que se torna permanente ao FINAL do período.
- TEMPO (Temporary): condições TEMPORÁRIAS dentro da janela indicada. Considere o PIOR caso.
- PROB30/PROB40: condições com 30–40% de probabilidade — mencione como risco secundário em alerta "info".
- Se FM/BECMG não listar nuvens, significa céu limpo/NSC — NÃO carregue nuvens de blocos anteriores.

SCHEMA DE RESPOSTA (JSON):
{
  "summary": "Resumo das condições ATUAIS e evolução geral ao longo do TAF (2-3 frases)",
  "conditions": "Condições atuais detalhadas com emojis (baseado no METAR)",
  "alerts": [
    {
      "level": "info" | "attention" | "danger",
      "title": "Título curto do alerta",
      "description": "Descrição detalhada",
      "validFrom": "ISO 8601 — OBRIGATÓRIO quando o bloco TAF tiver horário de início",
      "validTo": "ISO 8601 — OBRIGATÓRIO quando o bloco TAF tiver horário de fim. NUNCA null se o bloco tiver to definido"
    }
  ],
  "flightCategory": "VFR" | "MVFR" | "IFR" | "LIFR",
  "forecast": {
    "temperature": { "celsius": 22 },
    "wind": { "degrees": 180, "speed_kts": 12 },
    "visibility": { "meters": 9999 },
    "barometer": { "hpa": 1012 },
    "sky_conditions": [{ "sky_cover": "SCT", "base_feet_agl": 2000 }]
  }
}

INSTRUÇÃO ESPECIAL PARA "alerts":
Gere UM alerta por bloco TAF com condições significativas (FM, BECMG, TEMPO).
Use os timestamps ISO exatos dos blocos TAF fornecidos como validFrom/validTo.
Isso permite que o sistema filtre automaticamente qual alerta mostrar conforme o usuário avança na linha do tempo.
Se houver condições atuais relevantes no METAR, crie também um alerta com validFrom = hora atual.

INSTRUÇÃO PARA "forecast":
Copie os valores EXATOS do METAR atual (vento, visibilidade, nuvens, temperatura, pressão).

CRITÉRIOS ICAO para flightCategory (condições ATUAIS do METAR):
  LIFR = teto < 500 ft  OU visibilidade < 1600 m
  IFR  = teto 500–999 ft OU visibilidade 1600–4999 m
  MVFR = teto 1000–3000 ft OU visibilidade 5000–7999 m
  VFR  = teto > 3000 ft  E  visibilidade >= 8000 m
`;

function formatTafBlocks(taf: TafData): string {
  if (!taf.forecast?.length) return "Sem blocos disponíveis.";
  return taf.forecast.map((block) => {
    const type = block.change?.type ?? "BASE";
    const from = block.change?.period?.from ?? "?";
    const to = block.change?.period?.to;
    const range = to ? `${from} → ${to}` : `${from} → (fim do TAF)`;

    const parts: string[] = [];
    if (block.wind) {
      const deg = block.wind.degrees != null ? `${block.wind.degrees}°` : "VRB";
      const spd = block.wind.speed_kts;
      const gust = block.wind.gust_kts ? ` raj ${block.wind.gust_kts}kt` : "";
      parts.push(`vento ${deg}/${spd}kt${gust}`);
    }
    if (block.visibility?.meters !== undefined) parts.push(`vis ${block.visibility.meters}m`);
    if (block.clouds?.length) {
      parts.push(block.clouds.map((c) => `${c.code} ${c.feet}ft`).join(" "));
    }
    return `[${type}] ${range}: ${parts.join(", ") || "sem parâmetros"}`;
  }).join("\n");
}

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

export async function generateWeatherBriefing(
  airportName: string,
  metar: MetarData | null,
  taf: TafData | null,
): Promise<AiBriefing> {
  const groq = getGroq();

  const nowIso = new Date().toISOString();
  const tafBlocksBlock = taf
    ? `\nBLOCOS TAF COM TIMESTAMPS ISO ABSOLUTOS (use estes valores exatos para validFrom/validTo dos alertas):\n${formatTafBlocks(taf)}\n`
    : "";

  const userPrompt = `
Aeroporto: ${airportName}
Data/hora atual (UTC): ${nowIso}

METAR (Observação atual):
${metar?.raw_text ?? "Não disponível"}

TAF (Previsão):
${taf?.raw_text ?? "Não disponível"}
${tafBlocksBlock}
Gere o briefing meteorológico completo em JSON conforme o schema do sistema.
- "summary": condições atuais + evolução geral do TAF em 2-3 frases.
- "conditions": condições atuais do METAR com detalhes e emojis.
- "alerts": UM alerta por bloco TAF significativo, com validFrom/validTo exatos dos blocos acima.
- "forecast": copie os valores exatos do METAR atual.
- "flightCategory": categoria ATUAL baseada no METAR.
  `.trim();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1200,
  });

  const rawJson = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(rawJson);

  const { visMet, ceilFt } = extractMetarLimits(metar);
  const flightCategory = metar?.flight_category ?? computeFlightCategory(visMet, ceilFt);

  const forecast: AiBriefing["forecast"] = metar ?? undefined;

  return {
    summary: parsed.summary ?? "",
    conditions: parsed.conditions ?? "",
    alerts: (parsed.alerts ?? []),
    flightCategory,
    updatedAt: new Date().toISOString(),
    forecast,
  };
}
