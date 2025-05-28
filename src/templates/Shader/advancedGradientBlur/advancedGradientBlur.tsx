import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useState, useEffect } from "react";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { createShaderControls } from "../ShaderControl";

// Import your existing shaders
import vertex from "./advancedGradientBlur.vert";
import fragment from "./advancedGradientBlur.frag";

// Define the blur material with your shader parameters
const BlurMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uImgPosition: new THREE.Vector2(0, 0),
    uImgSize: new THREE.Vector2(0, 0),
    uTexture: new THREE.Texture(),
    // Blur 相关参数
    uDirection: new THREE.Vector2(0, 1), // 默认向上模糊
    uStartPoint: 0.,
    uEndPoint: 1.,
    uAmount: 30,
    uRepeats: 30,
    uGradientColor: new THREE.Color(0x000000),
  },
  vertex,
  fragment
);

// Generate a unique key for HMR
BlurMaterial.key = THREE.MathUtils.generateUUID();

// Extend for use with react-three-fiber
extend({ BlurMaterial });

// Type declaration for TypeScript
declare module '@react-three/fiber' {
  interface ThreeElements {
    blurMaterial: JSX.IntrinsicElements['shaderMaterial'] & { key: string }
  }
}

export const useAdvancedGradientBlurControls = createShaderControls(['blur', 'gradient']);

// 方向映射函数
const getDirectionVector = (direction: string): THREE.Vector2 => {
  switch (direction) {
    case 'horizontal': return new THREE.Vector2(1, 0);
    case 'vertical': return new THREE.Vector2(0, 1);
    default: return new THREE.Vector2(0, 1); // 默认为垂直方向
  }
};

// The shader component
const AdvancedGradientBlurImage = ({
  imageUrl = '/img/Background.png', // Default image path
  position = [0, 0],
  size = [1, 1],
}) => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const {
    blur: { direction, startPoint, endPoint, amount, quality },
    gradient: { hasGradient, gradientColor }
  } = useAdvancedGradientBlurControls();

  // Load the texture using drei's useTexture hook
  const texture = useTexture(imageUrl);

  // Animation frame update
  useFrame((state, delta) => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height);

      // 更新图片位置和大小
      materialRef.current.uniforms.uImgPosition.value = new THREE.Vector2(
        position[0],
        position[1]
      );
      const imageAspectRatio = texture.image.width / texture.image.height;
      const viewportAspectRatio = viewport.width / viewport.height;

      size[1] = viewportAspectRatio / imageAspectRatio;
      materialRef.current.uniforms.uImgSize.value = new THREE.Vector2(
        size[0],
        size[1]
      );
      materialRef.current.uniforms.uTexture.value = texture;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height, 100, 100]} />

      <blurMaterial
        key={BlurMaterial.key}
        ref={materialRef}
        transparent={true}
        // {/* @ts-ignore */}
        uDirection={getDirectionVector(direction)}
        uStartPoint={startPoint}
        uEndPoint={endPoint}
        uAmount={amount}
        uRepeats={quality}
        uGradientColor={new THREE.Color(gradientColor)}
      // uTexture={texture}
      />
    </mesh>
  );
};

export default AdvancedGradientBlurImage;
