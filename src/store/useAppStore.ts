import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SelectedStation, TimelineState, Airport, WindLayer } from "@/types";

// =============================================================================
// Helpers
// =============================================================================

function haversineKm(a: Airport, b: Airport): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const x = sinDLat * sinDLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// =============================================================================
// State interface
// =============================================================================

interface AppState {
  selectedStation: SelectedStation | null;
  setSelectedStation: (station: SelectedStation | null) => void;
  updateStationStatus: (status: SelectedStation["status"]) => void;

  timeline: TimelineState;
  setHourOffset: (offset: number) => void;
  togglePlayback: () => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  isGlobeFullscreen: boolean;
  setGlobeFullscreen: (v: boolean) => void;

  focusedAirport: Airport | null;
  setFocusedAirport: (airport: Airport | null) => void;

  globeStyle: "satellite" | "vector" | "thermal";
  setGlobeStyle: (style: "satellite" | "vector" | "thermal") => void;

  favoriteIcaos: string[];
  toggleFavorite: (icao: string) => void;
  isFavorite: (icao: string) => boolean;

  routeMode: boolean;
  routeOrigin: Airport | null;
  routeDestination: Airport | null;
  routeDistanceKm: number | null;
  setRouteMode: (v: boolean) => void;
  setRouteDestination: (airport: Airport | null) => void;
  clearRoute: () => void;

  clearStation: () => void;

  windLayer: WindLayer | null;
  showWindLayer: boolean;
  setWindLayer: (layer: WindLayer | null) => void;
  toggleWindLayer: () => void;

  flightCategories: Record<string, string>;
  setFlightCategories: (cats: Record<string, string>) => void;
  replaceFlightCategories: (cats: Record<string, string>) => void;
}

// =============================================================================
// Store
// =============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedStation: null,
      setSelectedStation: (station) => set({ selectedStation: station }),
      updateStationStatus: (status) =>
        set((state) => ({
          selectedStation: state.selectedStation
            ? { ...state.selectedStation, status }
            : null,
        })),

      timeline: { currentHourOffset: 0, isPlaying: false },
      setHourOffset: (offset) =>
        set((state) => ({ timeline: { ...state.timeline, currentHourOffset: offset } })),
      togglePlayback: () =>
        set((state) => ({ timeline: { ...state.timeline, isPlaying: !state.timeline.isPlaying } })),

      isSidebarOpen: false,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      isGlobeFullscreen: false,
      setGlobeFullscreen: (v) => set({ isGlobeFullscreen: v }),

      focusedAirport: null,
      setFocusedAirport: (airport) => set({ focusedAirport: airport }),

      globeStyle: "satellite",
      setGlobeStyle: (style) => set({ globeStyle: style }),

      favoriteIcaos: [],
      toggleFavorite: (icao) =>
        set((state) => ({
          favoriteIcaos: state.favoriteIcaos.includes(icao)
            ? state.favoriteIcaos.filter((i) => i !== icao)
            : [...state.favoriteIcaos, icao],
        })),
      isFavorite: (icao) => get().favoriteIcaos.includes(icao),

      routeMode: false,
      routeOrigin: null,
      routeDestination: null,
      routeDistanceKm: null,

      setRouteMode: (v) =>
        set((state) => ({
          routeMode: v,
          routeOrigin: v ? (state.focusedAirport ?? state.routeOrigin) : state.routeOrigin,
        })),

      setRouteDestination: (airport) =>
        set((state) => {
          const origin = state.routeOrigin;
          const distKm = origin && airport ? haversineKm(origin, airport) : null;
          return {
            routeDestination: airport,
            routeDistanceKm: distKm,
            routeMode: false,
          };
        }),

      clearRoute: () =>
        set({
          routeDestination: null,
          routeOrigin: null,
          routeDistanceKm: null,
          routeMode: false,
        }),

      clearStation: () =>
        set({
          selectedStation: null,
          focusedAirport: null,
          isSidebarOpen: false,
          timeline: { currentHourOffset: 0, isPlaying: false },
        }),

      windLayer: null,
      showWindLayer: false,
      setWindLayer: (layer) => set({ windLayer: layer }),
      toggleWindLayer: () => set((state) => ({ showWindLayer: !state.showWindLayer })),

      flightCategories: {},
      setFlightCategories: (cats) =>
        set((state) => ({ flightCategories: { ...state.flightCategories, ...cats } })),
      replaceFlightCategories: (cats) =>
        set({ flightCategories: cats }),
    }),
    {
      name: "aero-weather-store",
      partialize: (state) => ({ favoriteIcaos: state.favoriteIcaos }),
    }
  )
);
