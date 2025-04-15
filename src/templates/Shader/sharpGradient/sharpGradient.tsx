import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useShaderControls } from "../ShaderControl";

import vertex from "./sharpGradient.vert";
import fragment from "./sharpGradient.frag";

// custom shader material
const SharpGradientMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uSpeed: 1.,
    uTimeOffset: 0.0,
    uLightness: 0.,
    uPosition: new THREE.Vector2(0.0, 0.0),
    uScale: new THREE.Vector2(1.0, 1.0),
    uRotate: 0.,
    uColor: ["#404a70", "#8d99ae", "#2b2d42", "#000000"].map(
      (color) => new THREE.Color(color)
    ),
    uBgColor: new THREE.Color('#000000'),
    uComplex: 1,
    uMorph: 0.0,
  },
  vertex,
  fragment
);

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
SharpGradientMaterial.key = THREE.MathUtils.generateUUID();

extend({ SharpGradientMaterial });

// shader material combined with mesh
const SharpGradientBg: React.FC = (props: Mesh) => {
  const { viewport } = useThree();

  // Use controls
  const {
    animation: { speed, timeOffset },
    color: { color1, color2, color3, color4, bgColor, lightness },
    shape: { position, scaleX, scaleY, complex, morph }
  } = useShaderControls();

  // set ref
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // animation
  useFrame(({ clock }) => {
    const a = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = a * 10;
    }
  });

  return (
    <mesh
      ref={meshRef as React.RefObject<THREE.Mesh>}
    >
      <planeBufferGeometry args={[viewport.width, viewport.height, 1, 1]} />
      {/* @ts-ignore */}
      <sharpGradientMaterial
        key={SharpGradientMaterial.key}
        ref={materialRef}
        uSpeed={speed}
        uTimeOffset={timeOffset}
        uLightness={lightness}
        uPosition={new THREE.Vector2(position.x, position.y)}
        uScale={new THREE.Vector2(scaleX, scaleY)}
        uColor={[color1, color2, color3, color4].map((color) => new THREE.Color(color))}
        uBgColor={new THREE.Color(bgColor)}
        uComplex={complex}
        uMorph={morph}
        uResolution={new THREE.Vector2(viewport.width, viewport.height)}
      />
    </mesh>
  );
};

export default SharpGradientBg;
