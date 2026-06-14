import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Airport, SelectedStation } from "@/types";

const briefingCache: Record<string, any> = {};

export function useStationSelect() {
  const { setSelectedStation, updateStationStatus, setSidebarOpen, setFocusedAirport, setHourOffset } =
    useAppStore();

  const selectAbortRef = useRef<AbortController | null>(null);

  const selectAirport = useCallback(
    async (airport: Airport) => {
      selectAbortRef.current?.abort();
      const controller = new AbortController();
      selectAbortRef.current = controller;
      const { signal } = controller;

      setSidebarOpen(true);
      setFocusedAirport(airport);
      setHourOffset(0);

      setSelectedStation({
        airport,
        metar: null,
        taf: null,
        briefing: null,
        status: "fetching-metar",
      } as SelectedStation);

      try {
        const [metarRes, tafRes] = await Promise.all([
          fetch(`/api/metar?icao=${airport.icao}`, { signal }),
          fetch(`/api/taf?icao=${airport.icao}`, { signal }),
        ]);

        const metarJson = await metarRes.json();
        const tafJson = await tafRes.json();

        if (!metarRes.ok || metarJson.error) {
          throw new Error(metarJson.error || "Erro ao buscar METAR.");
        }

        const metar = metarJson.data;
        const taf = tafJson.data;

        setSelectedStation({ airport, metar, taf, briefing: null, status: "processing-ai" });

        const cacheKey = `${airport.icao}-${metar?.raw_text ?? ""}-${taf?.raw_text ?? ""}`;
        if (briefingCache[cacheKey]) {
          setSelectedStation({ airport, metar, taf, briefing: briefingCache[cacheKey], status: "done" });
          return;
        }

        const briefingRes = await fetch(`/api/ai-briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ airport, metar, taf }),
          signal,
        });

        let briefingJson: any;
        try { briefingJson = await briefingRes.json(); }
        catch { throw new Error("Resposta inválida da IA. Tente novamente."); }

        if (!briefingRes.ok || briefingJson?.error) {
          throw new Error(briefingJson?.error || "Erro ao gerar briefing da IA.");
        }

        if (!briefingJson.data?.isMock) {
          briefingCache[cacheKey] = briefingJson.data;
        }

        setSelectedStation({ airport, metar, taf, briefing: briefingJson.data, status: "done" });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("[useStationSelect] Erro:", err.message || err);
        setSelectedStation({
          airport,
          metar: null,
          taf: null,
          briefing: null,
          status: "error",
          error: err.message || "Falha ao carregar dados. Tente novamente.",
        });
      }
    },
    [setSelectedStation, updateStationStatus, setSidebarOpen, setFocusedAirport, setHourOffset]
  );

  return { selectAirport };
}
