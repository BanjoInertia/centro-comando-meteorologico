import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BRAZILIAN_AIRPORTS } from "@/data/airports";

const METAR_REFRESH_MS = 30 * 60 * 1000;
const SLIDER_DEBOUNCE_MS = 800;
const ALL_ICAOS = BRAZILIAN_AIRPORTS.map((ap) => ap.icao).join(",");

const ENABLE_INDIVIDUAL_PREFETCH = false;
const PREFETCH_DELAY_MS = 1100;

function computeCatFromMetar(metar: any): string | null {
  if (!metar) return null;
  const vis: number | undefined = metar.visibility?.meters;
  const ceilFt: number | undefined =
    metar.ceiling?.feet ??
    metar.sky_conditions
      ?.filter((c: any) => c.sky_cover === "BKN" || c.sky_cover === "OVC")
      .map((c: any) => c.base_feet_agl as number)
      .sort((a: number, b: number) => a - b)[0];

  if (vis === undefined && ceilFt === undefined) return metar.flight_category ?? null;

  const v = vis ?? Infinity;
  const c = ceilFt ?? Infinity;
  if (v < 1600 || c < 500) return "LIFR";
  if (v < 5000 || c < 1000) return "IFR";
  if (v < 8000 || c < 3000) return "MVFR";
  return "VFR";
}

export function useFlightCategories() {
  const setFlightCategories = useAppStore((s) => s.setFlightCategories);
  const setTrustedFlightCategory = useAppStore((s) => s.setTrustedFlightCategory);
  const currentHourOffset = useAppStore((s) => s.timeline.currentHourOffset);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPrefetchQueue(cancelled: { v: boolean }) {
    if (!ENABLE_INDIVIDUAL_PREFETCH) return;

    const trusted = new Set(useAppStore.getState().trustedIcaos);
    const queue = BRAZILIAN_AIRPORTS
      .filter((ap) => !trusted.has(ap.icao))
      .map((ap) => ap.icao);

    useAppStore.getState().setMetarSyncTotal(queue.length);

    let idx = 0;

    function next() {
      if (cancelled.v || idx >= queue.length) return;
      const icao = queue[idx++];

      fetch(`/api/metar?icao=${icao}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled.v || !json?.data) return;
          const cat = computeCatFromMetar(json.data);
          if (cat) setTrustedFlightCategory(icao, cat);
        })
        .catch(() => { })
        .finally(() => {
          if (!cancelled.v) {
            prefetchRef.current = setTimeout(next, PREFETCH_DELAY_MS);
          }
        });
    }

    next();
  }

  async function fetchCurrentCategories(cancelled: { v: boolean }) {
    try {
      const res = await fetch(`/api/flight-categories?icaos=${ALL_ICAOS}`);
      if (!res.ok || cancelled.v) return;
      const json = await res.json();
      if (!cancelled.v && json.data) {
        setFlightCategories(json.data);
      }
      startPrefetchQueue(cancelled);
    } catch (err: unknown) {
      if (!cancelled.v) console.warn("[useFlightCategories] batch erro:", err);
    }
  }

  async function fetchFutureCategories(offset: number, cancelled: { v: boolean }) {
    try {
      const res = await fetch(`/api/future-categories?icaos=${ALL_ICAOS}&hourOffset=${offset}`);
      if (!res.ok || cancelled.v) return;
      const json = await res.json();
      if (!cancelled.v && json.data) {
        setFlightCategories(json.data);
      }
    } catch (err: unknown) {
      if (!cancelled.v) console.warn("[useFlightCategories] TAF erro:", err);
    }
  }

  useEffect(() => {
    const cancelled = { v: false };

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (prefetchRef.current) clearTimeout(prefetchRef.current);
    intervalRef.current = debounceRef.current = prefetchRef.current = null;

    if (currentHourOffset === 0) {
      fetchCurrentCategories(cancelled);
      intervalRef.current = setInterval(() => {
        if (prefetchRef.current) clearTimeout(prefetchRef.current);
        prefetchRef.current = null;
        fetchCurrentCategories(cancelled);
      }, METAR_REFRESH_MS);
    } else {
      debounceRef.current = setTimeout(() => {
        fetchFutureCategories(currentHourOffset, cancelled);
      }, SLIDER_DEBOUNCE_MS);
    }

    return () => {
      cancelled.v = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (prefetchRef.current) clearTimeout(prefetchRef.current);
    };
  }, [currentHourOffset]);
}
