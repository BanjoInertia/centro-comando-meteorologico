import { TafData } from "@/types";

export interface TafSnapshot {
  wind?: { degrees: number; speed_kts: number; gust_kts?: number };
  visibility?: { meters: number };
  sky_conditions?: Array<{ sky_cover: string; base_feet_agl: number }>;
  ceiling_ft?: number;
  hasTempo: boolean;
}

type BlockState = {
  visMeters?: number;
  ceilFeet?: number;
  wind?: { degrees: number; speed_kts: number; gust_kts?: number };
  sky?: Array<{ sky_cover: string; base_feet_agl: number }>;
};

function applyBlock(
  block: NonNullable<TafData["forecast"]>[number],
  state: BlockState
) {
  if (block.visibility?.meters !== undefined) {
    state.visMeters = block.visibility.meters;
  }
  if (block.wind) {
    state.wind = { ...block.wind };
  }
  if (block.clouds !== undefined) {
    const bknOvc = block.clouds
      .filter((c) => c.code === "BKN" || c.code === "OVC")
      .sort((a, b) => a.feet - b.feet)[0];
    state.ceilFeet = bknOvc?.feet;
    state.sky = block.clouds.map((c) => ({
      sky_cover: c.code,
      base_feet_agl: c.feet,
    }));
  }
}

export function parseTafAtHour(taf: TafData, hourOffset: number): TafSnapshot {
  if (!taf.forecast?.length) return { hasTempo: false };

  const targetTime = new Date(Date.now() + hourOffset * 3600 * 1000);
  const state: BlockState = {};

  for (const block of taf.forecast) {
    const type = block.change?.type;
    if (type === "TEMPO" || type?.startsWith("PROB")) continue;

    const fromStr = block.change?.period?.from;
    if (!fromStr) continue;
    if (new Date(fromStr) > targetTime) continue;

    applyBlock(block, state);
  }

  let hasTempo = false;
  for (const block of taf.forecast) {
    if (block.change?.type !== "TEMPO") continue;
    const fromStr = block.change.period?.from;
    const toStr = block.change.period?.to;
    if (!fromStr || !toStr) continue;

    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (targetTime < from || targetTime >= to) continue;

    hasTempo = true;

    if (block.visibility?.meters !== undefined) {
      state.visMeters =
        state.visMeters === undefined
          ? block.visibility.meters
          : Math.min(state.visMeters, block.visibility.meters);
    }
    if (block.wind) {
      state.wind = { ...block.wind };
    }
    if (block.clouds !== undefined) {
      const bknOvc = block.clouds
        .filter((c) => c.code === "BKN" || c.code === "OVC")
        .sort((a, b) => a.feet - b.feet)[0];
      if (bknOvc) {
        state.ceilFeet =
          state.ceilFeet === undefined
            ? bknOvc.feet
            : Math.min(state.ceilFeet, bknOvc.feet);
        state.sky = block.clouds.map((c) => ({
          sky_cover: c.code,
          base_feet_agl: c.feet,
        }));
      }
    }
  }

  return {
    wind: state.wind,
    visibility: state.visMeters !== undefined ? { meters: state.visMeters } : undefined,
    sky_conditions: state.sky,
    ceiling_ft: state.ceilFeet,
    hasTempo,
  };
}
