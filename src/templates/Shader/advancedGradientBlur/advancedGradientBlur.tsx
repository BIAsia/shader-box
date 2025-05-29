import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useState, useEffect } from "react";
import { shaderMaterial, useTexture, Html } from "@react-three/drei";
import { createShaderControls } from "../ShaderControl";

// Import your existing shaders
import vertex from "./advancedGradientBlur.vert";
import fragment from "./advancedGradientBlur.frag";

// Define the blur material with your shader parameters
const BlurMaterial = shaderMaterial(
  {
    uResolution: new THREE.Vector2(0, 0),
    uTime: 0,
    uImgPosition: new THREE.Vector2(0, 0),
    uImgSize: new THREE.Vector2(0, 0),
    uTexture: new THREE.Texture(),
    // Blur 相关参数
    uDirection: new THREE.Vector2(0, 1), // 默认向上模糊
    uStartPoint: 0.,
    uEndPoint: 1.,
    uAmount: 30,
    uRepeats: 30,
    uGradientColor: new THREE.Color(0xB8E0F8),
  },
  vertex,
  fragment
);

// Generate a unique key for HMR
BlurMaterial.key = THREE.MathUtils.generateUUID();

// Extend for use with react-three-fiber
extend({ BlurMaterial });

// Type declaration for TypeScript
declare module '@react-three/fiber' {
  interface ThreeElements {
    blurMaterial: JSX.IntrinsicElements['shaderMaterial'] & { key: string }
  }
}

export const useAdvancedGradientBlurControls = createShaderControls([], {}, { showAIGenerate: false });

// 方向映射函数
const getDirectionVector = (direction: string): THREE.Vector2 => {
  switch (direction) {
    case 'horizontal': return new THREE.Vector2(1, 0);
    case 'vertical': return new THREE.Vector2(0, 1);
    default: return new THREE.Vector2(0, 1); // 默认为垂直方向
  }
};

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

// Extract dominant color from image using our API
const extractDominantColor = async (imageUrl: string): Promise<string> => {
  try {
    const base64Image = await getImageAsBase64(imageUrl);
    console.log('Image loaded, size:', base64Image.length);

    const response = await fetch('/api/analyze-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', data);
      throw new Error(data.error || 'Failed to analyze image');
    }

    if (!data.mainColor || !Array.isArray(data.derivativeColors)) {
      throw new Error('Invalid color data received from API');
    }

    console.log('Extracted colors:', data);
    return data.mainColor;
  } catch (error) {
    console.error('Error extracting dominant color:', error);
    return '#000000'; // Default color in case of error
  }
};

// The shader component
const AdvancedGradientBlurImage = ({
  imageUrl = '/img/Background.png',
  position = [0, 0],
  size = [1, 1],
  useExtractedColor = true,
}) => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [extractedColor, setExtractedColor] = useState<string>('#B8E0F8');
  const previousImageUrlRef = useRef<string>(imageUrl);
  const colorRef = useRef<string>(extractedColor);
  const [isLoading, setIsLoading] = useState(false);

  const {
    blur: { direction, startPoint, endPoint, amount, quality },
    gradient: { hasGradient, gradientColor }
  } = useAdvancedGradientBlurControls();

  // Load the texture using drei's useTexture hook
  const texture = useTexture(imageUrl);

  // Extract dominant color only when imageUrl changes
  useEffect(() => {
    const handleColorExtraction = async () => {
      if (useExtractedColor && imageUrl !== previousImageUrlRef.current) {
        previousImageUrlRef.current = imageUrl;
        setIsLoading(true);
        try {
          const color = await extractDominantColor(imageUrl);
          console.log('New color extracted:', color);
          setExtractedColor(color);
          colorRef.current = color;
        } catch (error) {
          console.error('Failed to extract color:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleColorExtraction();
  }, [imageUrl]);

  // Update material color when extractedColor changes
  useEffect(() => {
    if (materialRef.current && extractedColor !== colorRef.current) {
      console.log('Updating shader color to:', extractedColor);
      materialRef.current.uniforms.uGradientColor.value = new THREE.Color(extractedColor);
      colorRef.current = extractedColor;
    }
  }, [extractedColor]);

  // Animation frame update
  useFrame((state, delta) => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height);

      materialRef.current.uniforms.uImgPosition.value = new THREE.Vector2(
        position[0],
        position[1]
      );
      const imageAspectRatio = texture.image.width / texture.image.height;
      const viewportAspectRatio = viewport.width / viewport.height;

      size[1] = viewportAspectRatio / imageAspectRatio;
      materialRef.current.uniforms.uImgSize.value = new THREE.Vector2(
        size[0],
        size[1]
      );
      materialRef.current.uniforms.uTexture.value = texture;

      // Ensure color is always in sync
      const finalColor = useExtractedColor ? extractedColor : gradientColor;
      const currentGradientColor = materialRef.current.uniforms.uGradientColor?.value;

      // Only update if we have a valid current color and the new color is different
      if (currentGradientColor && typeof finalColor === 'string') {
        try {
          const currentHex = currentGradientColor.getHexString();
          const newHex = finalColor.replace('#', '');
          if (currentHex !== newHex) {
            console.log('Syncing shader color in animation frame:', finalColor);
            materialRef.current.uniforms.uGradientColor.value = new THREE.Color(finalColor);
          }
        } catch (error) {
          console.error('Error comparing colors:', error);
        }
      }
    }
  });

  // Use extracted color if available and enabled, otherwise use the gradient color from controls
  const finalGradientColor = useExtractedColor ? extractedColor : gradientColor;

  return (
    <>
      <mesh ref={meshRef}>
        <planeGeometry args={[viewport.width, viewport.height, 100, 100]} />
        <blurMaterial
          key={BlurMaterial.key}
          ref={materialRef}
          transparent={true}
          /* @ts-ignore */
          uDirection={getDirectionVector(direction)}
          uStartPoint={startPoint}
          uEndPoint={endPoint}
          uAmount={amount}
          uRepeats={quality}
          uGradientColor={new THREE.Color(finalGradientColor)}
        />
      </mesh>

      {isLoading && (
        <>
          {/* Black overlay */}
          <mesh position={[0, 0, 1]}>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <meshBasicMaterial color="black" transparent opacity={0.5} />
          </mesh>

          {/* Loading text */}
          <Html center position={[0, 0, 2]}>
            <div style={{
              color: 'white',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              userSelect: 'none',
              pointerEvents: 'none'
            }}>
              Analyzing image colors...
            </div>
          </Html>
        </>
      )}
    </>
  );
};

export default AdvancedGradientBlurImage;
