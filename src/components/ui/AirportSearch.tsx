"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Star, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAZILIAN_AIRPORTS } from "@/data/airports";
import { useStationSelect } from "@/hooks/useStationSelect";
import { useAppStore } from "@/store/useAppStore";
import { Airport } from "@/types";

export default function AirportSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectAirport } = useStationSelect();
  const favoriteIcaos = useAppStore((s) => s.favoriteIcaos);

  const results: Airport[] = query.trim().length < 1
    ? []
    : BRAZILIAN_AIRPORTS.filter((ap) => {
      const q = query.toLowerCase();
      return (
        ap.icao.toLowerCase().includes(q) ||
        (ap.iata?.toLowerCase().includes(q) ?? false) ||
        ap.name.toLowerCase().includes(q) ||
        ap.city.toLowerCase().includes(q) ||
        ap.country.toLowerCase().includes(q)
      );
    }).slice(0, 8);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setHighlighted(0); }, [results.length]);

  const handleSelect = useCallback((airport: Airport) => {
    selectAirport(airport);
    setOpen(false);
    setQuery("");
  }, [selectAirport]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); handleSelect(results[highlighted]); }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Botão de ativação */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all duration-200 backdrop-blur-md shadow-2xl text-xs font-mono"
        title="Buscar aeroporto (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[10px] tracking-wider">BUSCAR</span>
        <kbd className="hidden sm:inline text-[8px] bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-500">⌘K</kbd>
      </button>

      {/* Painel de busca */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-[340px] z-[9999] bg-[#080f1a]/98 border border-slate-700/80 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800">
              <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ICAO, IATA, cidade ou nome..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 outline-none font-mono tracking-wide"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-slate-600 hover:text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Resultados */}
            {results.length > 0 ? (
              <ul className="max-h-[300px] overflow-y-auto py-1">
                {results.map((ap, i) => (
                  <li key={ap.icao}>
                    <button
                      onClick={() => handleSelect(ap)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-100 text-left ${i === highlighted ? "bg-indigo-500/10 border-l-2 border-indigo-500" : "border-l-2 border-transparent hover:bg-slate-800/50"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-10">
                        <span className="font-mono text-[11px] font-extrabold text-indigo-400 tracking-widest">{ap.icao}</span>
                        {ap.iata && <span className="font-mono text-[9px] text-slate-500">{ap.iata}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-200 truncate">{ap.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{ap.city} · {ap.country}</p>
                      </div>
                      {favoriteIcaos.includes(ap.icao) && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length > 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                <MapPin className="w-5 h-5 mb-2" />
                <span className="text-xs">Nenhum aeroporto encontrado</span>
              </div>
            ) : (
              <div className="px-3 py-3">
                <p className="text-[9px] font-bold tracking-widest text-slate-600 uppercase mb-2">Sugestões</p>
                <div className="flex flex-wrap gap-1.5">
                  {["SBGR", "EGLL", "KJFK", "OMDB", "WSSS", "YSSY"].map((icao) => {
                    const ap = BRAZILIAN_AIRPORTS.find((a) => a.icao === icao);
                    if (!ap) return null;
                    return (
                      <button
                        key={icao}
                        onClick={() => handleSelect(ap)}
                        className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 hover:bg-indigo-500/20 transition-colors"
                      >
                        {icao}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer com dica de teclado */}
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-slate-800/60 bg-slate-950/50">
              <span className="text-[8px] text-slate-700 flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-700 rounded px-1">↑↓</kbd> navegar
              </span>
              <span className="text-[8px] text-slate-700 flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-700 rounded px-1">Enter</kbd> selecionar
              </span>
              <span className="text-[8px] text-slate-700 flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-700 rounded px-1">Esc</kbd> fechar
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
