"use client";

import { useAppStore } from "@/store/useAppStore";
import GlobeScene from "@/components/globe/GlobeScene";
import AISidebar from "@/components/sidebar/AISidebar";
import Timeline from "@/components/timeline/Timeline";
import DashboardHeader from "@/components/ui/DashboardHeader";
import FlightCategoryLegend from "@/components/globe/FlightCategoryLegend";
import ThermalLegend from "@/components/globe/ThermalLegend";
import HwAccelNotice from "@/components/ui/HwAccelNotice";
import { useFlightCategories } from "@/hooks/useFlightCategories";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const isGlobeFullscreen = useAppStore((state) => state.isGlobeFullscreen);
  const selectedStation = useAppStore((state) => state.selectedStation);

  useFlightCategories();

  return (
    <div className="h-full relative overflow-hidden bg-[#050b14]">

      <div
        className="absolute inset-0 bg-[#050b14] will-change-transform"
        style={{
          transform: isGlobeFullscreen ? "translateX(0)" : "translateX(-190px)",
          transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <GlobeScene />
      </div>

      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          right: isGlobeFullscreen ? 0 : 380,
          bottom: selectedStation ? 64 : 0,
          transition: "right 500ms cubic-bezier(0.4, 0, 0.2, 1), bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="relative w-full h-full">
          <DashboardHeader />
          <FlightCategoryLegend />
          <ThermalLegend />

          <div className="absolute bottom-4 right-4 z-[9999] pointer-events-auto select-none">
            <div className="flex flex-col gap-1.5 items-end">
              <HwAccelNotice />
              <div className="pointer-events-none flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 20 28" className="w-3.5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="1" y="1" width="18" height="26" rx="9" />
                    <line x1="10" y1="1" x2="10" y2="13" />
                    <path d="M1 10 Q1 1 10 1 L10 13 Q5 13 1 10z" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-slate-400 tracking-wide">Selecionar aeroporto</span>
              </div>

              <div className="pointer-events-none flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 20 28" className="w-3.5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="1" y="1" width="18" height="26" rx="9" />
                    <line x1="10" y1="1" x2="10" y2="13" />
                    <path d="M10 1 Q19 1 19 10 L10 13z" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tracking-wide">Tirar foco / voltar</span>
              </div>

              <div className="pointer-events-none flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 20 28" className="w-3.5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="1" y="1" width="18" height="26" rx="9" />
                    <rect x="8.5" y="5" width="3" height="7" rx="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-slate-600 tracking-wide">Zoom in / out</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedStation && (
          <motion.footer
            id="timeline-bar"
            className="absolute bottom-0 left-0 h-16 z-10"
            style={{ right: isGlobeFullscreen ? 0 : 380 }}
            initial={{ y: 64 }}
            animate={{ y: 0 }}
            exit={{ y: 64 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Timeline />
          </motion.footer>
        )}
      </AnimatePresence>

      <aside
        id="ai-sidebar"
        className={`absolute top-0 right-0 h-full w-[380px] border-l border-slate-800 bg-[#080f1a] z-20 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${isGlobeFullscreen ? "translate-x-full" : "translate-x-0"
          }`}
      >
        <div className="w-full h-full overflow-hidden flex flex-col">
          <AISidebar />
        </div>
      </aside>
    </div>
  );
}
