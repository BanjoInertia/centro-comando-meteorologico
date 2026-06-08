import React from "react";
import { WeatherAlert } from "@/types";
import AlertCard from "./AlertCard";
import { motion } from "framer-motion";

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

interface AlertListProps {
  alerts: WeatherAlert[];
}

export default function AlertList({ alerts }: AlertListProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const sortedAlerts = [...alerts].sort((a, b) => {
    const weights: Record<string, number> = {
      danger: 3,
      attention: 2,
      info: 1,
    };
    return (weights[b.level] || 0) - (weights[a.level] || 0);
  });

  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      {sortedAlerts.map((alert, index) => (
        <AlertCard key={`${alert.title}-${index}`} alert={alert} />
      ))}
    </motion.div>
  );
}
