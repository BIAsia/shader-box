import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { easing } from 'maath'
import { useControls, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from "./shinyCircle.vert";
import fragment from "./shinyCircle.frag";



// custom shader material
const ShinyCircleMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uMouse: new THREE.Vector2(),
    uSpeed: 0.05,
    uScale: 1.0,
    uNoiseDensity: 1.2,
    uNoiseStrength: 1.4,
    uColor: ["#e23a66", "#2287ba", "#f09878", "#000"].map(
      (color) => new THREE.Color(color)
    ),
    uLightness: 0.2,
    uRoot: new THREE.Vector2(0, 0),
    uMorph: 3.,
  },
  vertex,
  fragment
);

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
ShinyCircleMaterial.key = THREE.MathUtils.generateUUID();

extend({ ShinyCircleMaterial });


// shader material combined with mesh
const ShinyCircleBg = (props: Mesh) => {
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
    scale: { value: 0.65, min: 0.1, max: 3 },
    morph: { value: 1.47, min: 0.2, max: 3 },
    position: { value: { x: 0, y: 0 }, step: 0.5, },
    noisy: true,
  });

  const colors = useControls({
    colors: folder({
      color1: '#1044be',
      color2: '#789ede',
      color3: '#2b2d42',
      colorbg: '#000'
    })
  });

  const animation = useControls({
    animation: folder({
      speed: { value: 3, min: 0.1, max: 3 },
    }, { collapsed: false })
  });

  const advanced = useControls({
    advanced: folder({
      density: { value: 1.32, min: 0.1, max: 3 },
      lightness: { value: 0.2, min: -1, max: 1 },
    }, { collapsed: false })
  });



  const { viewport, size } = useThree()
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
  const paletteDark = ["#ef233c", "#8d99ae", "#2b2d42"].map((color) => new THREE.Color(color))

  // animation
  useFrame((state, delta) => {

    //const a = state.clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * 10.
      //materialRef.current.uniforms.uMouse.value = state.pointer;

      easing.damp2(materialRef.current.uniforms.uMouse.value, state.pointer, 0.3, delta * 0.5)
      //materialRef.current.uniforms.uTime.value = a * 10
      materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height)

      // changed via light/dark mode
      // if (isDarkMode) {
      //   materialRef.current.uniforms.uColor.value = paletteDark
      // } else materialRef.current.uniforms.uColor.value = paletteLight
    }


  })

  return (
    <mesh
      ref={meshRef}
      onPointerMove={(e) => console.log('move')}
    // {...props}
    >
      <planeBufferGeometry args={[viewport.width, viewport.height]} />
      {/* @ts-ignore */}
      <shinyCircleMaterial key={ShinyCircleMaterial.key} uLightness={advanced.lightness} uMorph={morph} uRoot={new THREE.Vector2(position.x, position.y)} uScale={scale} ref={materialRef} uColor={[colors.color1, colors.color2, colors.color3, colors.colorbg].map(
        (color) => new THREE.Color(color)
      )} />
      <EffectComposer disableNormalPass multisampling={0}>
        {noisy && <Noise premultiply blendFunction={BlendFunction.ADD} />}
      </EffectComposer>
      {/* <meshNormalMaterial /> */}

    </mesh>
  );
};

export default ShinyCircleBg;
