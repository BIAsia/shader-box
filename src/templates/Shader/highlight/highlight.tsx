import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useControls, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from "./highlight.vert";
import fragment from "./highlight.frag";


// custom shader material
const HighlightMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uSpeed: 0.05,
    uColor: ["#e23a66", "#2287ba", "#f09878", "#000000"].map(
      (color) => new THREE.Color(color)
    ),
    uLightness: 0.,
    uPos: new THREE.Vector2(0.0, 0.0),
    // uEffect: 0.9,
    // uMorph: 1.54,
    // uDirection: new THREE.Vector2(1, 1),
    uCol: 25,
    uColorCol: 0.5,
    uHue: 148,
    uHasParticle: true,
    uParticleSize: 1,
    uParticlePos: new THREE.Vector2(0.0, 0.0),
    uIsPolar: false
  },
  vertex,
  fragment
);

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
HighlightMaterial.key = THREE.MathUtils.generateUUID();

extend({ HighlightMaterial });


// shader material combined with mesh
const SharpGradientBg = (props: Mesh) => {
  const { viewport, size } = useThree()
  const gl = useThree((state) => state.gl)
  const exportActions = useControls({
    'Capture Image': button(() => {
      const link = document.createElement('a')
      link.setAttribute('download', 'canvas.png')
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
      link.click()
    })
  });
  //const waterBgStore = useCreateStore();
  const { scale, position, noisy } = useControls({
    scale: { value: 1.0, min: 0.1, max: 3 },
    position: { value: { x: 0, y: -1 } },
    noisy: true,
  });

  const colors = useControls({
    colors: folder({
      color1: '#000000',
      color2: '#45a8de',
      color3: '#2b2d42',
      color4: '#000000',
      hue: { value: 148, min: 0.0, max: 360.0 },
      lightness: { value: 0., min: - 1, max: 1 },
      isPolar: { value: false },
    })
  });

  const animation = useControls({
    animation: folder({
      speed: { value: 1, min: 0.1, max: 10 },
    }, { collapsed: false })
  });

  const advanced = useControls({
    advanced: folder({
      columns: { value: 4, min: 1, max: 10, step: 1 },
      colorCol: { value: 0.5, min: 0, max: 2, step: 0.01 },
      hasParticle: { value: 1., min: 0, max: 1, step: 0.1 },
      particlePos: { value: { x: 0., y: 0. }, step: 0.1 },
      particleSize: { value: 1, min: 0, max: 10 },
    }, { collapsed: false })
  });





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
      // materialRef.current.uniforms.uColor.value = paletteDark


      // changed via light/dark mode
      // if (isDarkMode) {
      //   materialRef.current.uniforms.uColor.value = paletteDark
      // } else materialRef.current.uniforms.uColor.value = paletteLight
    }
  })

  return (
    <mesh
      ref={meshRef}
      scale={scale}
    // {...props}
    >
      <planeBufferGeometry args={[viewport.width, viewport.height, 1, 1]} />
      {/* @ts-ignore */}
      <highlightMaterial key={HighlightMaterial.key} ref={materialRef} uColor={[colors.color1, colors.color2, colors.color3, colors.color4].map((color) => new THREE.Color(color))} uResolution={new THREE.Vector2(viewport.width, viewport.height)} uLightness={colors.lightness} uSpeed={animation.speed} uPos={new THREE.Vector2(position.x, position.y)} uCol={advanced.columns} uHue={colors.hue} uHasParticle={advanced.hasParticle} uParticlePos={new THREE.Vector2(advanced.particlePos.x, advanced.particlePos.y)} uParticleSize={advanced.particleSize} uIsPolar={colors.isPolar} uColorCol={advanced.colorCol} />
      <EffectComposer disableNormalPass multisampling={0}>
        {noisy && <Noise premultiply blendFunction={BlendFunction.ADD} />}
      </EffectComposer>
    </mesh>
  );
};

export default SharpGradientBg;
