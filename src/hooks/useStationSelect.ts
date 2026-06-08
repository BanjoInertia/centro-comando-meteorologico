import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Airport, SelectedStation } from "@/types";

const briefingCache: Record<string, any> = {};

export function useStationSelect() {
  const { setSelectedStation, updateStationStatus, setSidebarOpen, setFocusedAirport, setHourOffset } =
    useAppStore();

  const selectAirport = useCallback(
    async (airport: Airport) => {
      setSidebarOpen(true);
      setFocusedAirport(airport);
      setHourOffset(0);

      const initialState: SelectedStation = {
        airport,
        metar: null,
        taf: null,
        briefing: null,
        status: "fetching-metar",
      };
      setSelectedStation(initialState);

      try {
        const [metarRes, tafRes] = await Promise.all([
          fetch(`/api/metar?icao=${airport.icao}`),
          fetch(`/api/taf?icao=${airport.icao}`)
        ]);

        const metarJson = await metarRes.json();
        const tafJson = await tafRes.json();

        if (!metarRes.ok || metarJson.error) {
          throw new Error(metarJson.error || "Erro ao buscar METAR.");
        }

        const metar = metarJson.data;
        const taf = tafJson.data;

        setSelectedStation({
          airport,
          metar,
          taf,
          briefing: null,
          status: "processing-ai",
        });



        const cacheKey = `${airport.icao}-0-${metar?.raw_text || ""}-${taf?.raw_text || ""}`;
        if (briefingCache[cacheKey]) {
          setSelectedStation({
            airport,
            metar,
            taf,
            briefing: briefingCache[cacheKey],
            status: "done",
          });
          return;
        }

        const briefingRes = await fetch(`/api/ai-briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            airport,
            metar,
            taf,
            hourOffset: 0,
          }),
        });

        let briefingJson;
        try {
          briefingJson = await briefingRes.json();
        } catch (err) {
          throw new Error("Resposta inválida da IA. Tente novamente.");
        }

        if (!briefingRes.ok || briefingJson?.error) {
          throw new Error(briefingJson?.error || "Erro ao gerar briefing da IA.");
        }

        if (!briefingJson.data?.isMock) {
          briefingCache[cacheKey] = briefingJson.data;
        }

        setSelectedStation({
          airport,
          metar,
          taf,
          briefing: briefingJson.data,
          status: "done",
        });
      } catch (err: any) {
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

  const updateBriefingForHour = useCallback(
    async (hourOffset: number) => {
      const state = useAppStore.getState();
      const station = state.selectedStation;

      if (!station || !station.metar) {
        return;
      }

      updateStationStatus("processing-ai");

      try {
        const cacheKey = `${station.airport.icao}-${hourOffset}-${station.metar.raw_text || ""}-${station.taf?.raw_text || ""}`;
        if (briefingCache[cacheKey]) {
          setSelectedStation({
            ...station,
            briefing: briefingCache[cacheKey],
            status: "done",
          });
          return;
        }

        const briefingRes = await fetch(`/api/ai-briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            airport: station.airport,
            metar: station.metar,
            taf: station.taf,
            hourOffset,
          }),
        });

        let briefingJson;
        try {
          briefingJson = await briefingRes.json();
        } catch (err) {
          throw new Error("Resposta inválida da IA para o futuro. Tente novamente.");
        }

        if (!briefingRes.ok || briefingJson?.error) {
          throw new Error(briefingJson?.error || "Erro ao gerar briefing futuro da IA.");
        }

        if (!briefingJson.data?.isMock) {
          briefingCache[cacheKey] = briefingJson.data;
        }

        setSelectedStation({
          ...station,
          briefing: briefingJson.data,
          status: "done",
        });
      } catch (err: any) {
        console.warn("[updateBriefingForHour] Erro:", err.message || err);
        updateStationStatus("done");
      }
    },
    [setSelectedStation, updateStationStatus]
  );

  return { selectAirport, updateBriefingForHour };
}
