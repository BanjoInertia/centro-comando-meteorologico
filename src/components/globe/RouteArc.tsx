"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { Airport } from "@/types";
import { latLonToVector3 } from "@/lib/three/geoUtils";

interface Props {
  origin: Airport;
  destination: Airport;
}

const ARC_RADIUS = 1.03;
const ARC_POINTS = 120;
const PARTICLE_SPEED = 0.35;

function greatCirclePoints(a: THREE.Vector3, b: THREE.Vector3, n: number, r: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, t).normalize().multiplyScalar(r);
    points.push(p);
  }
  return points;
}

export default function RouteArc({ origin, destination }: Props) {
  const particleRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);

  const oVec = useMemo(() => latLonToVector3(origin.lat, origin.lon, ARC_RADIUS), [origin]);
  const dVec = useMemo(() => latLonToVector3(destination.lat, destination.lon, ARC_RADIUS), [destination]);

  const arcPoints = useMemo(() => greatCirclePoints(oVec, dVec, ARC_POINTS, ARC_RADIUS), [oVec, dVec]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(arcPoints), [arcPoints]);

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + delta * PARTICLE_SPEED) % 1;
    const pos = curve.getPointAt(progressRef.current);
    if (particleRef.current) particleRef.current.position.set(pos.x, pos.y, pos.z);
    if (glowRef.current) glowRef.current.position.set(pos.x, pos.y, pos.z);
  });

  return (
    <group>
      {/* Glow exterior */}
      <Line
        points={arcPoints}
        color="#a78bfa"
        lineWidth={6}
        transparent
        opacity={0.12}
        dashed={false}
      />

      {/* Linha principal */}
      <Line
        points={arcPoints}
        color="#e0e7ff"
        lineWidth={2.5}
        transparent
        opacity={0.9}
        dashed={false}
      />

      {/* Linha de cor secundária */}
      <Line
        points={arcPoints}
        color="#818cf8"
        lineWidth={1.2}
        transparent
        opacity={0.65}
        dashed={false}
      />

      {/* Partícula animada */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} />
      </mesh>

      {/* Halo da partícula */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
