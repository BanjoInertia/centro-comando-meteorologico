"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { Airport } from "@/types";
import { latLonToVector3 } from "@/lib/three/geoUtils";
import { useStationSelect } from "@/hooks/useStationSelect";

import { Navigation2, X } from "lucide-react";

interface AirportPinProps { airport: Airport; }

function categoryColor(cat?: string): string {
  switch (cat) {
    case "VFR": return "#00d4aa";
    case "MVFR": return "#3b82f6";
    case "IFR": return "#f59e0b";
    case "LIFR": return "#ef4444";
    default: return "#ffffff";
  }
}

function getLimitingReason(metar: import("@/types").MetarData | undefined, cat: string | undefined): string | null {
  if (!metar || !cat || cat === "VFR") return null;

  const parts: string[] = [];

  const ceilFt = metar.ceiling?.feet ??
    metar.sky_conditions
      ?.filter((l) => l.sky_cover === "BKN" || l.sky_cover === "OVC")
      .sort((a, b) => a.base_feet_agl - b.base_feet_agl)[0]
      ?.base_feet_agl;

  if (ceilFt !== undefined && ceilFt < 1000) {
    const code = metar.ceiling?.code ?? "";
    parts.push(`teto ${ceilFt.toLocaleString()} ft${code ? ` (${code})` : ""}`);
  }

  if (metar.visibility && metar.visibility.meters < 5000) {
    const vis = metar.visibility.meters;
    parts.push(`vis ${vis >= 1000 ? (vis / 1000).toFixed(1) + " km" : vis + " m"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function AirportPin({ airport }: AirportPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh>(null!);

  const { selectAirport } = useStationSelect();
  const focusedAirport = useAppStore((s) => s.focusedAirport);
  const selectedStation = useAppStore((s) => s.selectedStation);
  const currentHourOffset = useAppStore((s) => s.timeline.currentHourOffset);
  const routeMode = useAppStore((s) => s.routeMode);
  const routeOrigin = useAppStore((s) => s.routeOrigin);
  const setRouteDestination = useAppStore((s) => s.setRouteDestination);
  const clearStation = useAppStore((s) => s.clearStation);
  const flightCategories = useAppStore((s) => s.flightCategories);
  const projectedFlightCategory = useAppStore((s) => s.projectedFlightCategory);

  const isSelected = focusedAirport?.icao === airport.icao;

  const activeMetar = isSelected ? selectedStation?.metar : null;

  let flightCat = flightCategories[airport.icao];
  if (isSelected && currentHourOffset > 0 && projectedFlightCategory) {
    flightCat = projectedFlightCategory;
  }

  const dotColor = categoryColor(flightCat);
  const hasCat = !!flightCat;

  const position = useMemo(() => latLonToVector3(airport.lat, airport.lon, 1.003), [airport.lat, airport.lon]);
  const normal = useMemo(() => position.clone().normalize(), [position]);

  const { localTime, zuluTime, offsetStr } = useMemo(() => {
    const now = new Date();
    const totalMin = now.getUTCHours() * 60 + now.getUTCMinutes() + currentHourOffset * 60 + airport.timezoneOffset * 60;
    let lH = Math.floor(totalMin / 60) % 24; if (lH < 0) lH += 24;
    const lM = Math.floor(Math.abs(totalMin) % 60);
    const totalZuluMin = now.getUTCHours() * 60 + now.getUTCMinutes() + currentHourOffset * 60;
    let zH = Math.floor(totalZuluMin / 60) % 24; if (zH < 0) zH += 24;
    const zM = Math.floor(Math.abs(totalZuluMin) % 60);
    return {
      localTime: `${String(lH).padStart(2, "0")}:${String(lM).padStart(2, "0")}`,
      zuluTime: `${String(zH).padStart(2, "0")}:${String(zM).padStart(2, "0")}`,
      offsetStr: `UTC${airport.timezoneOffset >= 0 ? "+" : ""}${airport.timezoneOffset}`,
    };
  }, [currentHourOffset, airport.timezoneOffset]);

  const lastVisible = useRef<boolean | null>(null);
  const lastOpaque = useRef<boolean | null>(null);

  useFrame(({ camera, clock }) => {
    const dot = camera.position.clone().sub(position).normalize().dot(normal);
    const visible = dot > -0.1;
    const opaque = dot > -0.02;

    if (wrapperRef.current && lastOpaque.current !== opaque) {
      wrapperRef.current.style.opacity = opaque ? "1" : "0";
      wrapperRef.current.style.pointerEvents = opaque ? "auto" : "none";
      lastOpaque.current = opaque;
    }
    if (meshRef.current) {
      if (lastVisible.current !== visible) {
        meshRef.current.visible = visible;
        lastVisible.current = visible;
      }
      if (isSelected) {
        meshRef.current.scale.setScalar(1 + 0.25 * Math.sin(clock.elapsedTime * 4));
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const isOrigin = routeOrigin?.icao === airport.icao;
    if (routeOrigin && !isOrigin) {
      setRouteDestination(airport);
      selectAirport(airport);
    } else if (routeMode && !isOrigin) {
      setRouteDestination(airport);
    } else {
      selectAirport(airport);
    }
  };

  const labelBg = isSelected ? "rgba(5,11,20,0.92)" : "rgba(5,11,20,0.80)";
  const labelBorder = isSelected ? `${dotColor}70` : hasCat ? `${dotColor}45` : "rgba(255,255,255,0.18)";

  return (
    <>
      <mesh ref={meshRef} position={position} onClick={handleClick}>
        <sphereGeometry args={[isSelected ? 0.008 : 0.005, 8, 8]} />
        <meshBasicMaterial color={dotColor} />
      </mesh>

      <Html position={position} zIndexRange={isSelected ? [1000, 900] : [100, 0]}>
        <div ref={wrapperRef} style={{ transition: "opacity 0.2s" }}>

          {isSelected && (
            <div
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none min-w-[155px]"
              style={{ color: dotColor }}
            >
              <div
                className="rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md w-full shadow-2xl min-w-[200px] pointer-events-auto"
                style={{ background: "rgba(5,11,20,0.95)", border: `1px solid ${dotColor}40`, boxShadow: `0 0 20px ${dotColor}20` }}
              >
                <div className="flex flex-col items-center pb-2 border-b border-white/10 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); clearStation(); }}
                    className="absolute -top-1 -right-1 p-1.5 rounded-lg transition-colors text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Fechar foco"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold tracking-widest uppercase font-mono mb-1" style={{ color: dotColor }}>HORA LOCAL</span>
                  <span className="text-4xl font-mono font-black text-white tracking-wider tabular-nums leading-none mb-1">{localTime}</span>
                  <div className="flex justify-between w-full px-1 mt-1 text-[10px] font-mono font-semibold text-slate-400">
                    <span>ZULU {zuluTime}</span>
                    <span>FUSO {offsetStr}</span>
                  </div>
                </div>

                {(activeMetar?.wind || activeMetar?.barometer) && (
                  <div className="flex gap-2 pt-1">
                    {activeMetar?.wind && (
                      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg py-2 px-1 border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1.5">VENTO</span>
                        <div className="flex items-center gap-1.5">
                          <Navigation2 className="w-5 h-5 flex-shrink-0" style={{ color: dotColor, transform: `rotate(${activeMetar.wind.degrees ?? 0}deg)` }} />
                          <div className="flex flex-col leading-tight items-start">
                            <span className="font-mono text-xs font-bold" style={{ color: dotColor }}>
                              {activeMetar.wind.degrees != null ? `${String(activeMetar.wind.degrees).padStart(3, "0")}°` : "VRB"}
                            </span>
                            <span className="font-mono text-xs text-white font-bold whitespace-nowrap">
                              {activeMetar.wind.speed_kts ?? 0}kt
                              {activeMetar.wind.gust_kts && <span className="text-amber-400"> G{activeMetar.wind.gust_kts}</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeMetar?.barometer && (
                      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg py-2 px-1 border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">PRESSÃO</span>
                        <span className="font-mono text-xl text-white font-black leading-none mb-0.5">{Math.round(activeMetar.barometer.hpa)}</span>
                        <span className="text-[9px] text-slate-400 font-mono leading-none">hPa</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="w-[1px] h-2 opacity-50" style={{ background: dotColor }} />

            </div>
          )}

          <div
            className="flex items-center cursor-pointer select-none"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span
              className="font-mono font-extrabold tracking-widest rounded px-1.5 py-0.5 shadow-lg border transition-all duration-200"
              style={{
                background: labelBg,
                border: `1px solid ${labelBorder}`,
                color: hasCat ? dotColor : "#ffffff",
                fontSize: isSelected ? "11px" : "10px",
                textShadow: "0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9)",
              }}
            >
              {airport.icao}
            </span>
          </div>

          {isHovered && !isSelected && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none z-50">
              <div
                className="bg-[#05080f]/98 rounded-xl py-2 px-3 shadow-2xl flex flex-col gap-0.5 min-w-[150px] backdrop-blur-md"
                style={{ border: `1px solid ${hasCat ? dotColor + "40" : "rgba(255,255,255,0.15)"}` }}
              >
                <p className="text-[11px] font-bold text-white tracking-wide">{airport.name}</p>
                <p className="text-[8px] text-slate-400 uppercase tracking-widest">{airport.city} · {airport.country}</p>
                {flightCat && (
                  <div
                    className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1"
                    style={{ background: `${dotColor}15`, border: `1px solid ${dotColor}30` }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                    <span className="font-mono text-[10px] font-bold" style={{ color: dotColor }}>{flightCat}</span>
                    <span className="text-[8px] text-slate-400">
                      {flightCat === "VFR" && "Condições visuais"}
                      {flightCat === "MVFR" && "VFR marginal"}
                      {flightCat === "IFR" && "Voo por instrumentos"}
                      {flightCat === "LIFR" && "IFR baixo"}
                    </span>
                  </div>
                )}
                <div className="mt-1 pt-1 border-t border-white/10 flex justify-between text-[9px] font-mono">
                  <span className="text-emerald-400 font-semibold">{localTime}</span>
                  <span className="text-slate-500">{offsetStr}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Html>
    </>
  );
}
