"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { getCameraTargetPosition } from "@/lib/three/geoUtils";

export default function CameraController() {
  const { camera } = useThree();
  const focusedAirport = useAppStore((state) => state.focusedAirport);

  const targetPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (focusedAirport) {
      targetPos.current = getCameraTargetPosition(
        focusedAirport.lat,
        focusedAirport.lon,
        1.5
      );
    } else {
      targetPos.current = null;
    }
  }, [focusedAirport]);

  useFrame((state, delta) => {
    if (targetPos.current) {
      const dist = camera.position.distanceTo(targetPos.current);
      const speed = dist < 0.05 ? 8 * delta : 2.5 * delta;
      camera.position.lerp(targetPos.current, speed);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}
