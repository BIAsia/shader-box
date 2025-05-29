import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useControls, folder, useCreateStore, button } from 'leva'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'

import vertex from "./silk.vert";
import fragment from "./silk.frag";


// custom shader material
const SilkMaterial = shaderMaterial(
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
SilkMaterial.key = THREE.MathUtils.generateUUID();

extend({ SilkMaterial });


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

  const exportConfig = button(() => {
    const config = {
      animation,
      color,
      shape
    };
    const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const configUrl = URL.createObjectURL(configBlob);
    const link = document.createElement('a');
    link.setAttribute('download', 'config.json');
    link.setAttribute('href', configUrl);
    link.click();
  });

  const importConfig = button(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      updateConfig(importedConfig);
    };

    input.click();
  });

  const updateConfig = (config) => {
    Object.keys(config).forEach(key => {
      window[key] = config[key]; // 把配置更新到全局变量上
      animation.speed = 4.0;
      console.log(animation.speed)
    });
  };

  const exportButton = useControls({
    'Export Config': exportConfig,
    // 'Import Config': importConfig
  });
  //const waterBgStore = useCreateStore();
  const animation = useControls({
    animation: folder({
      speed: { value: 1, min: 0., max: 10, onChange: (v) => { config.animation.speed = v }, transient: false },
      timeOffset: { value: 0, min: 0., max: 10, onChange: (v) => { config.animation.timeOffset = v }, transient: false }
    }, { collapsed: false })
  });

  const color = useControls({
    color: folder({
      color1: { value: '#404a70', onChange: (v) => { config.color.color1 = v }, transient: false },
      color2: { value: '#8d99ae', onChange: (v) => { config.color.color2 = v }, transient: false },
      color3: { value: '#2b2d42', onChange: (v) => { config.color.color3 = v }, transient: false },
      color4: { value: '#2b2d42', onChange: (v) => { config.color.color4 = v }, transient: false },
      bgColor: { value: '#000000', onChange: (v) => { config.color.bgColor = v }, transient: false },
      lightness: { value: 0., min: - 1, max: 1, onChange: (v) => { config.color.lightness = v }, transient: false }
    })
  });

  const shape = useControls({
    shape: folder({
      position: { value: { x: 0, y: 0 }, step: 0.01, onChange: (v) => { config.shape.position = v }, transient: false },
      scaleX: { value: 1.0, min: 0.1, max: 10, onChange: (v) => { config.shape.scaleX = v }, transient: false },
      scaleY: { value: 1.0, min: 0.1, max: 10, onChange: (v) => { config.shape.scaleY = v }, transient: false },
      // rotate: { value: 0, min: 0, max: 360, onChange: (v) => { config.shape.rotate = v }, transient: false },
      complex: { value: 1, min: 1, max: 20, step: 1, onChange: (v) => { config.shape.complex = v }, transient: false },
      morph: { value: 0., min: -1, max: 1, onChange: (v) => { config.shape.morph = v }, transient: false },
    })
  });

  let config = {
    animation: {
      speed: animation.speed,
      timeOffset: animation.timeOffset
    },
    color: {
      color1: color.color1,
      color2: color.color2,
      color3: color.color3,
      color4: color.color4,
      bgColor: color.bgColor,
      lightness: color.lightness
    },
    shape: {
      position: shape.position,
      scaleX: shape.scaleX,
      scaleY: shape.scaleY,
      // rotate: shape.rotate,
      complex: shape.complex,
      morph: shape.morph
    }
  }





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
  const paletteDark = [color.color1, color.color2, color.color3].map((color) => new THREE.Color(color))

  // animation
  useFrame(({ clock }) => {
    const a = clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = a * 10
    }
  })

  return (
    <mesh
      ref={meshRef}
    // {...props}
    >
      <planeBufferGeometry args={[viewport.width * 2, viewport.height * 2, 100, 100]} />
      {/* @ts-ignore */}
      <silkMaterial
        key={SilkMaterial.key}
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
    </mesh>
  );
};

export default SharpGradientBg;
