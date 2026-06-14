import { Info, AlertTriangle, OctagonAlert } from "lucide-react";
import { WeatherAlert } from "@/types";
import { motion, Variants } from "framer-motion";

const cardVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

interface AlertCardProps {
  alert: WeatherAlert;
}

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatAlertTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[d.getUTCMonth()];
  const hh  = String(d.getUTCHours()).padStart(2, "0");
  const mm  = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${mon} · ${hh}:${mm}Z`;
}

export default function AlertCard({ alert }: AlertCardProps) {
  let bgColor = "";
  let borderColor = "";
  let textColor = "";
  let Icon = Info;

  switch (alert.level) {
    case "danger":
      bgColor = "bg-rose-500/10";
      borderColor = "border-rose-500/30";
      textColor = "text-rose-400";
      Icon = OctagonAlert;
      break;
    case "attention":
      bgColor = "bg-amber-500/10";
      borderColor = "border-amber-500/30";
      textColor = "text-amber-400";
      Icon = AlertTriangle;
      break;
    case "info":
    default:
      bgColor = "bg-cyan-500/10";
      borderColor = "border-cyan-500/30";
      textColor = "text-cyan-400";
      Icon = Info;
      break;
  }

  return (
    <motion.div 
      variants={cardVariants}
      className={`rounded-xl border p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${bgColor} ${borderColor}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${textColor}`} />
        <div className="flex-1">
          <h4 className={`text-sm font-semibold tracking-wide ${textColor}`}>
            {alert.title}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            {alert.description}
          </p>
          
          {(alert.validFrom || alert.validTo) && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {alert.validFrom && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">De</span>
                  <span className="text-xs font-mono font-semibold text-slate-300">{formatAlertTime(alert.validFrom)}</span>
                </div>
              )}
              {alert.validFrom && alert.validTo && <span className="text-slate-700 text-sm">→</span>}
              {alert.validTo && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Até</span>
                  <span className="text-xs font-mono font-semibold text-slate-300">{formatAlertTime(alert.validTo)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
