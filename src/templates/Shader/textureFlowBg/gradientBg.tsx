import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useControls, folder, useCreateStore } from 'leva'

import vertex from "./gradientShader.vert";
import fragment from "./gradientShader.frag";


// custom shader material
const WaterGradientMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uSpeed: 0.05,
    uNoiseDensity: 1.2,
    uNoiseStrength: 1.4,
    uColor: ["#e23a66", "#2287ba", "#f09878"].map(
      (color) => new THREE.Color(color)
    ),
    uLightness: 0.2,
  },
  vertex,
  fragment
);

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
WaterGradientMaterial.key = THREE.MathUtils.generateUUID();

extend({ WaterGradientMaterial });


// shader material combined with mesh
const TextureBg = (props: Mesh) => {
  const { viewport, size } = useThree()
  //const waterBgStore = useCreateStore();
  const { scale, morph } = useControls({
    scale: { value: 1.0, min: 0.1, max: 3 },
    morph: { value: 1.52, min: 0.2, max: 3 },
  }, { storeId: 'water-gradient' });

  const colors = useControls({
    colors: folder({
      color1: '#0888B8',
      color2: '#0870A8',
      color3: '#f09878',
    })
  }, { storeId: 'water-gradient' });

  const animation = useControls({
    animation: folder({
      speed: { value: 3, min: 0.1, max: 10 },
    }, { collapsed: false })
  }, { storeId: 'water-gradient' });

  const advanced = useControls({
    advanced: folder({
      density: { value: 1.32, min: 0.1, max: 3 },
      lightness: { value: 0.2, min: -1, max: 1 },
    }, { collapsed: false })
  }, { storeId: 'water-gradient' });



  //设置状态
  const [isDarkMode, setIsDarkMode] = useState(true)
  // 监听与设置
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    setIsDarkMode(darkModeMediaQuery.matches)
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }
    darkModeMediaQuery.addEventListener('change', handleMediaQueryChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleMediaQueryChange)
  }, [])
  // 被改变的状态
  console.log(isDarkMode)

  // set ref
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // set palettes
  const paletteLight = ["#0888B8", "#0870A8", "#f09878"].map((color) => new THREE.Color(color))
  const paletteDark = [colors.color1, colors.color2, colors.color3].map((color) => new THREE.Color(color))

  // animation
  useFrame(({ clock }) => {
    const a = clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = a * 10
      materialRef.current.uniforms.uColor.value = paletteDark


      // changed via light/dark mode
      // if (isDarkMode) {
      //   materialRef.current.uniforms.uColor.value = paletteDark
      // } else materialRef.current.uniforms.uColor.value = paletteLight
    }
  })

  return (
    <mesh
      ref={meshRef}
      scale={scale + 1.37}
    // {...props}
    >
      <planeBufferGeometry args={[10, 10, 192, 192]} />
      {/* @ts-ignore */}
      <waterGradientMaterial key={WaterGradientMaterial.key} ref={materialRef} uResolution={new THREE.Vector2(viewport.width, viewport.height)} uLightness={advanced.lightness} uSpeed={animation.speed * 0.01} uNoiseDensity={advanced.density} uNoiseStrength={morph} />

    </mesh>
  );
};

export default TextureBg;
