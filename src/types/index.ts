// =============================================================================
// TIPOS GLOBAIS
// =============================================================================

export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevation?: number;
  timezoneOffset: number;
}

export interface MetarData {
  raw_text: string;
  station: string;
  observed: string;
  wind?: {
    degrees?: number;
    speed_kts: number;
    gust_kts?: number;
  };
  visibility?: {
    meters: number;
  };
  sky_conditions?: Array<{
    sky_cover: string;
    base_feet_agl: number;
  }>;
  ceiling?: {
    code: string;
    feet: number;
    meters: number;
  };
  temperature?: {
    celsius: number;
  };
  dewpoint?: {
    celsius: number;
  };
  barometer?: {
    hpa: number;
  };
  flight_category?: "VFR" | "MVFR" | "IFR" | "LIFR";
}

export interface TafData {
  raw_text: string;
  station: string;
  issued?: string;
  valid_from?: string;
  valid_to?: string;
  forecast?: Array<{
    change?: {
      period?: {
        from: string;
        to: string;
      };
      type?: string;
    };
    clouds?: Array<{
      code: string;
      feet: number;
    }>;
    visibility?: {
      meters: number;
    };
    wind?: {
      degrees?: number;
      speed_kts: number;
      gust_kts?: number;
    };
  }>;
}

export type AlertLevel = "info" | "attention" | "danger";

export interface WeatherAlert {
  level: AlertLevel;
  title: string;
  description: string;
  validFrom?: string;
  validTo?: string;
}

export interface AiBriefing {
  summary: string;
  conditions: string;

  alerts: WeatherAlert[];
  flightCategory?: "VFR" | "MVFR" | "IFR" | "LIFR";
  updatedAt: string;
  isMock?: boolean;
  forecast?: Partial<MetarData>;
}

export type LoadingStatus =
  | "idle"
  | "fetching-metar"
  | "processing-ai"
  | "done"
  | "error";

export interface SelectedStation {
  airport: Airport;
  metar: MetarData | null;
  taf: TafData | null;
  briefing: AiBriefing | null;
  status: LoadingStatus;
  error?: string;
}

export interface TimelineState {
  currentHourOffset: number;
  isPlaying: boolean;
}

export interface WindPoint {
  lat: number;
  lon: number;
  u: number;
  v: number;
  temp: number;
}

export interface WindLayer {
  points: WindPoint[];
  fetchedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  timestamp: string;
}

