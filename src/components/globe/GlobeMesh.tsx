"use client";

import { useTexture } from "@react-three/drei";
import { useAppStore } from "@/store/useAppStore";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "@/lib/three/geoUtils";

// =============================================================================
// Shaders
// =============================================================================

const dayNightVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const dayNightFragmentShader = `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform vec3 uSunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec4 dayColor   = texture2D(uDayMap,   vUv);
    vec4 nightColor = texture2D(uNightMap, vUv);
    float sunDot = dot(vWorldNormal, normalize(uSunDirection));
    float dayFactor = smoothstep(-0.1, 0.15, sunDot);
    float nightIntensity = 1.0 - dayFactor;
    vec3 blended = mix(nightColor.rgb * nightIntensity * 2.2, dayColor.rgb, dayFactor);
    gl_FragColor = vec4(blended, 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const vectorFragmentShader = `
  uniform sampler2D uEarthMap;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 texColor = texture2D(uEarthMap, vUv);
    float landFactor = texColor.r + texColor.g - texColor.b;
    bool isLand = landFactor > 0.05;
    float gridScale = 120.0;
    vec2 gridUV = fract(vUv * gridScale);
    float lineThickness = 0.08;
    float gridX = smoothstep(0.0, lineThickness, gridUV.x) * smoothstep(1.0, 1.0 - lineThickness, gridUV.x);
    float gridY = smoothstep(0.0, lineThickness, gridUV.y) * smoothstep(1.0, 1.0 - lineThickness, gridUV.y);
    float grid = 1.0 - (gridX * gridY);
    vec2 majorGridUV = fract(vUv * 12.0);
    float majorLineThickness = 0.04;
    float majorGridX = smoothstep(0.0, majorLineThickness, majorGridUV.x) * smoothstep(1.0, 1.0 - majorLineThickness, majorGridUV.x);
    float majorGridY = smoothstep(0.0, majorLineThickness, majorGridUV.y) * smoothstep(1.0, 1.0 - majorLineThickness, majorGridUV.y);
    float majorGrid = 1.0 - (majorGridX * majorGridY);
    float scanLine = sin(vUv.y * 150.0 - uTime * 4.0) * 0.5 + 0.5;
    scanLine = pow(scanLine, 3.5);
    vec3 neonCyan = vec3(0.0, 0.95, 1.0);
    vec3 neonBlue = vec3(0.0, 0.35, 1.0);
    vec3 darkBlue = vec3(0.02, 0.06, 0.16);
    vec3 gridColor = neonCyan;
    float intensity = 0.0;
    if (isLand) {
      intensity = mix(0.1, 0.95, grid) + scanLine * 0.2 + majorGrid * 0.35;
      gridColor = neonCyan;
    } else {
      intensity = mix(0.01, 0.25, grid) * 0.3 + scanLine * 0.05 + majorGrid * 0.08;
      gridColor = neonBlue;
    }
    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
    intensity += fresnel * 0.6;
    vec3 finalColor = mix(darkBlue, gridColor * 1.6, intensity);
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

