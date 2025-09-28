import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import { shaderMaterial } from "@react-three/drei";
import { Mesh } from "three";
import { useShaderControls } from "../ShaderControl";

import vertex from "./hexagonalGrid.vert";
import fragment from "./hexagonalGrid.frag";

// custom shader material
const HexagonalGridMaterial = shaderMaterial(
    {
        uResolution: new THREE.Vector2(0, 0),
        uTime: 0,
        uSpeed: 1.0,
        uLightness: 0.0,
        uPosition: new THREE.Vector2(0.0, 0.0),
        uScale: new THREE.Vector2(1.0, 1.0),
        uRotate: 0.0,
        uComplex: 1.0,
        uMorph: 0.0,
        uColor: ["#E65316", "#ACB6A9", "#1E3265", "#000000"].map(
            (color) => new THREE.Color(color)
        ),
        uBgColor: new THREE.Color('#000000'),
    },
    vertex,
    fragment
);

// This is the key that HMR will renew if this file is edited
// @ts-ignore
HexagonalGridMaterial.key = THREE.MathUtils.generateUUID();

extend({ HexagonalGridMaterial });

// shader material combined with mesh
const HexagonalGrid: React.FC = (props: Mesh) => {
    const { viewport } = useThree();

    // Use controls
    const {
        animation: { speed },
        color: { color1, color2, color3, color4, bgColor, lightness },
        shape: { position, scaleX, scaleY, complex, morph }
    } = useShaderControls();

    // set ref
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // animation
    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh
            ref={meshRef as React.RefObject<THREE.Mesh>}
        >
            <planeBufferGeometry args={[viewport.width, viewport.height, 1, 1]} />
            {/* @ts-ignore */}
            <hexagonalGridMaterial
                key={HexagonalGridMaterial.key}
                ref={materialRef}
                uSpeed={speed}
                uLightness={lightness}
                uPosition={new THREE.Vector2(position.x, position.y)}
                uScale={new THREE.Vector2(scaleX, scaleY)}
                uRotate={0}
                uComplex={complex}
                uMorph={morph}
                uColor={[color1, color2, color3, color4].map((color) => new THREE.Color(color))}
                uBgColor={new THREE.Color(bgColor)}
                uResolution={new THREE.Vector2(viewport.width, viewport.height)}
            />
        </mesh>
    );
};

export default HexagonalGrid;