"use client";

import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";

const STORAGE_KEY = "hw-accel-notice-dismissed";

export default function HwAccelNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-2 bg-slate-950/80 border border-amber-500/25 rounded-lg px-3 py-2 backdrop-blur-sm max-w-[220px]">
      <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
      <span className="text-[11px] font-mono text-slate-400 leading-snug flex-1">
        Para melhor desempenho, ative a{" "}
        <span className="text-amber-400 font-semibold">aceleração de hardware</span>{" "}
        no navegador.
      </span>
      <button onClick={dismiss} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0 cursor-pointer">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
