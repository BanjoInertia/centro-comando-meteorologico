import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function PlaybackControls() {
  const isPlaying = useAppStore((state) => state.timeline.isPlaying);
  const togglePlayback = useAppStore((state) => state.togglePlayback);
  const currentHourOffset = useAppStore((state) => state.timeline.currentHourOffset);
  const setHourOffset = useAppStore((state) => state.setHourOffset);

  const handleReset = () => {
    if (isPlaying) {
      togglePlayback();
    }
    setHourOffset(0);
  };

  const isAtEnd = currentHourOffset >= 24;

  const handlePlayPause = () => {
    if (!isPlaying && isAtEnd) {
      setHourOffset(0);
    }
    togglePlayback();
  };

  return (
    <div className="flex items-center gap-3 px-4 border-r border-slate-800">
      <button
        onClick={handlePlayPause}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      <button
        onClick={handleReset}
        disabled={currentHourOffset === 0 && !isPlaying}
        className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Voltar ao momento atual"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
