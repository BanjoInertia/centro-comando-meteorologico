"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Radio, Globe, Grid, Flame, Maximize2, Minimize2, Wind } from "lucide-react";


export default function DashboardHeader() {
  const currentHourOffset = useAppStore((state) => state.timeline.currentHourOffset);
  const selectedStation = useAppStore((state) => state.selectedStation);
  const globeStyle = useAppStore((state) => state.globeStyle);
  const setGlobeStyle = useAppStore((state) => state.setGlobeStyle);
  const isGlobeFullscreen = useAppStore((state) => state.isGlobeFullscreen);
  const setGlobeFullscreen = useAppStore((state) => state.setGlobeFullscreen);
  const showWindLayer = useAppStore((state) => state.showWindLayer);
  const toggleWindLayer = useAppStore((state) => state.toggleWindLayer);
  const windLayer = useAppStore((state) => state.windLayer);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Função auxiliar para calcular e formatar a hora simulada
  const getSimulatedTime = (utcOffset: number) => {
    const utcHours = currentTime.getUTCHours();
    const utcMinutes = currentTime.getUTCMinutes();

    const totalMinutes = utcHours * 60 + utcMinutes + currentHourOffset * 60 + utcOffset * 60;

    let hours = Math.floor(totalMinutes / 60) % 24;
    if (hours < 0) hours += 24;
    const minutes = Math.floor(Math.abs(totalMinutes) % 60);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const zuluTime = getSimulatedTime(0);
  const brasiliaTime = getSimulatedTime(-3);
  const manausTime = getSimulatedTime(-4);

  const isProjecting = currentHourOffset > 0;

  return (
    <div className="absolute top-4 left-4 right-4 z-[9999] flex flex-wrap gap-2 items-center justify-between pointer-events-none select-none">
      {/* Lado Esquerdo: Logotipo e Conexão */}
      <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md pointer-events-auto">
        <div className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xs font-black tracking-widest text-slate-100 flex items-center gap-1.5 font-mono">
            <span>AERO WEATHER</span>
            <span className="text-[9px] font-medium text-indigo-400 font-sans px-1 rounded bg-indigo-500/10 border border-indigo-500/20">CMD</span>
          </h1>
          <span className="text-[8px] text-slate-400 font-mono tracking-wider">
            {selectedStation ? `FOCUS: ${selectedStation.airport.icao}` : "SELECIONE UMA ESTAÇÃO"}
          </span>
        </div>
      </div>

      {/* Centro-Esquerdo: Seletor de Camadas (HUD Filters) */}
      <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-1 shadow-2xl backdrop-blur-md pointer-events-auto">
        <button
          onClick={() => setGlobeStyle("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer border ${globeStyle === "satellite"
            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          title="Visão de Satélite Fotorrealista"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>SATÉLITE</span>
        </button>

        <button
          onClick={() => setGlobeStyle("vector")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer border ${globeStyle === "vector"
            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          title="Modo Holograma Cibernético"
        >
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span>HOLOGRAMA</span>
        </button>

        <button
          onClick={() => setGlobeStyle("thermal")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer border ${globeStyle === "thermal"
            ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          title="Filtro Térmico de Clima"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>TÉRMICO</span>
        </button>

        {/* Separador */}
        <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

        {/* Toggle de Vento */}
        <button
          onClick={toggleWindLayer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer border relative ${showWindLayer
            ? "bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          title="Overlay de Ventos Globais (Open-Meteo)"
        >
          <Wind className={`w-3.5 h-3.5 ${showWindLayer ? "text-sky-400 animate-pulse" : "text-slate-500"}`} />
          <span>VENTO</span>
          {/* Indicador de loading quando ativado mas sem dados */}
          {showWindLayer && !windLayer && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          )}
        </button>

      </div>

      {/* Centro: Painel de Relógios */}
      <div className="flex items-center gap-6 bg-slate-950/90 border border-slate-800 rounded-xl px-5 py-2 shadow-2xl backdrop-blur-md pointer-events-auto">
        {/* ZULU */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] font-bold tracking-widest text-indigo-400 font-mono">ZULU (UTC)</span>
          <span className="text-sm font-mono font-extrabold text-indigo-200 tracking-wider tabular-nums">
            {zuluTime}
          </span>
        </div>

        {/* Separador */}
        <div className="w-[1px] h-6 bg-slate-800" />

        {/* BRASÍLIA */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] font-bold tracking-widest text-emerald-400 font-mono">BRASÍLIA (BRT)</span>
          <span className="text-sm font-mono font-extrabold text-slate-100 tracking-wider tabular-nums">
            {brasiliaTime}
          </span>
        </div>

        {selectedStation && (
          <>
            {/* Separador */}
            <div className="w-[1px] h-6 bg-slate-800" />

            {/* STATION */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-bold tracking-widest text-amber-400 font-mono">LOCAL ({selectedStation.airport.icao})</span>
              <span className="text-sm font-mono font-extrabold text-amber-100 tracking-wider tabular-nums">
                {getSimulatedTime(selectedStation.airport.timezoneOffset)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Lado Direito: Estado de Projeção + Tela Cheia */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2.5 border rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md pointer-events-auto transition-colors duration-300 ${isProjecting
          ? "bg-amber-950/80 border-amber-500/40 text-amber-300"
          : "bg-slate-950/85 border-slate-800 text-slate-300"
          }`}>
          <Radio className={`w-3.5 h-3.5 ${isProjecting ? "animate-pulse" : ""}`} />
          <div className="flex flex-col text-right font-mono">
            <span className="text-[8px] font-bold tracking-widest uppercase">
              {isProjecting ? "PROJEÇÃO DE PREVISÃO" : "MONITORAMENTO REAL"}
            </span>
            <span className="text-[9px] font-extrabold">
              {isProjecting ? `+${currentHourOffset} HORAS A FRENTE` : "TEMPO REAL (UTC)"}
            </span>
          </div>
        </div>

        {/* Botão de Tela Cheia */}
        <button
          onClick={() => setGlobeFullscreen(!isGlobeFullscreen)}
          title={isGlobeFullscreen ? "Sair da tela cheia" : "Expandir globo"}
          className="flex items-center justify-center w-9 h-9 bg-slate-950/85 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 text-slate-400 hover:text-slate-100"
        >
          {isGlobeFullscreen
            ? <Minimize2 className="w-4 h-4" />
            : <Maximize2 className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}
