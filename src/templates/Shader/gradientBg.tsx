import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useControls, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from "./glsl/gradientShader.vert";
import fragment from "./glsl/gradientShader.frag";


// custom shader material
const WaterGradientMaterial = shaderMaterial(
  {
    uTime: 0,
    uSpeed: 0.05,
    uNoiseDensity: 1.2,
    uNoiseStrength: 1.4,
    uColor: ["#e23a66", "#2287ba", "#f09878"].map(
      (color) => new THREE.Color(color)
    ),
    uLightness: 0.2,
    uChroma: 0.2,
    uPos: [0, 0]
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
const GradientBg = (props: Mesh) => {
  //const waterBgStore = useCreateStore();
  const gl = useThree((state) => state.gl)
  const exportActions = useControls({
    'Capture Image': button(() => {
      const link = document.createElement('a')
      link.setAttribute('download', 'canvas.png')
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
      link.click()
    })
  });
  const { scale, morph, position, noisy } = useControls({
    scale: { value: 0.65, min: -2, max: 3 },
    morph: { value: 4.2, min: 0.2, max: 3 },
    position: { value: [0, 0], min: [-10, -10], max: [10, 10], step: 1 },
    noisy: false,
  }, { storeId: 'water-gradient' });

  const colors = useControls({
    colors: folder({
      color1: '#0c9deb',
      color2: '#5383d5',
      color3: '#2b2d42',
    })
  }, { storeId: 'water-gradient' });

  const animation = useControls({
    animation: folder({
      speed: { value: 3, min: 0.1, max: 3 },
    }, { collapsed: false })
  }, { storeId: 'water-gradient' });

  const advanced = useControls({
    advanced: folder({
      density: { value: 1.32, min: 0.1, max: 3 },
      saturation: { value: 0.2, min: -1, max: 1 },
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
      <waterGradientMaterial key={WaterGradientMaterial.key} ref={materialRef} uLightness={advanced.lightness} uChroma={advanced.saturation} uSpeed={animation.speed * 0.01} uNoiseDensity={advanced.density} uNoiseStrength={morph} uPos={position} />
      <EffectComposer disableNormalPass multisampling={0}>
        {noisy && <Noise premultiply blendFunction={BlendFunction.ADD} />}
      </EffectComposer>
    </mesh>
  );
};

export default GradientBg;
