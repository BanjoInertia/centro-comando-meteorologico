"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScanningEffectProps {
  position: THREE.Vector3;
  color?: string;
}

export default function ScanningEffect({ position, color = "#00d4aa" }: ScanningEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    if (meshRef.current && materialRef.current) {
      meshRef.current.scale.x += delta * 1.5;
      meshRef.current.scale.y += delta * 1.5;

      const currentScale = meshRef.current.scale.x;
      const newOpacity = Math.max(0, 1 - (currentScale - 1) / 2);
      materialRef.current.opacity = newOpacity;

      if (newOpacity <= 0) {
        meshRef.current.scale.set(1, 1, 1);
        materialRef.current.opacity = 1;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      quaternion={new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        position.clone().normalize()
      )}
    >
      <ringGeometry args={[0.015, 0.02, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={1}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
