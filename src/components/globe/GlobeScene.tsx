"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import GlobeMesh from "./GlobeMesh";
import Atmosphere from "./Atmosphere";
import Clouds from "./Clouds";
import AirportPin from "./AirportPin";
import CameraController from "./CameraController";
import ScanningEffect from "./ScanningEffect";
import RouteArc from "./RouteArc";
import WindParticles from "./WindParticles";
import { BRAZILIAN_AIRPORTS } from "@/data/airports";
import { useAppStore } from "@/store/useAppStore";
import { latLonToVector3, flightCategoryToColor } from "@/lib/three/geoUtils";
import { useWindData } from "@/hooks/useWindData";

export default function GlobeScene() {
  const focusedAirport    = useAppStore((s) => s.focusedAirport);
  const selectedStation   = useAppStore((s) => s.selectedStation);
  const currentHourOffset = useAppStore((s) => s.timeline.currentHourOffset);
  const routeOrigin       = useAppStore((s) => s.routeOrigin);
  const routeDestination  = useAppStore((s) => s.routeDestination);
  const clearStation      = useAppStore((s) => s.clearStation);
  const flightCategories  = useAppStore((s) => s.flightCategories);

  useWindData();

  const sunPosition = useMemo(() => {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    const simulatedUtcHours = (utcHours + currentHourOffset) % 24;
    return latLonToVector3(0, -15 * (simulatedUtcHours - 12), 15);
  }, [currentHourOffset]);

  const scanningColor = useMemo(() => {
    if (!focusedAirport) return undefined;
    let cat = flightCategories[focusedAirport.icao];
    if (selectedStation?.airport.icao === focusedAirport.icao) {
      if (currentHourOffset === 0) {
        cat = selectedStation.metar?.flight_category || cat;
      } else {
        cat = selectedStation.briefing?.flightCategory || selectedStation.metar?.flight_category || cat;
      }
    }
    return flightCategoryToColor(cat as any);
  }, [focusedAirport, flightCategories, selectedStation, currentHourOffset]);

  return (
    <Canvas
      camera={{ fov: 60, position: [0, 0, 2.8] }}
      gl={{ antialias: true }}
      style={{ background: "#050b14" }}
      onContextMenu={(e) => { e.preventDefault(); clearStation(); }}
    >
      <ambientLight intensity={25} color="#0d1b2a" />
      <directionalLight position={sunPosition} intensity={4} color="#fffdf0" />

      <OrbitControls
        enablePan={false}
        enableRotate={!focusedAirport}
        enableZoom={!focusedAirport}
        minDistance={1.5}
        maxDistance={4}
        autoRotate={!focusedAirport}
        autoRotateSpeed={0.4}
      />

      <CameraController />

      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <GlobeMesh />
        <Clouds />
        <Atmosphere />

        {focusedAirport && (
          <ScanningEffect
            position={latLonToVector3(focusedAirport.lat, focusedAirport.lon, 1.003)}
            color={scanningColor}
          />
        )}

        <WindParticles />

        {routeOrigin && routeDestination && (
          <RouteArc origin={routeOrigin} destination={routeDestination} />
        )}

        {BRAZILIAN_AIRPORTS.map((airport) => (
          <AirportPin key={airport.icao} airport={airport} />
        ))}
      </Suspense>
    </Canvas>
  );
}
