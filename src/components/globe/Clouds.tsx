"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";

const CLOUDS_TEXTURE_URL = "/textures/8k_earth_clouds.jpg";

export default function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const cloudsTexture = useTexture(CLOUDS_TEXTURE_URL);

  const selectedStation = useAppStore((state) => state.selectedStation);
  const flightCategory = selectedStation?.briefing?.flightCategory || selectedStation?.metar?.flight_category;

  const { targetColor, targetOpacity, rotationMultiplier } = useMemo(() => {
    const color = new THREE.Color();
    let opacity = 0.5;
    let speed = 1.0;
    switch (flightCategory) {
      case "VFR": color.set("#ffffff"); opacity = 0.5; speed = 0.75; break;
      case "MVFR": color.set("#e2e8f0"); opacity = 0.65; speed = 1.5; break;
      case "IFR": color.set("#94a3b8"); opacity = 0.8; speed = 3.0; break;
      case "LIFR": color.set("#475569"); opacity = 0.95; speed = 5.0; break;
      default: color.set("#ffffff"); opacity = 0.5; speed = 1.0; break;
    }
    return { targetColor: color, targetOpacity: opacity, rotationMultiplier: speed };
  }, [flightCategory]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.008 * rotationMultiplier;
    }

    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, delta * 2.0);
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        delta * 2.0
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.008, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        alphaMap={cloudsTexture}
        color="#ffffff"
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
