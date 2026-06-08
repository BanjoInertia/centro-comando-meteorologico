import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useStationSelect } from "@/hooks/useStationSelect";

export default function TimeSlider() {
  const currentHourOffset = useAppStore((state) => state.timeline.currentHourOffset);
  const setHourOffset = useAppStore((state) => state.setHourOffset);
  const { updateBriefingForHour } = useStationSelect();

  const handleRelease = () => {
    updateBriefingForHour(currentHourOffset);
  };

  const marks = [0, 6, 12, 18, 24];

  return (
    <div className="flex-1 flex flex-col justify-center px-4">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-mono">AGORA</span>
        <span className="font-mono text-emerald-400 font-semibold">
          +{currentHourOffset}H
        </span>
        <span className="font-mono">+24H</span>
      </div>

      <div className="relative flex items-center w-full">
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={currentHourOffset}
          onChange={(e) => setHourOffset(Number(e.target.value))}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />

        {/* Marcadores visuais no slider */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-[6px] pointer-events-none">
          {marks.map((mark) => (
            <div
              key={mark}
              className="flex flex-col items-center"
              style={{
                width: "2px",
                position: "absolute",
                left: `${(mark / 24) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="h-1.5 w-[2px] bg-slate-600 rounded-full" />
              <span className="text-[10px] text-slate-500 mt-1">{mark}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
