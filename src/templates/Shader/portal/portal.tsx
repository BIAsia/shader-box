import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useControls, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from "./portal.vert";
import fragment from "./portal.frag";


// custom shader material
const PortalMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uSpeed: 0.05,
    uNoiseDensity: 1.2,
    uNoiseStrength: 1.4,
    uColor: ["#404a70", "#8d99ae", "#2b2d42", "#000000"].map(
      (color) => new THREE.Color(color)
    ),
    uLightness: 0.,
    uDensity: 25.,
    uPosEffect: new THREE.Vector2(1., 0.5),
    // uEffect: 0.9,
    // uMorph: 1.54,
    uDirection: new THREE.Vector2(1, 1),
    uCol: 25,
  },
  vertex,
  fragment
);

// This is the 🔑 that HMR will renew if this file is edited
// It works for THREE.ShaderMaterial as well as for drei/shaderMaterial
// @ts-ignore
PortalMaterial.key = THREE.MathUtils.generateUUID();

extend({ PortalMaterial });


// shader material combined with mesh
const SharpGradientBg = (props: Mesh) => {
  const { viewport, size, scene, camera } = useThree()
  const gl = useThree((state) => state.gl)
  const exportActions = useControls({
    'Capture Image': button(() => {
      // 请求在下一帧执行截图
      requestAnimationFrame(() => {
        gl.render(scene, camera);
        const link = document.createElement('a');
        link.setAttribute('download', 'canvas.png');
        link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
        link.click();
      });
    }),
  });
  //const waterBgStore = useCreateStore();
  const { scale, morph, effect, noisy } = useControls({
    scale: { value: 1.0, min: 0.1, max: 3 },
    morph: { value: 1.52, min: 0.2, max: 3.5 },
    effect: { value: { x: 1, y: 1 } },
    noisy: true,
  }, { storeId: 'water-gradient' });

  const colors = useControls({
    colors: folder({
      color1: '#ef233c',
      color2: '#8d99ae',
      color3: '#2b2d42',
      color4: '#000000',
    })
  }, { storeId: 'water-gradient' });

  const animation = useControls({
    animation: folder({
      speed: { value: 3, min: 0.1, max: 3 },
    }, { collapsed: false })
  }, { storeId: 'water-gradient' });

  const advanced = useControls({
    advanced: folder({
      columns: { value: 25, min: 1, max: 50 },
      lightness: { value: 0., min: - 1, max: 1 },
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
      <portalMaterial key={PortalMaterial.key} ref={materialRef} uColor={[colors.color1, colors.color2, colors.color3, colors.color4].map((color) => new THREE.Color(color))} uResolution={new THREE.Vector2(viewport.width, viewport.height)} uLightness={advanced.lightness} uSpeed={animation.speed} uDensity={advanced.density} uCol={advanced.columns} />
      <EffectComposer disableNormalPass multisampling={0}>
        {noisy && <Noise premultiply blendFunction={BlendFunction.ADD} />}
      </EffectComposer>
    </mesh>
  );
};

export default SharpGradientBg;
