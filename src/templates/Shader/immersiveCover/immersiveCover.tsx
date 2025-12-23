import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useEffect } from "react";
import { shaderMaterial, useTexture, Html } from "@react-three/drei";
import { createShaderControls } from "../ShaderControl";

import vertex from "./immersiveCover.vert";
import fragment from "./immersiveCover.frag";

const ImmersiveCoverMaterial = shaderMaterial(
    {
        uResolution: new THREE.Vector2(0, 0),
        uTime: 0,
        uImgPosition: new THREE.Vector2(0, 0),
        uImgSize: new THREE.Vector2(0, 0),
        uTexture: new THREE.Texture(),
        uTop: 0.08,
        uScaleContent: 1.1,
        uTopBlur: 100,
        uTopBlurRange: 0.02,
        uBottomBlur: 100,
        uBottomBlurRange: 0.45,
        uRepeats: 30,
        uTopGradientRange: 0.16,
        uBottomGradientRange: 0.5,
        uColor1: new THREE.Color(1, 1, 1),
        uColor2: new THREE.Color(0, 0, 0),
        uColor3: new THREE.Color(0, 0, 0),
    },
    vertex,
    fragment
);

ImmersiveCoverMaterial.key = THREE.MathUtils.generateUUID();
extend({ ImmersiveCoverMaterial });

declare module '@react-three/fiber' {
    interface ThreeElements {
        immersiveCoverMaterial: JSX.IntrinsicElements['shaderMaterial'] & { key: string }
    }
}

export const useImmersiveCoverControls = createShaderControls(
    ['immersive'],
    {
        shaderId: 'immersiveCover',
        immersive: {
            uTop: 0.08,
            uScaleContent: 1.1,
            uTopBlur: 100,
            uTopBlurRange: 0.16,
            uBottomBlur: 100,
            uBottomBlurRange: 0.45,
            uTopGradientRange: 0.16,
            uBottomGradientRange: 0.68,
            uColor1: '#ffffff',
            uColor2: '#000000',
            uColor3: '#000000',
        }
    },
    { showAIGenerate: false }
);

// Function to convert image URL to base64
const getImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result as string;
                resolve(base64Image);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
};

interface ColorResponse {
    topColor: string;
    bottomColor: string;
}

// Extract colors from image using our API
const extractColors = async (imageUrl: string): Promise<ColorResponse> => {
    try {
        const base64Image = await getImageAsBase64(imageUrl);

        const response = await fetch('/api/analyze-colors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
                type: 'immersive'
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze image');
        }

        if (!data.topColor || !data.bottomColor) {
            throw new Error('Invalid color data received from API');
        }

        return {
            topColor: data.topColor,
            bottomColor: data.bottomColor
        };
    } catch (error) {
        console.error('Error extracting colors:', error);
        return { topColor: '#ffffff', bottomColor: '#000000' };
    }
};

import { converter, formatHex, oklch } from 'culori';

const generateSecondaryColor = (hexColor: string) => {
    const oklchConverter = converter('oklch');
    const colorC = oklchConverter(hexColor);
    if (!colorC) return hexColor;

    // Hue - 21
    if (colorC.h !== undefined) {
        colorC.h = colorC.h - 21;
    }
    // Relative chroma - 10%
    if (colorC.c !== undefined) {
        colorC.c = colorC.c * 0.9;
    }

    return formatHex(colorC);
}


