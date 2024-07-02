import * as THREE from 'three'
import { useFrame, extend, useThree } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { Mesh } from 'three'
import { easing } from 'maath'
import { useControls, Leva, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from './circleShader.vert'
import fragment from './circleShader.frag'



// custom shader material
const CircleGlitchMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uSpeed: 1.,
    uTimeOffset: 0.0,
    uLightness: 0.,
    uPosition: new THREE.Vector2(0.0, 0.0),
    uScale: new THREE.Vector2(1.0, 1.0),
    uRotate: 0.,
    uColor: ["#ef233c", "#8d99ae", "#2b2d42", "#000000"].map(
      (color) => new THREE.Color(color)
    ),
    uBgColor: new THREE.Color('#000000'),
    uComplex: 1,
    uMorph: 0.0,
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
  // const circleBgStore = useCreateStore();
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
  const animation = useControls({
    animation: folder({
      speed: { value: 1, min: 0., max: 10 },
      timeOffset: { value: 0, min: 0., max: 10 },
    }, { collapsed: false })
  });

  const color = useControls({
    color: folder({
      color1: '#ef233c',
      color2: '#8d99ae',
      color3: '#2b2d42',
      color4: '#000000',
      bgColor: '#000000',
      lightness: { value: 0., min: - 1, max: 1 },
    })
  });

  const shape = useControls({
    shape: folder({
      position: { value: { x: 0, y: 0 }, step: 0.01 },
      scaleX: { value: 1.0, min: 0.1, max: 10 },
      scaleY: { value: 1.0, min: 0.1, max: 10 },
      // rotate: { value: 0, min: 0, max: 360 },
      complex: { value: 1, min: 1, max: 20, step: 1 },
      morph: { value: 0., min: -1, max: 1 },
    })
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
  // const paletteLight = ["#FFF8DD", "#F9D4AB", "#FBD9E1", "#FFFFFF"].map((color) => new THREE.Color(color))
  // const paletteDark = [colors.color1, colors.color2, colors.color3, colors.colorbg].map((color) => new THREE.Color(color))

  // animation
  useFrame((state, delta) => {


    //const a = state.clock.getElapsedTime()
    if (materialRef.current) {
      // materialRef.current.uniforms.uScale.value = scale;
      // materialRef.current.uniforms.uSpeed.value = animation.speed;
      // materialRef.current.uniforms.uStrength.value = animation.strength;
      // materialRef.current.uniforms.uWidth.value = morph;
      // materialRef.current.uniforms.uRoot.value = new THREE.Vector2(position.x, position.y);
      materialRef.current.uniforms.uTime.value += delta * 10.
      //materialRef.current.uniforms.uMouse.value = state.pointer

      // easing.damp2(materialRef.current.uniforms.uMouse.value, state.pointer, 0.3, delta * 0.5)
      //materialRef.current.uniforms.uTime.value = a * 10
      // materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height)
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
    //scale={props.scale}
    // onPointerMove={(e) => console.log('move')}
    // {...props}
    >
      <planeBufferGeometry args={[viewport.width, viewport.height]} />
      {/* @ts-ignore */}
      <circleGlitchMaterial
        key={CircleGlitchMaterial.key}
        ref={materialRef}
        uSpeed={animation.speed}
        uTimeOffset={animation.timeOffset}
        uLightness={color.lightness}
        uPosition={new THREE.Vector2(shape.position.x, shape.position.y)}
        uScale={new THREE.Vector2(shape.scaleX, shape.scaleY)}
        // uRotate={shape.rotate}
        uColor={[color.color1, color.color2, color.color3, color.color4].map((color) => new THREE.Color(color))}
        uBgColor={color.bgColor}
        uComplex={shape.complex}
        uMorph={shape.morph}
        uResolution={new THREE.Vector2(viewport.width, viewport.height)}
      />
      {/* <EffectComposer disableNormalPass multisampling={0}>
        {noisy && <Noise premultiply blendFunction={BlendFunction.ADD} />}
      </EffectComposer> */}
      {/* <meshNormalMaterial /> */}

    </mesh>
  )
}

export default CircleBg