"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { WindPoint } from "@/types";

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const GLOBE_RADIUS = 1.015;
const NUM_PARTICLES = 4500;
const TRAIL_LENGTH = 35;
const SPEED_MULTIPLIER = 80000;
const NUM_SEGMENTS = TRAIL_LENGTH - 1;

export default function WindParticles() {
  const windLayer = useAppStore((s) => s.windLayer);
  const showWindLayer = useAppStore((s) => s.showWindLayer);

  const linesRef = useRef<THREE.LineSegments>(null!);

  const particles = useMemo(() => {
    return {
      lat: new Float32Array(NUM_PARTICLES * TRAIL_LENGTH),
      lon: new Float32Array(NUM_PARTICLES * TRAIL_LENGTH),
      age: new Float32Array(NUM_PARTICLES),
      life: new Float32Array(NUM_PARTICLES)
    };
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        depthTest: true,
      }),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(NUM_PARTICLES * NUM_SEGMENTS * 6);

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const resetParticle = (i: number) => {
      const lat = (Math.random() - 0.5) * 160;
      const lon = (Math.random() - 0.5) * 360;
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        particles.lat[i * TRAIL_LENGTH + t] = lat;
        particles.lon[i * TRAIL_LENGTH + t] = lon;
      }
      particles.life[i] = 80 + Math.random() * 120;
      particles.age[i] = Math.random() * particles.life[i];
    };

    for (let i = 0; i < NUM_PARTICLES; i++) resetParticle(i);

    return geo;
  }, [particles]);

  const getWindAt = (lat: number, lon: number, pts: WindPoint[]) => {
    let fy = (lat + 85) / 9.44;
    let fx = (lon + 175) / 12.06;

    fx = ((fx % 30) + 30) % 30;

    const x0 = Math.floor(fx);
    const x1 = (x0 + 1) % 30;

    const y0 = Math.max(0, Math.min(18, Math.floor(fy)));
    const y1 = Math.max(0, Math.min(18, y0 + 1));

    const tx = fx - x0;
    const ty = Math.max(0, Math.min(1, fy - y0));

    const p00 = pts[y0 * 30 + x0];
    const p10 = pts[y0 * 30 + x1];
    const p01 = pts[y1 * 30 + x0];
    const p11 = pts[y1 * 30 + x1];

    if (!p00 || !p10 || !p01 || !p11) return { u: 0, v: 0 };

    const u0 = p00.u * (1 - tx) + p10.u * tx;
    const u1 = p01.u * (1 - tx) + p11.u * tx;
    const u = u0 * (1 - ty) + u1 * ty;

    const v0 = p00.v * (1 - tx) + p10.v * tx;
    const v1 = p01.v * (1 - tx) + p11.v * tx;
    const v = v0 * (1 - ty) + v1 * ty;

    return { u, v };
  };

  useFrame(() => {
    if (!showWindLayer || !linesRef.current || !windLayer?.points.length) return;

    const dt = 0.016;
    const pts = windLayer.points;
    const posAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.age[i]++;

      if (particles.age[i] >= particles.life[i]) {
        const lat = (Math.random() - 0.5) * 160;
        const lon = (Math.random() - 0.5) * 360;
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          particles.lat[i * TRAIL_LENGTH + t] = lat;
          particles.lon[i * TRAIL_LENGTH + t] = lon;
        }
        particles.age[i] = 0;
        particles.life[i] = 80 + Math.random() * 120;
      }

      const headIdx = i * TRAIL_LENGTH;
      const lat = particles.lat[headIdx];
      const lon = particles.lon[headIdx];

      const wind = getWindAt(lat, lon, pts);

      let dLat = 0;
      let dLon = 0;

      if (wind) {
        const latRad = lat * (Math.PI / 180);
        const cosLat = Math.max(Math.abs(Math.cos(latRad)), 0.05);
        dLat = (wind.v / 111320) * SPEED_MULTIPLIER * dt;
        dLon = (wind.u / (111320 * cosLat)) * SPEED_MULTIPLIER * dt;
      }

      for (let t = TRAIL_LENGTH - 1; t > 0; t--) {
        particles.lat[headIdx + t] = particles.lat[headIdx + t - 1];
        particles.lon[headIdx + t] = particles.lon[headIdx + t - 1];
      }

      particles.lat[headIdx] = lat + dLat;
      particles.lon[headIdx] = lon + dLon;

      if (particles.lon[headIdx] > 180) particles.lon[headIdx] -= 360;
      if (particles.lon[headIdx] < -180) particles.lon[headIdx] += 360;

      const ageNorm = particles.age[i] / particles.life[i];
      let tailMaxIdx = NUM_SEGMENTS;
      if (ageNorm < 0.2) {
        tailMaxIdx = Math.floor((ageNorm / 0.2) * NUM_SEGMENTS);
      } else if (ageNorm > 0.8) {
        const shrink = Math.floor(((ageNorm - 0.8) / 0.2) * NUM_SEGMENTS);
        for (let s = NUM_SEGMENTS - shrink; s < NUM_SEGMENTS; s++) {
          const vIdx = (i * NUM_SEGMENTS + s) * 6;
          posArray[vIdx + 0] = 0; posArray[vIdx + 1] = 0; posArray[vIdx + 2] = 0;
          posArray[vIdx + 3] = 0; posArray[vIdx + 4] = 0; posArray[vIdx + 5] = 0;
        }
        tailMaxIdx = NUM_SEGMENTS - shrink;
      }

      for (let s = 0; s < tailMaxIdx; s++) {
        const p1Lat = particles.lat[headIdx + s];
        const p1Lon = particles.lon[headIdx + s];
        const p2Lat = particles.lat[headIdx + s + 1];
        const p2Lon = particles.lon[headIdx + s + 1];

        const isWrap = Math.abs(p1Lon - p2Lon) > 180;
        const vIdx = (i * NUM_SEGMENTS + s) * 6;

        if (isWrap) {
          posArray[vIdx + 0] = 0; posArray[vIdx + 1] = 0; posArray[vIdx + 2] = 0;
          posArray[vIdx + 3] = 0; posArray[vIdx + 4] = 0; posArray[vIdx + 5] = 0;
        } else {
          const v1 = latLonToVec3(p1Lat, p1Lon, GLOBE_RADIUS);
          const v2 = latLonToVec3(p2Lat, p2Lon, GLOBE_RADIUS);

          posArray[vIdx + 0] = v1.x; posArray[vIdx + 1] = v1.y; posArray[vIdx + 2] = v1.z;
          posArray[vIdx + 3] = v2.x; posArray[vIdx + 4] = v2.y; posArray[vIdx + 5] = v2.z;
        }
      }
    }

    posAttr.needsUpdate = true;
  });

  if (!showWindLayer) return null;

  return (
    <lineSegments
      ref={linesRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
