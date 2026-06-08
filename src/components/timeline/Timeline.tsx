"use client";

import React, { useEffect } from "react";
import PlaybackControls from "./PlaybackControls";
import TimeSlider from "./TimeSlider";
import { useAppStore } from "@/store/useAppStore";

export default function Timeline() {
  const isPlaying = useAppStore((state) => state.timeline.isPlaying);
  const currentHourOffset = useAppStore((state) => state.timeline.currentHourOffset);
  const setHourOffset = useAppStore((state) => state.setHourOffset);
  const togglePlayback = useAppStore((state) => state.togglePlayback);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        if (currentHourOffset >= 24) {
          togglePlayback();
        } else {
          setHourOffset(currentHourOffset + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentHourOffset, setHourOffset, togglePlayback]);

  return (
    <div className="flex w-full h-full items-center bg-[#080f1a]/80 backdrop-blur-md px-4 py-2 border-t border-slate-800 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
      <div className="flex w-full max-w-7xl mx-auto h-full">
        <PlaybackControls />
        <TimeSlider />
      </div>
    </div>
  );
}
