// =============================================================================
// THREE.JS UTILITIES
// =============================================================================

import * as THREE from "three";

export const GLOBE_RADIUS = 1;

export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function getCameraTargetPosition(
  lat: number,
  lon: number,
  distance: number = 2.2
): THREE.Vector3 {
  return latLonToVector3(lat, lon, distance);
}

export function lerpVector3(
  from: THREE.Vector3,
  to: THREE.Vector3,
  t: number
): THREE.Vector3 {
  return new THREE.Vector3().lerpVectors(from, to, t);
}

export function flightCategoryToColor(
  category?: "VFR" | "MVFR" | "IFR" | "LIFR"
): string {
  switch (category) {
    case "VFR":
      return "#00d4aa";
    case "MVFR":
      return "#3b82f6";
    case "IFR":
      return "#f59e0b";
    case "LIFR":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}
