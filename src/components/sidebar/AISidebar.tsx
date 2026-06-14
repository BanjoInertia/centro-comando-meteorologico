"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useStationSelect } from "@/hooks/useStationSelect";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  Loader2, Star, Route, X, Navigation, Plane, Ruler,
  ChevronRight, Search, Wind, Thermometer, Eye, Gauge,
  Cloud, AlertTriangle, BotOff, RefreshCw
} from "lucide-react";
import type { MetarData } from "@/types";
import AlertList from "../alerts/AlertList";
import Badge from "../ui/Badge";
import { BRAZILIAN_AIRPORTS } from "@/data/airports";
import { parseTafAtHour } from "@/lib/weather/taf-parser";

// =============================================================================
// Mapeamento de Regiões
// =============================================================================

const REGION_ORDER: Record<string, string> = {
  "Brasil": "🇧🇷 Brasil",
  "EUA": "🌎 América do Norte",
  "Canadá": "🌎 América do Norte",
  "México": "🌎 América do Norte",
  "Panamá": "🌎 América do Norte",
  "Argentina": "🌎 América do Sul",
  "Chile": "🌎 América do Sul",
  "Colômbia": "🌎 América do Sul",
  "Peru": "🌎 América do Sul",
  "Equador": "🌎 América do Sul",
  "Venezuela": "🌎 América do Sul",
  "Reino Unido": "🌍 Europa",
  "França": "🌍 Europa",
  "Alemanha": "🌍 Europa",
  "Países Baixos": "🌍 Europa",
  "Espanha": "🌍 Europa",
  "Itália": "🌍 Europa",
  "Turquia": "🌍 Europa",
  "Suíça": "🌍 Europa",
  "Áustria": "🌍 Europa",
  "Irlanda": "🌍 Europa",
  "Portugal": "🌍 Europa",
  "Dinamarca": "🌍 Europa",
  "Suécia": "🌍 Europa",
  "Finlândia": "🌍 Europa",
  "Rússia": "🌍 Europa",
  "Polônia": "🌍 Europa",
  "Rep. Tcheca": "🌍 Europa",
  "Bélgica": "🌍 Europa",
  "Grécia": "🌍 Europa",
  "Emirados": "🌍 Oriente Médio",
  "Omã": "🌍 Oriente Médio",
  "Catar": "🌍 Oriente Médio",
  "Arábia Saudita": "🌍 Oriente Médio",
  "Israel": "🌍 Oriente Médio",
  "Singapura": "🌏 Ásia",
  "Hong Kong": "🌏 Ásia",
  "Japão": "🌏 Ásia",
  "Coreia do Sul": "🌏 Ásia",
  "China": "🌏 Ásia",
  "Tailândia": "🌏 Ásia",
  "Malásia": "🌏 Ásia",
  "Índia": "🌏 Ásia",
  "Indonésia": "🌏 Ásia",
  "Taiwan": "🌏 Ásia",
  "Austrália": "🌏 Oceania",
  "Nova Zelândia": "🌏 Oceania",
  "África do Sul": "🌍 África",
  "Egito": "🌍 África",
  "Etiópia": "🌍 África",
  "Quênia": "🌍 África",
  "Marrocos": "🌍 África",
  "Argélia": "🌍 África",
  "Madagascar": "🌍 África",
};

