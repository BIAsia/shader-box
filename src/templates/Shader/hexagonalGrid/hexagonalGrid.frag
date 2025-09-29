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

mat2 rotate2D(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

// Abstract function for sparse hexagon grid layer with probabilistic brightness
float getHexagonLayer(vec2 id, float time, float threshold, float seed) {
    // Use static random for threshold, not time-based
    float staticRand = random(id + vec2(seed));
    float staticRand2 = random(id * 1.5 + vec2(seed * 1.6));

    // Add more random seeds for variation within same ID
    float staticRand3 = random(id * 2.3 + vec2(seed * 2.1));
    float staticRand4 = random(id * 0.7 + vec2(seed * 3.7));

    // Create threshold-based brightness for sparse lighting
    float sparkle = step(threshold, staticRand);

    // Create probabilistic brightness variation for same ID
    // Use multiple random values to create different brightness states
    float brightnessVariation = staticRand3 * 0.4 + staticRand4 * 0.3; // 0.0 to 0.7 range

    // Base brightness with variation
    float baseBrightness = 0.3 + 0.4 * staticRand2; // 0.3 to 0.7 base
    float finalBrightness = baseBrightness + brightnessVariation; // 0.3 to 1.4 total

    // Clamp to reasonable range
    finalBrightness = clamp(finalBrightness, 0.2, 1.2);

    // Return probabilistic brightness for this layer
    return sparkle * finalBrightness;
}

// Abstract function for gradient color calculation
vec3 getGradientColor(vec2 spinPos, float time, float timeOffset) {
    float r = length(spinPos) * 2.0;
    float a = atan(spinPos.y, spinPos.x);
    float count = uComplex;
    float morph = 1.0 - uMorph / 0.7;

    float adjustedTime = time + timeOffset;

    float shape = abs(morph * sin(a * (count * 0.5) + (adjustedTime * 8.0 + 0.4))) *
        sin(a * count - (adjustedTime * 8.0 + 0.2));

    float shape2 = abs(0.2 * sin(a * (count * 0.5) + (adjustedTime * 8.0 + 0.5))) *
        cos(a * count * 2.0 - (adjustedTime * 8.0 + 0.5));
    shape += shape2;
    shape = pow(shape, 1.0);

    // Create gradient colors similar to spin
    vec3 gradientColor = mix(uColor[0], uColor[1], r);
    float alpha = (1.0 - smoothstep(shape, shape + 0.8, r)) + (1.0 - smoothstep(shape, shape + 1.5, r)) * 0.2;
    alpha = clamp(alpha, 0.0, 1.0);

    gradientColor = mix(uBgColor, gradientColor, alpha);
    gradientColor = mix(uBgColor, gradientColor, r * 1.0);

    return gradientColor;
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
    float layer1 = getHexagonLayer(id, time, 0.01, .8) * 0.1 * mask;  // Most dense layer
    float layer2 = getHexagonLayer(id, time, 0.55, 3.0) * 0.2 * mask;  // Medium density layer
    float layer3 = getHexagonLayer(id, time, 0.95, 17.8) * 0.3 * mask; // Sparse layer

    // Combine all three layers - additive blending
    float brightness = layer1 + layer2 + layer3;
    brightness = clamp(brightness, 0.0, 3.0); // Allow up to 3x brightness

    // Apply brightness to base color only where hexagon exists
    vec3 hexColor = baseColor * brightness * mask;

    // Get spin gradient from the position (similar to spin shader)
    vec2 spinPos = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    spinPos *= 0.1;

    // Use the abstracted gradient color function with timeOffset of 0.0
    vec3 gradientColor = getGradientColor(spinPos, time, 0.0);
    vec3 gradientColor1 = getGradientColor(spinPos, time, 0.0);
    vec3 gradientColor2 = getGradientColor(spinPos, time, 3.0);
    vec3 gradientColor3 = getGradientColor(spinPos, time, 8.0);

    // Combine hexagon brightness pattern with spin gradient
    // Use mask to blend hexagon effect with gradient
    vec3 color = gradientColor * (1.0 + hexColor * mask * 2.0);
    color = gradientColor1 * layer2;
    color += gradientColor2 * layer1;
    color += gradientColor3 * layer3;

    //color = gradientColor * brightness;

    // Apply lightness adjustment
    if(uLightness >= 0.) {
        color = mix(color, vec3(1, 1, 1), uLightness);
    } else {
        color = mix(color, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(vec3(brightness), 1.0);
}