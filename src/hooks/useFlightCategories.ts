import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BRAZILIAN_AIRPORTS } from "@/data/airports";

const METAR_REFRESH_MS = 30 * 60 * 1000;
const SLIDER_DEBOUNCE_MS = 800;
const ALL_ICAOS = BRAZILIAN_AIRPORTS.map((ap) => ap.icao).join(",");

export function useFlightCategories() {
  const replaceFlightCategories = useAppStore((s) => s.replaceFlightCategories);
  const currentHourOffset       = useAppStore((s) => s.timeline.currentHourOffset);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCurrentCategories(cancelled: { v: boolean }) {
    try {
      const res = await fetch(`/api/flight-categories?icaos=${ALL_ICAOS}`);
      if (!res.ok || cancelled.v) return;
      const json = await res.json();
      if (!cancelled.v && json.data && typeof json.data === "object") {
        replaceFlightCategories(json.data);
      }
    } catch (err: unknown) {
      if (!cancelled.v) console.warn("[useFlightCategories] METAR erro:", err);
    }
  }

  async function fetchFutureCategories(offset: number, cancelled: { v: boolean }) {
    try {
      const res = await fetch(
        `/api/future-categories?icaos=${ALL_ICAOS}&hourOffset=${offset}`
      );
      if (!res.ok || cancelled.v) return;
      const json = await res.json();
      if (!cancelled.v && json.data && typeof json.data === "object") {
        replaceFlightCategories(json.data);
      }
    } catch (err: unknown) {
      if (!cancelled.v) console.warn("[useFlightCategories] TAF erro:", err);
    }
  }

  useEffect(() => {
    const cancelled = { v: false };

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (currentHourOffset === 0) {
      fetchCurrentCategories(cancelled);
      intervalRef.current = setInterval(
        () => fetchCurrentCategories(cancelled),
        METAR_REFRESH_MS
      );
    } else {
      debounceRef.current = setTimeout(() => {
        fetchFutureCategories(currentHourOffset, cancelled);
      }, SLIDER_DEBOUNCE_MS);
    }

    return () => {
      cancelled.v = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentHourOffset, replaceFlightCategories]);
}
