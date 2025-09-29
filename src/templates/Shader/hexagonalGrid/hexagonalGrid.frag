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
uniform float uRotate;
uniform float uMorph;
uniform float uComplex;
uniform float uLightness;

#define PI 3.14159265359

// Simple rounded hexagon SDF
float roundedHexSDF(vec2 p, float r, float roundness) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y) - roundness;
}

// Rotation function
vec2 rotate(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Adjusted rounded hexagon SDF - pointy top
float roundedHexSDFPointyTop(vec2 p, float r, float roundness) {
    p = rotate(p, PI / 6.0);
    return roundedHexSDF(p, r, roundness);
}

// Simplified hexagonal grid function
vec2 hexGrid(vec2 uv, float size) {
    vec2 r = vec2(1.0, sqrt(3.0));
    vec2 h = r * size;
    vec2 a = mod(uv, h) - h * 0.5;
    vec2 b = mod(uv - h * 0.5, h) - h * 0.5;

    return length(a) < length(b) ? a : b;
}

// Get hexagonal grid ID
vec2 hexID(vec2 uv, float size) {
    vec2 r = vec2(1.0, sqrt(3.0));
    vec2 h = r * size;
    vec2 a = floor(uv / h);
    vec2 b = floor((uv - h * 0.5) / h);

    vec2 gridA = mod(uv, h) - h * 0.5;
    vec2 gridB = mod(uv - h * 0.5, h) - h * 0.5;

    return length(gridA) < length(gridB) ? a : b;
}

// Simple random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

mat2 rotate2D(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

// Created by inigo quilez - iq/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
}

float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    float n = mix(mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x), mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    return 0.5 + 0.5 * n;
}

// Abstract function for sparse hexagon grid layer with fixed brightness
float getHexagonLayer(vec2 id, float time, float threshold, float seed) {
    // Use static random for threshold, not time-based
    float staticRand = random(id + vec2(seed));
    float staticRand2 = random(id * 1.5 + vec2(seed * 1.6));

    // Create threshold-based brightness for sparse lighting
    float sparkle = step(threshold, staticRand);

    // Fixed brightness based on second random value (no time variation)
    // Map staticRand2 to a fixed brightness between 0.3 and 1.0
    float fixedBrightness = 0.3 + 0.7 * staticRand2;
    fixedBrightness = 1.;

    // Return fixed brightness for this layer
    return sparkle * fixedBrightness;
}

// Abstract function for gradient color calculation
vec3 getGradientColor(vec2 spinPos, float time, float timeOffset) {
    vec2 tuv = spinPos * 10.;

    // rotate with Noise
    float degree = noise(vec2((time + timeOffset) * .1, tuv.x * tuv.y));

    tuv *= Rot(radians((degree - .5) * 2. + 3.));

    // Wave warp with sin
    float frequency = 2.;
    float amplitude = 7.;
    float speed = (time + timeOffset) * 0.1;
    tuv.x += sin(tuv.y * frequency + speed) / amplitude;
    tuv.y += sin(tuv.x * frequency * 1.5 + 4.) / (amplitude * .5);

    // Use project's uColor array to create gradient layers
    // Layer 1: mix between uColor[0] and uColor[1]
    vec3 layer1 = mix(uColor[0], uColor[1], S(-1.2, 2.5, (tuv * Rot(radians(-5.))).x));

    // Layer 2: mix between uColor[2] and uColor[3]
    vec3 layer2 = mix(uColor[2], uColor[3], S(-2.2, 2.5, (tuv * Rot(radians(-5.))).x));

    // Blend the two layers vertically
    vec3 finalComp = mix(layer1, layer2, S(2.5, -2.0, tuv.y));

    return finalComp;
}

void main() {
    // Position adjusted to project's coordinate system
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    position *= 0.5;

    float scale = 2.;
    position *= scale;

    // Apply rotation
    position = rotate2D(uRotate) * position;

    float hexSize = 1.0;

    vec2 hexPos = hexGrid(position, hexSize);
    vec2 id = hexID(position, hexSize);

    float rand = random(id);

    float time = uTime * 0.05 * uSpeed;

    // Use morph uniform to control hexagon properties
    float hexRadius = 0.39;
    float roundness = 0.1;

    float sdf = roundedHexSDFPointyTop(hexPos, hexRadius, roundness);

    // Anti-aliasing - make it sharper
    float aa = 2. / min(uResolution.x, uResolution.y) * scale;
    float mask = 1. - smoothstep(-aa * 0.01, aa * 0.01, sdf);

    // Start with base color (gray-ish base)
    vec3 baseColor = vec3(0.3, 0.3, 0.3);

    // Create three layers of sparse hexagon grids
    float layer1 = getHexagonLayer(id, time, 0.001, .9) * 0.1 * mask;  // Most dense layer
    float layer2 = getHexagonLayer(id, time, 0.5, 17.1) * 0.4 * mask;  // Medium density layer
    float layer3 = getHexagonLayer(id, time, 0.9, 25.8) * 0.8 * mask; // Sparse layer

    // Combine all three layers - additive blending
    float brightness = layer1 + layer2 + layer3;
    brightness = clamp(brightness, 0.0, 3.0); // Allow up to 3x brightness

    // Apply brightness to base color only where hexagon exists
    vec3 hexColor = baseColor * brightness * mask;

    // Use the already transformed position for gradient calculation
    vec2 gradientPos = position * 0.05; // Adjust scale for gradient effect

    // Use the abstracted gradient color function with timeOffset of 0.0
    vec3 gradientColor = getGradientColor(gradientPos, time, 0.0);
    vec3 gradientColor1 = getGradientColor(gradientPos, time, 0.0);
    vec3 gradientColor2 = getGradientColor(gradientPos, time, 3.0);
    vec3 gradientColor3 = getGradientColor(gradientPos, time, 10.0);

    // Combine hexagon brightness pattern with spin gradient
    // Use mask to blend hexagon effect with gradient
    vec3 color = gradientColor * (1.0 + hexColor * mask * 2.0);
    color = gradientColor1 * layer1;
    color += gradientColor2 * layer2;
    color += gradientColor3 * layer3;

    //color = gradientColor * brightness;

    // Apply lightness adjustment
    if(uLightness >= 0.) {
        color = mix(color, vec3(1, 1, 1), uLightness);
    } else {
        color = mix(color, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(vec3(gradientColor), 1.0);
}