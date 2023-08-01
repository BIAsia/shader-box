import * as THREE from 'three'
import { useFrame, extend, useThree } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { Mesh } from 'three'
import { easing } from 'maath'
import { useControls, Leva, folder } from 'leva'

import vertex from './glsl/circleShader.vert'
import fragment from './glsl/circleShader.frag'



// custom shader material
const CircleGlitchMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uMouse: new THREE.Vector2(),
    uSpeed: 1.0,
    uNoiseDensity: 1.2,
    uNoiseStrength: 1.4,
    uColor: ["#FFF8DD", "#F9D4AB", "#FBD9E1", "#FFFFFF"].map(
      (color) => new THREE.Color(color)
    ),
    uScale: 1.0,
    uLightness: 0.2,
    uWidth: 4.2,
    uStrength: 1.0,
    uRoot: new THREE.Vector2(0, 0),
  },
  vertex,
  fragment
)

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
CircleGlitchMaterial.key = THREE.MathUtils.generateUUID()

extend({ CircleGlitchMaterial })

interface circleProps {
  scale: number
}

// shader material combined with mesh
const CircleBg = (props: Mesh) => {
  const { scale, position, morph } = useControls({
    scale: { value: 1.4, min: 0.1, max: 3 },
    position: { value: { x: 0, y: 0 }, step: 0.5, },
    morph: { value: 4.2, min: -10, max: 20 }
  });

  const colors = useControls({
    colors: folder({
      color1: '#ef233c',
      color2: '#8d99ae',
      color3: '#2b2d42',
      colorbg: '#000000'
    })
  });

  const animation = useControls({
    animation: folder({
      speed: { value: 1, min: 0.2, max: 3 },
      strength: { value: 1, min: 0.2, max: 3 },
    }, { collapsed: true })
  });


  const { viewport, size } = useThree()
  //设置状态
  const [isDarkMode, setIsDarkMode] = useState(true)
  // 监听与设置
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
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
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // set palettes
  const paletteLight = ["#FFF8DD", "#F9D4AB", "#FBD9E1", "#FFFFFF"].map((color) => new THREE.Color(color))
  const paletteDark = [colors.color1, colors.color2, colors.color3, colors.colorbg].map((color) => new THREE.Color(color))

  // animation
  useFrame((state, delta) => {


    //const a = state.clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uScale.value = scale;
      materialRef.current.uniforms.uSpeed.value = animation.speed;
      materialRef.current.uniforms.uStrength.value = animation.strength;
      materialRef.current.uniforms.uWidth.value = morph;
      materialRef.current.uniforms.uRoot.value = new THREE.Vector2(position.x, position.y);
      materialRef.current.uniforms.uTime.value += delta * 10.
      //materialRef.current.uniforms.uMouse.value = state.pointer

      easing.damp2(materialRef.current.uniforms.uMouse.value, state.pointer, 0.3, delta * 0.5)
      //materialRef.current.uniforms.uTime.value = a * 10
      materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height)

      // changed via light/dark mode
      if (isDarkMode) {
        materialRef.current.uniforms.uColor.value = paletteDark
      } else materialRef.current.uniforms.uColor.value = paletteLight
    }


  })

  return (
    <mesh
      ref={meshRef}
      //scale={props.scale}
      onPointerMove={(e) => console.log('move')}
    // {...props}
    >
      <planeBufferGeometry args={[viewport.width, viewport.height]} />
      {/* @ts-ignore */}
      <circleGlitchMaterial key={CircleGlitchMaterial.key} ref={materialRef} />
      {/* <meshNormalMaterial /> */}

    </mesh>
  )
}

export default CircleBg