const thermalFragmentShader = `
  uniform sampler2D uEarthMap;
  uniform sampler2D uTempMap;
  uniform bool uHasTempData;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  vec3 thermalColormap(float t) {
    vec3 c1 = vec3(0.12, 0.0, 0.25);
    vec3 c2 = vec3(0.0, 0.3, 0.85);
    vec3 c3 = vec3(0.0, 0.8, 0.35);
    vec3 c4 = vec3(0.9, 0.8, 0.0);
    vec3 c5 = vec3(0.9, 0.15, 0.0);
    if (t < 0.25) return mix(c1, c2, t / 0.25);
    else if (t < 0.5) return mix(c2, c3, (t - 0.25) / 0.25);
    else if (t < 0.75) return mix(c3, c4, (t - 0.5) / 0.25);
    else return mix(c4, c5, (t - 0.75) / 0.25);
  }
  void main() {
    float tempNorm = 0.0;
    vec4 earthTex = texture2D(uEarthMap, vUv);
    if (uHasTempData) {
      float rawVal = texture2D(uTempMap, vUv).r;
      float tempC = rawVal * 100.0 - 50.0;
      tempNorm = clamp((tempC + 30.0) / 70.0, 0.0, 1.0);
    } else {
      float latFactor = sin(vUv.y * 3.14159265);
      float baseTemp = latFactor * 0.7;
      float landFactor = clamp(earthTex.r + earthTex.g - earthTex.b, 0.0, 1.0);
      tempNorm = baseTemp + landFactor * 0.25;
      float wave1 = sin(vUv.x * 24.0 + uTime * 0.4) * cos(vUv.y * 18.0 - uTime * 0.25) * 0.07;
      float wave2 = cos(vUv.x * 12.0 - uTime * 0.15) * sin(vUv.y * 32.0 + uTime * 0.35) * 0.04;
      tempNorm = clamp(tempNorm + wave1 + wave2, 0.0, 1.0);
    }
    vec3 heatColor = thermalColormap(tempNorm);
    float lum = dot(earthTex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 mapBase = vec3(lum * 0.6 + 0.4);
    vec3 blendedHeatmap = heatColor * mapBase;
    float gridScale = 50.0;
    vec2 gridUV = fract(vUv * gridScale);
    float grid = 1.0 - (smoothstep(0.0, 0.03, gridUV.x) * smoothstep(1.0, 0.97, gridUV.x) *
                        smoothstep(0.0, 0.03, gridUV.y) * smoothstep(1.0, 0.97, gridUV.y));
    vec3 finalColor = mix(blendedHeatmap, vec3(0.0, 0.9, 0.45), grid * 0.08);
    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
    finalColor = mix(finalColor, vec3(0.02, 0.04, 0.08), fresnel * 0.5);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// =============================================================================
// Componente
// =============================================================================

const EARTH_TEXTURE_URL = "/textures/earth-4k.jpg";
const EARTH_NIGHT_TEXTURE_URL = "/textures/earth_nightmap.jpg";

export default function GlobeMesh() {
  const [earthTexture, earthNightTexture] = useTexture([EARTH_TEXTURE_URL, EARTH_NIGHT_TEXTURE_URL]);
  const globeStyle = useAppStore((state) => state.globeStyle);
  const currentHourOffset = useAppStore((state) => state.timeline.currentHourOffset);
  const windLayer = useAppStore((state) => state.windLayer);

  const tempTexture = useMemo(() => {
    if (!windLayer?.points?.length) return null;
    const dataW = 36;
    const dataH = 18;
    if (windLayer.points.length < dataW * dataH) return null;

    const getTemp = (lat: number, lon: number): number => {
      const fi = (lat - (-85)) / 10;
      const fj = ((lon - (-180)) / 10 + dataW) % dataW;
      const i0 = Math.max(0, Math.min(dataH - 1, Math.floor(fi)));
      const i1 = Math.max(0, Math.min(dataH - 1, i0 + 1));
      const j0 = Math.floor(fj) % dataW;
      const j1 = (j0 + 1) % dataW;
      const ty = fi - Math.floor(fi);
      const tx = fj - Math.floor(fj);
      const t00 = windLayer.points[i0 * dataW + j0]?.temp ?? 0;
      const t01 = windLayer.points[i0 * dataW + j1]?.temp ?? 0;
      const t10 = windLayer.points[i1 * dataW + j0]?.temp ?? 0;
      const t11 = windLayer.points[i1 * dataW + j1]?.temp ?? 0;
      return t00 * (1 - tx) * (1 - ty) + t01 * tx * (1 - ty) + t10 * (1 - tx) * ty + t11 * tx * ty;
    };

    const W = 720, H = 360;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
      const lat = 90 - (py / H) * 180;
      for (let px = 0; px < W; px++) {
        const lon = -180 + (px / W) * 360;
        const tempC = getTemp(lat, lon);
        const val = Math.floor(Math.max(0, Math.min(1, (tempC + 50) / 100)) * 255);
        const idx = (py * W + px) * 4;
        imgData.data[idx] = val; imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val; imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }, [windLayer]);

  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const simulatedUtcHours = (utcHours + currentHourOffset) % 24;
  const sunPos3 = latLonToVector3(0, -15 * (simulatedUtcHours - 12), 1);

  const uniforms = useRef({
    uEarthMap: { value: earthTexture },
    uTime: { value: 0 },
    uTempMap: { value: new THREE.Texture() },
    uHasTempData: { value: false },
  });

  const dayNightUniforms = useRef({
    uDayMap: { value: earthTexture },
    uNightMap: { value: earthNightTexture },
    uSunDirection: { value: new THREE.Vector3(sunPos3.x, sunPos3.y, sunPos3.z) },
  });

  const sunVec = useRef(new THREE.Vector3(sunPos3.x, sunPos3.y, sunPos3.z));

  useEffect(() => {
    uniforms.current.uTempMap.value = tempTexture ?? new THREE.Texture();
    uniforms.current.uHasTempData.value = !!tempTexture;
  }, [tempTexture]);

  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.getElapsedTime();
    const t = new Date();
    const h = t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600;
    const sp = latLonToVector3(0, -15 * ((h + currentHourOffset) % 24 - 12), 1);
    sunVec.current.set(sp.x, sp.y, sp.z);
    dayNightUniforms.current.uSunDirection.value.copy(sunVec.current);
  });

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />

      {globeStyle === "satellite" && (
        <shaderMaterial
          key="daynight-shader"
          vertexShader={dayNightVertexShader}
          fragmentShader={dayNightFragmentShader}
          uniforms={dayNightUniforms.current}
        />
      )}

      {globeStyle === "vector" && (
        <shaderMaterial
          key="vector-shader"
          vertexShader={vertexShader}
          fragmentShader={vectorFragmentShader}
          uniforms={uniforms.current}
          transparent={true}
          depthWrite={true}
        />
      )}

      {globeStyle === "thermal" && (
        <shaderMaterial
          key="thermal-shader"
          vertexShader={vertexShader}
          fragmentShader={thermalFragmentShader}
          uniforms={uniforms.current}
          transparent={false}
          depthWrite={true}
        />
      )}
    </mesh>
  );
}
