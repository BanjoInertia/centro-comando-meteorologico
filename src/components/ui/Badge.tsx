import React from "react";

interface BadgeProps {
  category?: "VFR" | "MVFR" | "IFR" | "LIFR" | string;
}

export default function Badge({ category }: BadgeProps) {
  if (!category) return null;

  let bg = "bg-slate-500/20";
  let text = "text-slate-400";
  let border = "border-slate-500/30";

  switch (category.toUpperCase()) {
    case "VFR":
      bg = "bg-emerald-500/20";
      text = "text-emerald-400";
      border = "border-emerald-500/30";
      break;
    case "MVFR":
      bg = "bg-blue-500/20";
      text = "text-blue-400";
      border = "border-blue-500/30";
      break;
    case "IFR":
      bg = "bg-amber-500/20";
      text = "text-amber-400";
      border = "border-amber-500/30";
      break;
    case "LIFR":
      bg = "bg-rose-500/20";
      text = "text-rose-400";
      border = "border-rose-500/30";
      break;
  }

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${bg} ${text} ${border}`}
    >
      {category.toUpperCase()}
    </span>
  );
}
