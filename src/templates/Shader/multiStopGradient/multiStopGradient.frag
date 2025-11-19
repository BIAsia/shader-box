precision highp float;

varying vec3 vPos;
varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPosition;
uniform vec2 uScale;
uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uSpeed;
uniform float uLightness;
uniform float uComplex;
uniform float uMorph;

// Multi-stop gradient locations (hardcoded)
#define STOP_0 0.0
#define STOP_1 0.182692
#define STOP_2 0.308654
#define STOP_3 0.865385
#define STOP_4 1.0

// OKLAB color space conversion for better gradients
// Correct implementation with linear RGB conversion

// sRGB to Linear RGB conversion
float sRGBComponentToLinear(float component) {
    if(component <= 0.04045) {
        return component / 12.92;
    } else {
        return pow((component + 0.055) / 1.055, 2.4);
    }
}

vec3 sRGBToLinear(vec3 sRGB) {
    return vec3(sRGBComponentToLinear(sRGB.x), sRGBComponentToLinear(sRGB.y), sRGBComponentToLinear(sRGB.z));
}

// Linear RGB to OKLAB conversion
vec3 linearToOKLAB(vec3 linear) {
    float l = 0.4122214708 * linear.x + 0.5363325363 * linear.y + 0.0514459929 * linear.z;
    float m = 0.2119034982 * linear.x + 0.6806995451 * linear.y + 0.1073969566 * linear.z;
    float s = 0.0883024619 * linear.x + 0.2817188376 * linear.y + 0.6299787005 * linear.z;

    float l_ = pow(l, 1.0 / 3.0);
    float m_ = pow(m, 1.0 / 3.0);
    float s_ = pow(s, 1.0 / 3.0);

    return vec3(0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_, 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_);
}

// Linear RGB to sRGB conversion
float linearComponentTosRGB(float component) {
    if(component <= 0.0031308) {
        return 12.92 * component;
    } else {
        return 1.055 * pow(component, 1.0 / 2.4) - 0.055;
    }
}

vec3 linearTosRGB(vec3 linear) {
    return vec3(linearComponentTosRGB(linear.x), linearComponentTosRGB(linear.y), linearComponentTosRGB(linear.z));
}

// OKLAB to Linear RGB conversion
vec3 oklabToLinear(vec3 oklab) {
    float l_ = oklab.x + 0.3963377774 * oklab.y + 0.2158037573 * oklab.z;
    float m_ = oklab.x - 0.1055613458 * oklab.y - 0.0638541728 * oklab.z;
    float s_ = oklab.x - 0.0894841775 * oklab.y - 1.2914855480 * oklab.z;

    float l = l_ * l_ * l_;
    float m = m_ * m_ * m_;
    float s = s_ * s_ * s_;

    return vec3(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

// Combined sRGB to OKLAB
vec3 sRGBToOKLAB(vec3 sRGB) {
    return linearToOKLAB(sRGBToLinear(sRGB));
}

// Combined OKLAB to sRGB
vec3 oklabTosRGB(vec3 oklab) {
    return linearTosRGB(oklabToLinear(oklab));
}

// Smooth color mixing in OKLAB space
vec3 mixColorsOKLAB(vec3 color1, vec3 color2, float t) {
    // Adjustable mixing curve - closer to 0.0 is more linear, closer to 1.0 is more smooth
    const float SMOOTHNESS_FACTOR = 0.;

    float adjustedT = mix(t, smoothstep(0.0, 1.0, t), SMOOTHNESS_FACTOR);
    return mix(color1, color2, adjustedT);
}

// Simple noise function for wave effects
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i.x + i.y * 57.0);
    float b = hash(i.x + 1.0 + i.y * 57.0);
    float c = hash(i.x + (i.y + 1.0) * 57.0);
    float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    // Position calculation with scale
    vec2 position = vec2(vPos.x * 1. / (uScale.x), vPos.y * 1. / uScale.y);
    vec2 coord = position / uResolution.xy + vec2(0.5);

    // Time variable with speed control
    float t = uTime * uSpeed;

    // Calculate base gradient position (vertical gradient from bottom to top)
    // Apply position offset
    float gradientPos = coord.y + uPosition.y;

    // Clamp to ensure we stay within valid range
    gradientPos = clamp(gradientPos, 0.0, 1.0);

    // Convert colors to OKLAB for better interpolation
    vec3 oklab1 = sRGBToOKLAB(uColor[0]);
    vec3 oklab2 = sRGBToOKLAB(uColor[1]);
    vec3 oklab3 = sRGBToOKLAB(uColor[2]);
    vec3 oklab4 = sRGBToOKLAB(uColor[3]);
    vec3 oklabBg = sRGBToOKLAB(uBgColor);

    // Multi-stop gradient interpolation
    vec3 finalColor;

    if(gradientPos < STOP_1) {
        // Between stop 0 and stop 1
        float localT = (gradientPos - STOP_0) / (STOP_1 - STOP_0);
        finalColor = mixColorsOKLAB(oklab1, oklab2, localT);
    } else if(gradientPos < STOP_2) {
        // Between stop 1 and stop 2
        float localT = (gradientPos - STOP_1) / (STOP_2 - STOP_1);
        finalColor = mixColorsOKLAB(oklab2, oklab3, localT);
    } else if(gradientPos < STOP_3) {
        // Between stop 2 and stop 3
        float localT = (gradientPos - STOP_2) / (STOP_3 - STOP_2);
        finalColor = mixColorsOKLAB(oklab3, oklab4, localT);
    } else {
        // Between stop 3 and stop 4 (bgColor)
        float localT = (gradientPos - STOP_3) / (STOP_4 - STOP_3);
        finalColor = mixColorsOKLAB(oklab4, oklabBg, localT);
    }

    // Convert back to sRGB
    finalColor = oklabTosRGB(finalColor);

    // Apply subtle wave/noise distortion to the final color
    // This creates dynamic movement while preserving the base gradient
    float waveFreq = 3.0 + uComplex * 2.0;
    float waveAmp = 0.015 * (1.0 + uMorph * 2.0); // Small amplitude to maintain colors

    // Multiple wave layers for more organic movement
    float wave1 = sin(coord.x * waveFreq + t * 0.5) * waveAmp;
    float wave2 = sin(coord.x * waveFreq * 1.7 + t * 0.7 + 1.5) * waveAmp * 0.6;
    float wave3 = cos(coord.y * waveFreq * 0.8 - t * 0.3) * waveAmp * 0.4;

    // Add noise-based subtle variation
    float noiseVal = noise(vec2(coord.x * 2.0 + t * 0.2, coord.y * 2.0 - t * 0.15)) * waveAmp * 0.5;

    // Combine all wave effects
    float totalWave = wave1 + wave2 + wave3 + noiseVal;

    // Apply wave effect as a subtle lightness variation
    // This creates movement without changing the base colors significantly
    finalColor = finalColor + vec3(totalWave);

    // Clamp to valid color range
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply lightness adjustment
    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1.0), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0.0), -uLightness);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
