import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useState, useEffect } from "react";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { createShaderControls } from "../ShaderControl";

// Import your existing shaders
import vertex from "./progressiveBlur.vert";
import fragment from "./progressiveBlur.frag";

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

// 创建专用的控制钩子，只保留 blur 控制
export const useProgressiveBlurControls = createShaderControls(['blur'], {}, { showAIGenerate: false });

// 方向映射函数
const getDirectionVector = (direction: string): THREE.Vector2 => {
  switch (direction) {
    case 'horizontal': return new THREE.Vector2(1, 0);
    case 'vertical': return new THREE.Vector2(0, 1);
    default: return new THREE.Vector2(0, 1); // 默认为垂直方向
  }
};

// The shader component
const ProgressiveBlurImage = ({
  imageUrl = '/img/Background.png', // Default image path
  position = [0, 0],
  size = [1, 1],
  colors = ['#000000', '#000000', '#000000']
}) => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // 使用控制钩子，只保留 blur 相关控制
  const {
    blur: { direction, startPoint, endPoint, amount, quality }
  } = useProgressiveBlurControls();

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
      materialRef.current.uniforms.uImgSize.value = new THREE.Vector2(
        size[0],
        size[1]
      );

      // 更新 blur 相关参数
      materialRef.current.uniforms.uDirection.value = getDirectionVector(direction);
      materialRef.current.uniforms.uStartPoint.value = startPoint;
      materialRef.current.uniforms.uEndPoint.value = endPoint;
      materialRef.current.uniforms.uAmount.value = amount;
      materialRef.current.uniforms.uRepeats.value = quality;

      materialRef.current.uniforms.uTexture.value = texture;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height, 100, 100]} />
      {/* @ts-ignore */}
      <blurMaterial
        key={BlurMaterial.key}
        ref={materialRef}
        transparent={true}
      />
    </mesh>
  );
};

export default ProgressiveBlurImage;
