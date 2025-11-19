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
    float r = length(spinPos) * 4.0;
    float a = atan(spinPos.y, spinPos.x);
    float count = uComplex;
    float morph = 1.0 - uMorph / 0.7;

    // Use static shape calculations (no time variation in the shape itself)
    float shape = abs(morph * sin(a * (count * 0.5) + 0.4)) *
        sin(a * count - 0.2);

    float shape2 = abs(0.2 * sin(a * (count * 0.5) + 0.5)) *
        cos(a * count * 2.0 - 0.5);
    shape += shape2;
    shape = pow(shape, 1.0);

    // Create circular 4-color gradient using polar coordinates with rotation
    // Apply rotation: time for animation + timeOffset as direct rotation angle
    float angle = atan(spinPos.y, spinPos.x) + time * 8.0 + timeOffset;
    // Normalize angle to 0-1 range
    float normalizedAngle = (angle + PI) / (2.0 * PI);
    normalizedAngle = fract(normalizedAngle); // Ensure it wraps around properly

    // Divide the circle into 4 segments (0-0.25, 0.25-0.5, 0.5-0.75, 0.75-1.0)
    vec3 gradientColor;

    if(normalizedAngle < 0.25) {
        // Segment 1: uColor[0] to uColor[1]
        float t = normalizedAngle * 4.0; // Scale to 0-1
        gradientColor = mix(uColor[0], uColor[1], t);
    } else if(normalizedAngle < 0.5) {
        // Segment 2: uColor[1] to uColor[2]
        float t = (normalizedAngle - 0.25) * 4.0; // Scale to 0-1
        gradientColor = mix(uColor[1], uColor[2], t);
    } else if(normalizedAngle < 0.75) {
        // Segment 3: uColor[2] to uColor[3]
        float t = (normalizedAngle - 0.5) * 4.0; // Scale to 0-1
        gradientColor = mix(uColor[2], uColor[3], t);
    } else {
        // Segment 4: uColor[3] to uColor[0]
        float t = (normalizedAngle - 0.75) * 4.0; // Scale to 0-1
        gradientColor = mix(uColor[3], uColor[0], t);
    }

    // Create alpha with larger black center area
    float alpha = (1.0 - smoothstep(shape, shape + 1., r * 1.)) + (1.0 - smoothstep(shape, shape + 3.5, r)) * 0.1;

    // Add a larger black circular area in the center
    float centerRadius = 0.6; // Adjust this to control the size of the black center
    float centerFalloff = 0.6; // Controls the gradient falloff from center
    float centerMask = 1.0 - smoothstep(centerRadius - centerFalloff, centerRadius + centerFalloff, r);

    // Combine the original alpha with the center mask
    alpha = alpha * (1.0 - centerMask * 1.0); // 0.8 controls how dark the center gets
    alpha = clamp(alpha, 0.0, 1.0);

    gradientColor = mix(uBgColor, gradientColor, alpha);
    gradientColor = mix(uBgColor, gradientColor, r * 2.0);

    return vec3(gradientColor);
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
    float layer1 = getHexagonLayer(id, time, 0.2, .39) * 0.15 * mask;  // Most dense layer
    float layer2 = getHexagonLayer(id, time, 0.8, 10.1) * 0.3 * mask;  // Medium density layer
    float layer3 = getHexagonLayer(id, time, 0.9, 9.8) * 0.6 * mask; // Sparse layer

    // Combine all three layers - additive blending
    float brightness = layer1 + layer2 + layer3;
    brightness = clamp(brightness, 0.0, 3.0); // Allow up to 3x brightness

    // Apply brightness to base color only where hexagon exists
    vec3 hexColor = baseColor * brightness * mask;

    // Get spin gradient from the position (similar to spin shader)
    vec2 spinPos = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    spinPos *= 0.1;

    // Use the abstracted gradient color function with rotation angles
    // timeOffset now represents rotation angle: 3.14 = half circle, 6.28 = full circle
    vec3 gradientColor = getGradientColor(spinPos, time, 0.0);
    vec3 gradientColor1 = getGradientColor(spinPos, time, 0.0);
    vec3 gradientColor2 = getGradientColor(spinPos, time, 1.1);  // Half circle rotation
    vec3 gradientColor3 = getGradientColor(spinPos, time, 3.14);  // Full circle rotation

    // Combine hexagon brightness pattern with spin gradient
    // Use mask to blend hexagon effect with gradient
    vec3 color = gradientColor * (1.0 + hexColor * mask * 2.0);
    vec3 color1 = gradientColor1 * layer1;
    vec3 color2 = gradientColor2 * layer2;
    vec3 color3 = gradientColor3 * layer3;
    color = color1 + color2 + color3;

    //color = gradientColor * brightness;

    // Apply lightness adjustment
    if(uLightness >= 0.) {
        color = mix(color, vec3(1, 1, 1), uLightness);
    } else {
        color = mix(color, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(vec3(color), 1.0);
}