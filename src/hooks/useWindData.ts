"use client";


import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export function useWindData() {
  const setWindLayer = useAppStore((s) => s.setWindLayer);
  const showWindLayer = useAppStore((s) => s.showWindLayer);
  const windLayer = useAppStore((s) => s.windLayer);

  useEffect(() => {
    async function fetchWind() {
      try {
        const res = await fetch("/api/wind");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.data) {
          setWindLayer(json.data);
        }
      } catch (err) {
        console.warn("[useWindData] Falha ao buscar dados de vento:", err.message || err);
      }
    }

    if (showWindLayer && !windLayer) {
      fetchWind();
    }

    if (!showWindLayer) return;

    const interval = setInterval(fetchWind, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [showWindLayer, windLayer, setWindLayer]);
}
