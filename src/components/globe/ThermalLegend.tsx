"use client";

import { useAppStore } from "@/store/useAppStore";

export default function ThermalLegend() {
  const globeStyle = useAppStore((state) => state.globeStyle);

  if (globeStyle !== "thermal") return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5 min-w-[320px]">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[9px] font-bold tracking-widest text-slate-400 uppercase">
            Temperatura a 2m do Solo
          </span>
        </div>

        <div
          className="w-full h-2.5 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] border border-slate-800/50"
          style={{
            background: "linear-gradient(to right, #1f0040, #004cd9, #00cc59, #e6cc00, #e62600)"
          }}
        />

        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-300">
          <span className="text-[#1f0040] brightness-150">-30°C</span>
          <span className="text-[#004cd9] brightness-125">-12°C</span>
          <span className="text-[#00cc59]">5°C</span>
          <span className="text-[#e6cc00]">22°C</span>
          <span className="text-[#e62600]">40°C</span>
        </div>
      </div>
    </div>
  );
}
