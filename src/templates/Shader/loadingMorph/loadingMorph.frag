precision highp float;

varying vec3 vPos;
varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;

uniform float uSpeed;
uniform float uTimeOffset;
uniform float uLightness;
uniform vec2 uPosition;
uniform vec2 uScale;
uniform float uRotate;

uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uComplex;
uniform float uMorph;

#define PI 3.1415927

vec3 RGBColor(vec3 rgb) {
    return vec3(rgb.r / 255., rgb.g / 255., rgb.b / 255.);
}

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 rgb2hsl(in vec3 c) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = c.r;
    float g = c.g;
    float b = c.b;
    float cMin = min(r, min(g, b));
    float cMax = max(r, max(g, b));

    l = (cMax + cMin) / 2.0;
    if(cMax > cMin) {
        float cDelta = cMax - cMin;
        s = l < .0 ? cDelta / (cMax + cMin) : cDelta / (2.0 - (cMax + cMin));
        if(r == cMax) {
            h = (g - b) / cDelta;
        } else if(g == cMax) {
            h = 2.0 + (b - r) / cDelta;
        } else {
            h = 4.0 + (r - g) / cDelta;
        }

        if(h < 0.0) {
            h += 6.0;
        }
        h = h / 6.0;
    }
    return vec3(h, s, l);
}

// Ease-in-out function (smoothstep)
float easeInOut(float t) {
    return t * t * (3.0 - 2.0 * t);
}

// Smooth circle with diffuse edges
float smoothCircle(vec2 pos, vec2 center, float radius, float blur) {
    float dist = length(pos - center);
    return 1.0 - smoothstep(radius - blur, radius + blur, dist);
}

void main() {
    // Position setup
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y + 3.);
    vec2 uv = vUV;
    vec2 scale = uScale;
    uv.x = (uv.x - 0.5) * (1. - scale.x) + 0.5;
    uv.y = (uv.y - 0.5) * (1. - scale.y) + 0.5;

    // Time with ease-in-out for smooth animation
    float time = uTime * 0.05 * uSpeed + uTimeOffset;
    float t = time;

    // Parameters for circles
    float circleRadius = 1.2 + uMorph * 0.1;
    float blurAmount = 2.5 + uComplex * 0.1; // Edge diffusion

    // Circle 1 - moves in arc trajectory (left and up)
    float xPos1 = .7 * sin(t) + uMorph;
    float yPos1 = abs(sin(0.3 * t)) * 0.7; // Arc upward when moving
    vec2 center1 = vec2(xPos1, yPos1);
    float circle1 = smoothCircle(position, center1, circleRadius, blurAmount);

    // Circle 2 - moves in arc trajectory (right and up, opposite phase)
    float xPos2 = -.7 * sin(t) - uMorph;
    float yPos2 = abs(sin(0.3 * t + PI)) * 0.7; // Arc upward when moving (opposite phase)
    vec2 center2 = vec2(xPos2, yPos2);
    float circle2 = smoothCircle(position, center2, circleRadius, blurAmount);

    // Create gradient colors for circles (blue-green)
    vec3 color1 = uColor[0]; // Base blue-green
    vec3 color2 = uColor[1]; // Lighter blue-green
    vec3 color3 = uColor[2]; // Another shade
    vec3 color4 = uColor[3]; // Accent color

    // Create individual circle colors with gradients
    vec3 circle1Color = mix(uBgColor, mix(color1, color2, 0.5), circle1);
    vec3 circle2Color = mix(uBgColor, mix(color3, color4, 0.5), circle2);

    // Smooth blending between circles using weighted average
    float totalWeight = circle1 + circle2;
    vec3 blendedColor;
    if(totalWeight > 0.0) {
        blendedColor = (circle1Color * circle1 + circle2Color * circle2) / totalWeight;
    } else {
        blendedColor = uBgColor;
    }

    // Mix with background based on combined alpha
    float combinedAlpha = clamp(circle1 + circle2, 0.0, 1.0);
    vec3 finalColor = mix(uBgColor, blendedColor, combinedAlpha);

    // Apply lightness adjustment
    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
