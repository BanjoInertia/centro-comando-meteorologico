"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const CATEGORIES = [
  {
    label: "VFR",
    dotClass: "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]",
    textClass: "text-emerald-400",
    desc: "Regras de Voo Visual",
    sub: "Vis. > 5km · Cobertura < BKN abaixo de 3.000ft",
  },
  {
    label: "MVFR",
    dotClass: "bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,0.5)]",
    textClass: "text-blue-400",
    desc: "VFR Marginal",
    sub: "Vis. 3–5km · Cobertura BKN/OVC 1.000–3.000ft",
  },
  {
    label: "IFR",
    dotClass: "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]",
    textClass: "text-amber-400",
    desc: "Regras de Voo por Instrumentos",
    sub: "Vis. 800m–3km · Cobertura BKN/OVC 500–1.000ft",
  },
  {
    label: "LIFR",
    dotClass: "bg-rose-500 shadow-[0_0_6px_2px_rgba(244,63,94,0.5)]",
    textClass: "text-rose-500",
    desc: "IFR Baixo",
    sub: "Vis. < 800m · Teto abaixo de 500ft",
  },
];

export default function FlightCategoryLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto select-none">
      <div className="bg-slate-950/85 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">

        {/* Header */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 px-3 py-2.5 w-full hover:bg-slate-900/50 transition-colors duration-200"
        >
          {/* Pontos coloridos compactos */}
          <div className="flex gap-1.5 items-center">
            {CATEGORIES.map((c) => (
              <span key={c.label} className={`inline-flex w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
            ))}
          </div>
          <span className="font-mono text-[11px] font-bold tracking-widest text-slate-300 uppercase">
            Categoria de Voo
          </span>
          {isExpanded
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            : <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
          }
        </button>

        {/* Detalhes */}
        {isExpanded && (
          <div className="border-t border-slate-800 px-3 pb-3.5 pt-2.5 flex flex-col gap-2.5 min-w-[240px]">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex w-3 h-3 rounded-full flex-shrink-0 ${c.dotClass}`} />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono text-[12px] font-extrabold ${c.textClass}`}>{c.label}</span>
                    <span className="text-[11px] text-slate-300 font-medium">{c.desc}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono leading-tight">{c.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