const ImmersiveCover = ({
    imageUrl = '/img/Background.png',
}) => {
    const { viewport } = useThree();
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const texture = useTexture(imageUrl);
    const [isLoading, setIsLoading] = React.useState(false);
    const previousImageUrlRef = useRef<string>(imageUrl);

    const {
        immersive: { uTop, uScaleContent, uTopBlur, uTopBlurRange, uBottomBlur, uBottomBlurRange, uTopGradientRange, uBottomGradientRange, uColor1, uColor2, uColor3 },
        updateConfig
    } = useImmersiveCoverControls();

    useEffect(() => {
        const handleColorExtraction = async () => {
            // Basic implementation to avoid complexity with first render
            // If imageUrl changes, or if it is the first time (dominantColor is default)
            const isInitialLoad = uColor1 === '#ffffff' && uColor2 === '#000000' && !isLoading;
            if (imageUrl !== previousImageUrlRef.current || isInitialLoad) {
                previousImageUrlRef.current = imageUrl;
                setIsLoading(true);
                try {
                    const { topColor, bottomColor } = await extractColors(imageUrl);
                    const secondaryBottom = generateSecondaryColor(bottomColor);

                    updateConfig({
                        immersive: {
                            uTop,
                            uScaleContent,
                            uTopBlur,
                            uTopBlurRange,
                            uBottomBlur,
                            uBottomBlurRange,
                            uTopGradientRange,
                            uBottomGradientRange,
                            uColor1: topColor,
                            uColor2: bottomColor,
                            uColor3: secondaryBottom
                        }
                    });
                } catch (error) {
                    console.error('Failed to extract color:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        handleColorExtraction();
    }, [imageUrl]);


    useFrame((state, delta) => {
        if (materialRef.current && texture) {
            materialRef.current.uniforms.uTime.value += delta;

            const viewportWidth = viewport.width;
            const viewportHeight = viewport.height;
            materialRef.current.uniforms.uResolution.value.set(viewportWidth, viewportHeight);

            const imageAspectRatio = texture.image.width / texture.image.height;
            const viewportAspectRatio = viewportWidth / viewportHeight;

            // Base width is usually the whole viewport if we      // Calculate image size in screen UV space (0 to 1)
            // uScaleContent = 1.1 means image is 1.1 times the view width
            const imgWidthUV = uScaleContent;
            const imgHeightUV = imgWidthUV * viewportAspectRatio / imageAspectRatio;

            const imgSize = new THREE.Vector2(imgWidthUV, imgHeightUV);

            // imgPosition is the BOTTOM-LEFT of the image in screen UV space (since uv.y is now 0-1 from bottom to top)
            // Horizontal centering
            // uTop is offset from top: edgeTop = 1.0 - uTop. So bottomEdge = 1.0 - uTop - imgHeightUV
            const imgPos = new THREE.Vector2(
                (1.0 - imgWidthUV) / 2,
                1.0 - uTop - imgHeightUV
            );

            materialRef.current.uniforms.uImgPosition.value.copy(imgPos);
            materialRef.current.uniforms.uImgSize.value.copy(imgSize);
            materialRef.current.uniforms.uTexture.value = texture;

            // Blur parameters
            materialRef.current.uniforms.uTopBlur.value = uTopBlur;
            materialRef.current.uniforms.uTopBlurRange.value = uTopBlurRange;
            materialRef.current.uniforms.uBottomBlur.value = uBottomBlur;
            materialRef.current.uniforms.uBottomBlurRange.value = uBottomBlurRange;
            materialRef.current.uniforms.uRepeats.value = 30; // Quality

            materialRef.current.uniforms.uTopGradientRange.value = uTopGradientRange;
            materialRef.current.uniforms.uBottomGradientRange.value = uBottomGradientRange;
            materialRef.current.uniforms.uColor1.value.set(uColor1).convertLinearToSRGB();
            materialRef.current.uniforms.uColor2.value.set(uColor2).convertLinearToSRGB();
            materialRef.current.uniforms.uColor3.value.set(uColor3).convertLinearToSRGB();
        }
    });

    return (
        <mesh>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <immersiveCoverMaterial
                key={ImmersiveCoverMaterial.key}
                ref={materialRef}
                transparent={true}
            />
            {isLoading && (
                <>
                    {/* Black overlay */}
                    <mesh position={[0, 0, 1]}>
                        <planeGeometry args={[viewport.width, viewport.height]} />
                        <meshBasicMaterial color="black" transparent opacity={0.8} />
                    </mesh>

                    {/* Loading text */}
                    <Html center position={[0, 0.4, 2]}>
                        <div style={{
                            color: 'white',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            fontWeight: '500',
                            textAlign: 'center',
                            userSelect: 'none',
                            pointerEvents: 'none'
                        }}>
                            Analyzing color...
                        </div>
                    </Html>
                </>
            )}
        </mesh>
    );
};

export default ImmersiveCover;
