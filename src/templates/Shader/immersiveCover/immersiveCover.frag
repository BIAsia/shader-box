varying vec3 vPos;
uniform vec2 uResolution;
uniform vec2 uImgPosition;
uniform vec2 uImgSize;
uniform sampler2D uTexture;

// Blur uniforms
uniform float uTopBlur;
uniform float uTopBlurRange;
uniform float uBottomBlur;
uniform float uBottomBlurRange;
uniform float uRepeats;

// Gradient uniforms
uniform float uTopGradientRange;
uniform float uBottomGradientRange;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 blur(vec2 uv, sampler2D image, float blurAmount, float gradient) {
  vec3 blurredImage = vec3(0.0);
  float angleStep = 2.0 * 3.14159265 / uRepeats;

  for(float i = 0.; i < uRepeats; i++) {
    float angle = i * angleStep;
    float randVal1 = rand(vec2(i, uv.x + uv.y));
    vec2 offset1 = vec2(cos(angle), sin(angle)) * (randVal1 + blurAmount) * blurAmount * gradient;
    vec2 uv1 = uv + offset1;
    // Streak extension logic for sampling
    vec2 sampledUV = clamp(uv1, 0.0, 1.0);
    blurredImage += texture2D(image, sampledUV).rgb;
  }

  return blurredImage / uRepeats;
}

void main() {
  // Convert screen coordinates to 0.0 - 1.0 range (y: 0 at bottom, 1 at top)
  vec2 uv = vec2((vPos.x / uResolution.x) + 0.5, (vPos.y / uResolution.y) + 0.5);

  // Calculate UV within the image box
  vec2 textureUV = (uv - uImgPosition) / uImgSize;

  // Mask for central column
  float horizontalMask = step(0.0, textureUV.x) * step(textureUV.x, 1.0);

  // Image boundaries in screen UV
  float imageTop = uImgPosition.y + uImgSize.y;
  float imageBottom = uImgPosition.y;

  float gradient = 0.0;
  float blurAmount = 0.0;

  // Progressive blur logic:
  // For top area: blur is 0 at (1.0 - uTopBlurRange), increases towards y = 1.0
  float topBlurStart = 1.0 - uTopBlurRange;
  if (uv.y > topBlurStart) {
    gradient = clamp((uv.y - topBlurStart) / max(uTopBlurRange, 0.0001), 0.0, 1.0);
    blurAmount = 0.0008 * uTopBlur;
  } 
  
  // For bottom area: blur is 0 at uBottomBlurRange, increases towards y = 0.0
  float bottomBlurStart = uBottomBlurRange;
  if (uv.y < bottomBlurStart) {
    float bottomGradient = clamp((bottomBlurStart - uv.y) / max(bottomBlurStart, 0.0001), 0.0, 1.0);
    // Use the max of top and bottom gradients in case they overlap
    if (bottomGradient > gradient) {
       gradient = bottomGradient;
       blurAmount = 0.0008 * uBottomBlur;
    }
  }

  // Sample blurred texture
  vec3 color = blur(textureUV, uTexture, blurAmount, gradient);

  // --- Gradient Overlays ---

  // Top Gradient
  // Opacity 0 -> 1 from (1.0 - uTopGradientRange) to 1.0
  float topGradientMask = smoothstep(1.0 - uTopGradientRange, 1.0, uv.y);
  color = mix(color, uColor1, topGradientMask);

  // Bottom Gradient
  // Opacity 0 -> 1 -> 1
  // Color uColor2 -> uColor3 (or mixed)
  if (uv.y < uBottomGradientRange) {
      // Alpha transition: 0 at top of range, 1 at midpoint (50% of range), stays 1
      float bottomFadeHeight = uBottomGradientRange * 0.5;
      float bottomAlpha = clamp((uBottomGradientRange - uv.y) / bottomFadeHeight, 0.0, 1.0);
      
      // Color transition: uColor3 at top of range, uColor2 at bottom (y=0)
      // mix factor 0 = uColor2, 1 = uColor3
      float colorMixFactor = clamp(uv.y / uBottomGradientRange, 0.0, 1.0);
      vec3 gradientColor = mix(uColor3, uColor2, colorMixFactor);

      // Apply
      color = mix(color, gradientColor, bottomAlpha);
  }

  gl_FragColor = vec4(color.rgb * horizontalMask, 1.0);
}