const REGION_DISPLAY_ORDER = [
  "🇧🇷 Brasil",
  "🌎 América do Norte",
  "🌎 América do Sul",
  "🌍 Europa",
  "🌍 Oriente Médio",
  "🌏 Ásia",
  "🌏 Oceania",
  "🌍 África",
];

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.4, staggerChildren: 0.1 },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function AISidebar() {
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const station = useAppStore((s) => s.selectedStation);
  const currentHourOffset = useAppStore((s) => s.timeline.currentHourOffset);
  const favoriteIcaos = useAppStore((s) => s.favoriteIcaos);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setProjectedFlightCategory = useAppStore((s) => s.setProjectedFlightCategory);

  const routeMode = useAppStore((s) => s.routeMode);
  const routeOrigin = useAppStore((s) => s.routeOrigin);
  const routeDestination = useAppStore((s) => s.routeDestination);
  const routeDistanceKm = useAppStore((s) => s.routeDistanceKm);
  const setRouteMode = useAppStore((s) => s.setRouteMode);
  const clearRoute = useAppStore((s) => s.clearRoute);
  const clearStation = useAppStore((s) => s.clearStation);

  const { selectAirport } = useStationSelect();
  const [searchQuery, setSearchQuery] = useState("");

  const airportsByRegion = useMemo(() => {
    const grouped: Record<string, typeof BRAZILIAN_AIRPORTS> = {};
    const q = searchQuery.trim().toLowerCase();
    for (const ap of BRAZILIAN_AIRPORTS) {
      if (q) {
        if (!(
          ap.icao.toLowerCase().includes(q) ||
          (ap.iata?.toLowerCase().includes(q) ?? false) ||
          ap.name.toLowerCase().includes(q) ||
          ap.city.toLowerCase().includes(q) ||
          ap.country.toLowerCase().includes(q)
        )) {
          continue;
        }
      }
      const region = REGION_ORDER[ap.country] ?? "🌐 Outros";
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(ap);
    }
    return grouped;
  }, [searchQuery]);

  const distKmFormatted = routeDistanceKm ? `${Math.round(routeDistanceKm).toLocaleString("pt-BR")} km` : null;
  const distNmFormatted = routeDistanceKm ? `${Math.round(routeDistanceKm / 1.852).toLocaleString("pt-BR")} NM` : null;

  type HourForecast = {
    temperature: number;
    pressure: number;
    wind_degrees: number | null;
    wind_kts: number | null;
    wind_gust_kts: number | null;
    visibility_m: number | null;
  };

  const [forecastMap, setForecastMap] = useState<Record<number, HourForecast> | null>(null);
  const [forecastMapLoading, setForecastMapLoading] = useState(false);
  useEffect(() => {
    if (!station) { setForecastMap(null); return; }
    const { lat, lon } = station.airport;
    const controller = new AbortController();
    setForecastMap(null);
    setForecastMapLoading(true);
    const omUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,pressure_msl,windspeed_10m,winddirection_10m,windgusts_10m,visibility` +
      `&timezone=UTC&forecast_days=3`;
    fetch(omUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
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
        if (baseIdx === -1) return;

        const result: Record<number, HourForecast> = {};
        for (let offset = 0; offset <= 24; offset++) {
          const idx = baseIdx + offset;
          if (idx >= times.length) break;
          result[offset] = {
            temperature: Math.round(temps[idx] * 10) / 10,
            pressure: Math.round(pressures[idx]),
            wind_degrees: winddir[idx] != null ? Math.round(winddir[idx]) : null,
            wind_kts: windspeed[idx] != null ? Math.round(windspeed[idx] / 1.852) : null,
            wind_gust_kts: windgusts[idx] != null ? Math.round(windgusts[idx] / 1.852) : null,
            visibility_m: visibility[idx] != null ? Math.round(visibility[idx]) : null,
          };
        }
        setForecastMap(result);
      })
      .catch(() => { })
      .finally(() => setForecastMapLoading(false));
    return () => { controller.abort(); setForecastMapLoading(false); };
  }, [station?.airport.icao]);

  const forecastExtras = currentHourOffset > 0 ? (forecastMap?.[currentHourOffset] ?? null) : null;

  const tafExpiryStatus = useMemo(() => {
    if (currentHourOffset === 0 || !station?.taf) return null;

    const taf = station.taf;
    const rawValidTo = taf.valid_to ?? (() => {
      let max: string | undefined;
      for (const b of taf.forecast ?? []) {
        const t = b.change?.period?.to;
        if (t && (!max || t > max)) max = t;
      }
      return max;
    })();

    if (!rawValidTo) return null;

    const targetTime = new Date(Date.now() + currentHourOffset * 3600 * 1000);
    const tafEnd = new Date(rawValidTo);
    const diffHours = (tafEnd.getTime() - targetTime.getTime()) / 3_600_000;

    if (diffHours < 0) return "expired";
    if (diffHours < 2) return "expiring";
    return null;
  }, [currentHourOffset, station?.taf]);

  const tafSnapshot = useMemo(
    () => currentHourOffset > 0 && station?.taf ? parseTafAtHour(station.taf, currentHourOffset) : null,
    [currentHourOffset, station?.taf]
  );

  const isForecastLoading = currentHourOffset > 0 && forecastMapLoading && !tafSnapshot;

  const activeFlightCategory = useMemo(() => {
    const metar = station?.metar;
    if (!metar || currentHourOffset === 0) return metar?.flight_category;
    let vis = metar.visibility?.meters;
    let sky = metar.sky_conditions;
    if (tafSnapshot) {
      if (tafSnapshot.visibility) vis = tafSnapshot.visibility.meters;
      if (tafSnapshot.sky_conditions) sky = tafSnapshot.sky_conditions;
    } else if (forecastExtras?.visibility_m != null) {
      vis = forecastExtras.visibility_m;
    }
    const ceilFt = sky
      ?.filter((c) => c.sky_cover === "BKN" || c.sky_cover === "OVC")
      .map((c) => c.base_feet_agl)
      .sort((a, b) => a - b)[0];
    if (vis === undefined && ceilFt === undefined) return metar.flight_category;
    const v = vis ?? Infinity;
    const c = ceilFt ?? Infinity;
    if (v < 1600 || c < 500) return "LIFR" as const;
    if (v < 5000 || c < 1000) return "IFR" as const;
    if (v < 8000 || c < 3000) return "MVFR" as const;
    return "VFR" as const;
  }, [station?.metar, currentHourOffset, tafSnapshot, forecastExtras]);

  useEffect(() => {
    setProjectedFlightCategory(activeFlightCategory);
  }, [activeFlightCategory, setProjectedFlightCategory]);
  const activeMetar = useMemo<MetarData | null>(() => {
    const metar = station?.metar;
    if (currentHourOffset === 0 || !metar) return metar ?? null;
    if (tafSnapshot) {
      return {
        ...metar,
        ...(tafSnapshot.wind && { wind: tafSnapshot.wind }),
        ...(tafSnapshot.visibility && { visibility: tafSnapshot.visibility }),
        ...(tafSnapshot.sky_conditions && {
          sky_conditions: tafSnapshot.sky_conditions,
          ceiling: undefined,
        }),
      } as MetarData;
    }
    const extras: Record<string, unknown> = {};
    if (forecastExtras?.wind_kts != null) {
      extras.wind = {
        degrees: forecastExtras.wind_degrees ?? undefined,
        speed_kts: forecastExtras.wind_kts,
        gust_kts: forecastExtras.wind_gust_kts ?? undefined,
      };
    }
    if (forecastExtras?.visibility_m != null) {
      extras.visibility = { meters: forecastExtras.visibility_m };
    }
    return { ...metar, ...extras } as MetarData;
  }, [currentHourOffset, station?.metar, tafSnapshot, forecastExtras]);

  // =============================================================================
  // Tela de Boas-Vindas
  // =============================================================================

  if (!isSidebarOpen || !station) {
    return (
      <div className="flex h-full flex-col p-4 gap-4 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full bg-indigo-500/5 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute w-12 h-12 rounded-full bg-indigo-500/10" />
            <svg viewBox="0 0 24 24" className="relative w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.25}>
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200 tracking-wide mb-1">Selecione um Aeroporto</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clique em um pin no globo ou use o acesso rápido abaixo.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800" />

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar ICAO, IATA, cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 transition-all font-mono"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase text-center shrink-0">
            {searchQuery.trim() ? "Resultados da Busca" : "Acesso Rápido — Todos os Aeroportos"}
          </p>

          {Object.keys(airportsByRegion).length === 0 && (
            <div className="text-center text-sm text-slate-500 py-4">
              Nenhum aeroporto encontrado.
            </div>
          )}

          {REGION_DISPLAY_ORDER.map((region) => {
            const airports = airportsByRegion[region];
            if (!airports?.length) return null;
            return (
              <div key={region}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-300 tracking-wide">{region}</span>
                  <div className="flex-1 h-[1px] bg-slate-800" />
                  <span className="text-xs text-slate-500">{airports.length}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {airports.map((ap) => {
                    const isFav = favoriteIcaos.includes(ap.icao);
                    return (
                      <button
                        key={ap.icao}
                        onClick={() => selectAirport(ap)}
                        className={`group flex flex-col items-start px-2.5 py-2 rounded-lg border transition-all duration-150 text-left relative ${isFav
                          ? "bg-amber-950/30 border-amber-500/25 hover:bg-amber-900/40 hover:border-amber-500/50"
                          : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/70 hover:border-indigo-500/40"
                          }`}
                      >
                        {isFav && <Star className="absolute top-1.5 right-1.5 w-2 h-2 text-amber-400 fill-amber-400" />}
                        <span className={`font-mono text-xs font-extrabold tracking-widest leading-none ${isFav ? "text-amber-400" : "text-indigo-400 group-hover:text-indigo-300"}`}>
                          {ap.icao}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight mt-1 truncate w-full group-hover:text-slate-400">
                          {ap.city}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =============================================================================
  // Fator Limitante
  // =============================================================================

  function getLimitingFactor(m: MetarData | undefined, cat: string | undefined) {
    if (!m || !cat || cat === "VFR") return null;

    const factors: { icon: "cloud" | "eye"; label: string; value: string; color: string }[] = [];

    const ceilFt = m.ceiling?.feet ??
      m.sky_conditions
        ?.filter((l) => l.sky_cover === "BKN" || l.sky_cover === "OVC")
        .sort((a, b) => a.base_feet_agl - b.base_feet_agl)[0]
        ?.base_feet_agl;

    if (ceilFt !== undefined && ceilFt < 1000) {
      const code = m.ceiling?.code ??
        m.sky_conditions?.find((l) => l.base_feet_agl === ceilFt)?.sky_cover ?? "";
      factors.push({
        icon: "cloud",
        label: "Teto",
        value: `${ceilFt.toLocaleString()} ft${code ? ` (${code})` : ""}`,
        color: ceilFt < 500 ? "#ef4444" : "#f59e0b",
      });
    }

    if (m.visibility) {
      const vis = m.visibility.meters;
      if (vis < 5000) {
        factors.push({
          icon: "eye",
          label: "Visibilidade",
          value: `${vis >= 1000 ? (vis / 1000).toFixed(1) + " km" : vis + " m"}`,
          color: vis < 1600 ? "#ef4444" : "#f59e0b",
        });
      }
    }

    return factors.length > 0 ? factors : null;
  }

  // =============================================================================
  // Auxiliares Visuais
  // =============================================================================

  function skyLabel(cover: string) {
    const map: Record<string, string> = {
      CLR: "Céu Limpo", FEW: "Poucas Nuvens", SCT: "Nuvens Esparsas",
      BKN: "Nublado", OVC: "Encoberto", NSC: "Sem Nuvens Significativas",
    };
    return map[cover] ?? cover;
  }

  function skyColor(cover: string) {
    if (cover === "CLR" || cover === "NSC") return "#34d399";
    if (cover === "FEW") return "#60a5fa";
    if (cover === "SCT") return "#fbbf24";
    if (cover === "BKN") return "#f97316";
    return "#ef4444";
  }

  function visColor(meters: number) {
    if (meters >= 8000) return "#34d399";
    if (meters >= 5000) return "#a3e635";
    if (meters >= 3000) return "#fbbf24";
    if (meters >= 1500) return "#f97316";
    return "#ef4444";
  }

  // =============================================================================
  // Visão do Aeroporto Selecionado
  // =============================================================================

  const isStationFav = favoriteIcaos.includes(station.airport.icao);
  const metar = station.metar;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={station.airport.icao}
        initial="hidden" animate="visible" exit="exit"
        variants={containerVariants}
        className="flex h-full flex-col overflow-y-auto p-6"
      >
        <motion.header variants={itemVariants} className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-100 flex-1">{station.airport.name}</h2>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => toggleFavorite(station.airport.icao)}
                title={isStationFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                className={`p-1.5 rounded-lg border transition-all duration-200 ${isStationFav
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                  : "bg-slate-900/60 border-slate-700 text-slate-500 hover:text-amber-400 hover:border-amber-500/40"
                  }`}
              >
                <Star className={`w-3.5 h-3.5 ${isStationFav ? "fill-amber-400" : ""}`} />
              </button>

              <Badge category={activeFlightCategory} />

              <button
                onClick={clearStation}
                title="Fechar e voltar ao início"
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-500 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span>{station.airport.city}</span>
            <span className="font-mono rounded bg-slate-800 px-1.5 py-0.5 text-emerald-400">
              {station.airport.icao}
            </span>
          </div>


          <div className="mt-4 flex flex-col gap-2">
            {!routeMode && !routeOrigin && (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setRouteMode(true)}
                  className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 font-mono text-[11px] font-bold tracking-widest text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <Route className="w-4 h-4" />
                  <span>TRAÇAR ROTA</span>
                </button>
                <p className="text-center text-[9px] text-slate-500">
                  {station.airport.icao} será a origem — clique em outro aeroporto para definir o destino
                </p>
              </div>
            )}

            {routeMode && (
              <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/40 p-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse" />
                <div className="flex flex-col flex-1 pl-2">
                  <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 animate-bounce" />
                    Selecione o Destino
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    Rota partindo de <span className="text-violet-300 font-bold">{routeOrigin?.icao ?? station.airport.icao}</span> — clique em outro aeroporto
                  </span>
                </div>
                <button
                  onClick={() => setRouteMode(false)}
                  className="flex-shrink-0 p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-rose-500/80 hover:border-rose-500 transition-all"
                  title="Cancelar seleção"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {routeOrigin && routeDestination && !routeMode && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between text-[10px] font-mono bg-slate-900/80 border border-violet-500/30 rounded-xl px-3 py-2 shadow-inner">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-slate-500 uppercase">Origem</span>
                      <span className="font-bold text-violet-300">{routeOrigin.icao}</span>
                      <span className="text-[7px] text-slate-600 truncate max-w-[60px]">{routeOrigin.city}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <Plane className="w-3.5 h-3.5 text-violet-500" />
                      <div className="w-full border-t border-dashed border-slate-700 mt-0.5" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-slate-500 uppercase">Destino</span>
                      <span className="font-bold text-fuchsia-300">{routeDestination.icao}</span>
                      <span className="text-[7px] text-slate-600 truncate max-w-[60px]">{routeDestination.city}</span>
                    </div>
                  </div>
                  <button
                    onClick={clearRoute}
                    title="Cancelar rota"
                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {distKmFormatted && (
                  <div className="rounded-xl bg-slate-900/80 border border-violet-500/20 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Ruler className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-bold tracking-widest text-violet-400 uppercase">Distância da Rota</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-black font-mono text-white tabular-nums">{distKmFormatted}</span>
                      <span className="text-sm font-mono text-slate-500 tabular-nums">{distNmFormatted}</span>
                    </div>
                    <p className="text-[8px] text-slate-600 mt-1 truncate">
                      {routeOrigin.name} → {routeDestination.name}
                    </p>
                  </div>
                )}

                <p className="text-center text-[9px] text-slate-600 flex items-center justify-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  Clique em qualquer aeroporto para atualizar o destino
                </p>
              </div>
            )}

            {routeOrigin && !routeDestination && !routeMode && (
              <button
                onClick={() => setRouteMode(true)}
                className="group flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-violet-300 transition-all hover:bg-violet-500/20 hover:border-violet-500/50"
              >
                <Navigation className="w-3.5 h-3.5" />
                SELECIONAR DESTINO
              </button>
            )}
          </div>
        </motion.header>

        {(station.status === "fetching-metar" || station.status === "processing-ai") && (
          <motion.div variants={itemVariants} className="mb-6 flex flex-col items-center justify-center p-8 text-indigo-400/80">
            <Loader2 className="mb-3 h-8 w-8 animate-spin" />
            <span className="text-xs font-mono tracking-widest uppercase">
              {station.status === "processing-ai" ? "Gerando IA..." : "Buscando Dados..."}
            </span>
          </motion.div>
        )}

        {station.status === "error" && (
          <motion.div variants={itemVariants} className="mb-6 rounded-md border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm text-center shadow-lg">
            {station.error || "Ocorreu um erro inesperado."}
          </motion.div>
        )}

        {tafExpiryStatus && (
          <motion.div
            variants={itemVariants}
            className={`mb-3 rounded-xl border px-4 py-3 flex items-start gap-3 ${tafExpiryStatus === "expired"
              ? "border-rose-500/30 bg-rose-500/10"
              : "border-amber-500/30 bg-amber-500/10"
              }`}
          >
            <AlertTriangle className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${tafExpiryStatus === "expired" ? "text-rose-400" : "text-amber-400"}`} />
            <div>
              <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${tafExpiryStatus === "expired" ? "text-rose-400" : "text-amber-400"}`}>
                {tafExpiryStatus === "expired" ? "TAF Expirado para este Horário" : "TAF Próximo do Limite de Validade"}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tafExpiryStatus === "expired"
                  ? `O TAF não cobre +${currentHourOffset}H. Os dados meteorológicos exibidos refletem a observação atual (METAR) — não há previsão disponível para este horário.`
                  : "O horário selecionado está próximo do fim do TAF. A previsão pode ser menos confiável."}
              </p>
            </div>
          </motion.div>
        )}

        {isForecastLoading && (
          <motion.div variants={itemVariants} className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-indigo-300">Carregando previsão para +{currentHourOffset}H</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Buscando dados do Open-Meteo… Os valores abaixo ainda refletem o METAR atual.</p>
            </div>
          </motion.div>
        )}

        {activeMetar && (
          <div className="grid grid-cols-2 gap-2 mb-3">

            {activeMetar.temperature && (
              <motion.div variants={itemVariants} className="col-span-1 rounded-xl border border-white/5 bg-slate-900/80 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Temperatura</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black font-mono text-white tabular-nums leading-none">
                      {forecastExtras ? Math.round(forecastExtras.temperature) : activeMetar.temperature.celsius}°
                    </span>
                  </div>
                  {activeMetar.dewpoint && !forecastExtras && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-slate-500 uppercase font-bold">Orvalho</span>
                      <span className="text-lg font-black font-mono text-sky-300 leading-none">{activeMetar.dewpoint.celsius}°</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeMetar.wind && (
              <motion.div variants={itemVariants} className="col-span-1 rounded-xl border border-white/5 bg-slate-900/80 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Vento</span>
                  {currentHourOffset > 0 && !station.briefing?.forecast && forecastExtras?.wind_kts != null && (
                    <span className="ml-auto text-[8px] text-sky-600 font-mono">Open-Meteo</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-3xl font-black text-white leading-none tracking-tighter">{activeMetar.wind.degrees != null ? `${String(activeMetar.wind.degrees).padStart(3, "0")}°` : "VRB"}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Direção</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-3xl font-black text-sky-300 leading-none">{activeMetar.wind.speed_kts ?? 0}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">kt</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMetar.visibility && (
              <motion.div variants={itemVariants} className="col-span-1 rounded-xl border border-white/5 bg-slate-900/80 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Visibilidade</span>
                  {currentHourOffset > 0 && !station.briefing?.forecast && forecastExtras?.visibility_m != null && (
                    <span className="ml-auto text-[8px] text-sky-600 font-mono">Open-Meteo</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black font-mono tabular-nums leading-none tracking-tighter" style={{ color: visColor(activeMetar.visibility.meters) }}>
                    {activeMetar.visibility.meters >= 9999 ? "9999+" : activeMetar.visibility.meters}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">{(activeMetar.visibility.meters / 1000).toFixed(1)} km</span>
                </div>
              </motion.div>
            )}

            {(activeMetar.barometer || forecastExtras) && (
              <motion.div variants={itemVariants} className="col-span-1 rounded-xl border border-white/5 bg-slate-900/80 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Pressão Atm.</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black font-mono text-indigo-300 tabular-nums leading-none tracking-tighter">
                    {forecastExtras ? forecastExtras.pressure : Math.round(activeMetar.barometer!.hpa)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">hPa (QNH)</span>
                </div>
              </motion.div>
            )}

            {activeMetar.sky_conditions && activeMetar.sky_conditions.length > 0 && (
              <motion.div variants={itemVariants} className="col-span-2 rounded-xl border border-white/5 bg-slate-900/80 p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Camadas de Nuvem</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {activeMetar.sky_conditions.map((layer, i) => {
                    return (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-1.5 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skyColor(layer.sky_cover), boxShadow: `0 0 6px ${skyColor(layer.sky_cover)}80` }} />
                          <span className="font-mono text-[9px] font-bold" style={{ color: skyColor(layer.sky_cover) }}>{layer.sky_cover}</span>
                          <span className="text-[8px] text-slate-400">{skyLabel(layer.sky_cover)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          {layer.base_feet_agl != null && (
                            <span className="font-mono text-[9px] font-bold text-white">{layer.base_feet_agl.toLocaleString()} ft</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>
        )}

        {activeMetar && (() => {
          const factors = getLimitingFactor(activeMetar as MetarData, activeFlightCategory);
          if (!factors) return null;
          return (
            <motion.div
              variants={itemVariants}
              className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase">
                  Fator{factors.length > 1 ? "es" : ""} Limitante{factors.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {f.icon === "cloud"
                        ? <Cloud className="w-3 h-3" style={{ color: f.color }} />
                        : <Eye className="w-3 h-3" style={{ color: f.color }} />
                      }
                      <span className="text-[9px] text-slate-400">{f.label}</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold" style={{ color: f.color }}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {station.briefing && station.status === "done" && (

          <div className="flex flex-col gap-4">

            {station.briefing.isMock && (
              <motion.div variants={itemVariants}
                className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mt-0.5">
                    <BotOff className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-300 mb-1">Análise de IA indisponível</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      O serviço de inteligência artificial está temporariamente fora do ar. Os alertas abaixo foram gerados automaticamente a partir dos blocos do TAF — pode haver menos detalhes do que o normal.
                    </p>
                    <button
                      onClick={() => selectAirport(station.airport)}
                      className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <AlertList alerts={station.briefing.alerts.filter((a) => {
                if (a.title === "Previsão AI Indisponível") return false;
                const projectedTime = Date.now() + currentHourOffset * 3_600_000;
                const from = a.validFrom ? new Date(a.validFrom).getTime() : -Infinity;
                const to = a.validTo ? new Date(a.validTo).getTime() : Infinity;
                return from <= projectedTime && projectedTime < to;
              })} />
            </motion.div>

            {!station.briefing.isMock && station.briefing.summary && (
              <motion.div variants={itemVariants} className="rounded-xl border border-white/5 bg-slate-900/90 p-4 shadow-xl">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Resumo da IA</h3>
                <p className="selectable-text text-sm leading-relaxed text-slate-200">{station.briefing.summary}</p>
              </motion.div>
            )}

            {!station.briefing.isMock && station.briefing.conditions && (
              <motion.div variants={itemVariants} className="rounded-xl border border-white/5 bg-slate-900/90 p-4 shadow-xl">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Condições Atuais</h3>
                <p className="selectable-text text-sm leading-relaxed text-slate-200">{station.briefing.conditions}</p>
              </motion.div>
            )}

          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
