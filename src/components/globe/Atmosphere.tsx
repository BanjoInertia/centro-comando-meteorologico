"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";

export default function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const selectedStation = useAppStore((state) => state.selectedStation);
  const flightCategory = selectedStation?.briefing?.flightCategory || selectedStation?.metar?.flight_category;

  let targetColor = new THREE.Color("#0ea5e9");

  if (flightCategory === "VFR") {
    targetColor = new THREE.Color("#10b981");
  } else if (flightCategory === "MVFR") {
    targetColor = new THREE.Color("#3b82f6");
  } else if (flightCategory === "IFR") {
    targetColor = new THREE.Color("#f59e0b");
  } else if (flightCategory === "LIFR") {
    targetColor = new THREE.Color("#ef4444");
  }

  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    uniform vec3 uColor;
    uniform float uIntensity;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      gl_FragColor = vec4(uColor, 1.0) * intensity * uIntensity;
    }
  `;

  useFrame((state, delta) => {
    if (materialRef.current) {
      const currentColor = materialRef.current.uniforms.uColor.value as THREE.Color;
      currentColor.lerp(targetColor, delta * 2.5);

      if (flightCategory === "LIFR") {
        const pulse = 1.4 + Math.sin(state.clock.getElapsedTime() * 4.5) * 0.35;
        materialRef.current.uniforms.uIntensity.value = pulse;
      } else {
        materialRef.current.uniforms.uIntensity.value = 1.5;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.15, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uColor: { value: new THREE.Color("#0ea5e9") },
          uIntensity: { value: 1.5 }
        }}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
