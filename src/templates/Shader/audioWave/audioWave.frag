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

// audio uniforms
uniform float uAudioStrength;
uniform float uRadiusInfluence;
uniform float uAudioLevel;

#define PI 3.1415927

vec3 RGBColor(vec3 rgb) {
    return vec3(rgb.r / 255., rgb.g / 255., rgb.b / 255.);
}

vec3 linearToSRGB(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return pow(c, vec3(1.0 / 2.2));
}

vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 lightenBlend(vec3 base, vec3 blend) {
    return max(base, blend);
}

vec3 adjustSaturation(vec3 color, float sat) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luma), color, sat);
}

// Ease-in-out function (smoothstep)
float easeInOut(float t) {
    return t * t * (3.0 - 2.0 * t);
}

vec2 rotate2D(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Soft-edged, gently deformed ellipse mask
float softEllipse(vec2 pos, vec2 center, float radius, float blur, vec2 axis, float warp, float time, float angle) {
    vec2 wobble = vec2(sin(time * 0.7 + 1.3), cos(time * 0.7 - 0.6)) * (0.08 * warp);
    vec2 axisWarp = axis * (1.0 + wobble);
    vec2 p = rotate2D(pos - center, angle) / axisWarp;
    float dist = length(p);
    float r = radius * (1.0 + 0.05 * warp * sin((p.x - p.y) * 2.2 + time * 0.4));
    float d = dist - r;
    float tipT = clamp(0.5 + 0.5 * p.y, 0.0, 1.0);
    float blurMin = blur * 0.55;
    float blurMax = blur * 1.85;
    float blurV = mix(blurMin, blurMax, tipT);
    return smoothstep(blurV, -blurV, d);
}

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y + 3.);
    vec2 uv = vUV;
    vec2 scale = uScale;
    uv.x = (uv.x - 0.5) * (1. - scale.x) + 0.5;
    uv.y = (uv.y - 0.5) * (1. - scale.y) + 0.5;

    float time = uTime * 0.05 * uSpeed + uTimeOffset;
    float t = time;

    // Audio-driven parameter (0..1), based on smoothed amplitude from CPU.
    // Keep motion in silence consistent with current look.
    float audioParam = clamp(uAudioLevel * uAudioStrength, 0.0, 1.0);

    float baseRadius = 1.3 + uMorph * 0.08;
    float pulse = 1.0 + 0.01 * sin(t * 0.9);
    float radiusFactor = 1.0 + audioParam * uRadiusInfluence;
    float ellipseRadius = baseRadius * pulse * radiusFactor;

    float audioBoost = audioParam * uRadiusInfluence;
    float audioFactor1 = 1.0 + audioBoost * 0.6;  // bottom ellipse (least)
    float audioFactor2 = 1.0 + audioBoost * 1.0;
    float audioFactor3 = 1.0 + audioBoost * 1.4;  // top ellipse (most)

    float blurAmount = 0.48 + uComplex * 0.02 + audioParam * 2.;
    float warpAmount = 0.45 + uComplex * 0.2 + audioParam * 2.;

    float rotSpeed = 0.28;
    float rot = mod(t * rotSpeed + uRotate * 0.35, 2.0 * PI);

    float rotSpeed2 = 0.30;
    float rotSpeed3 = 0.36;
    float rot2 = mod(t * rotSpeed2 + uRotate * 0.55 + 1.1, 2.0 * PI);
    float rot3 = mod(t * rotSpeed3 + uRotate * 0.25 - 0.9, 2.0 * PI);

    vec2 center = vec2(0.0, 0.0);
    vec2 axis = vec2(1.25, 1.25 + 0.1 * cos(t));
    vec2 axis2 = vec2(1.0, 1.0);
    vec2 axis3 = vec2(1.0, 0.7);

    float ellipse = softEllipse(position, center, ellipseRadius * audioFactor1, blurAmount * 1.3, axis, warpAmount, t, rot);
    float ellipse2 = softEllipse(position, center, ellipseRadius * 0.8 * audioFactor2, blurAmount * 0.25, axis2, warpAmount * 0.9, t + 0.35, rot2);
    float ellipse3 = softEllipse(position, center, ellipseRadius * 0.9 * audioFactor3, blurAmount * 0.2, axis3, warpAmount * 0.85, t + 0.4, rot3);

    vec2 gradP = rotate2D(position - center, rot) / axis;
    float gradT = clamp(0.5 + 0.5 * gradP.y, 0.0, 1.0);
    vec3 ellipseColor = mix(uColor[0], uColor[3], gradT);
    float satBoost = 1.0 + audioParam * 0.12;
    float lightBoost = 1.0 + audioParam * 0.08;
    ellipseColor = adjustSaturation(ellipseColor, satBoost) * lightBoost;
    vec3 finalColor = mix(uBgColor, ellipseColor, ellipse);

    vec3 overlayColor2 = uColor[1];
    vec3 overlayColor3 = uColor[2];

    finalColor = mix(finalColor, screenBlend(finalColor, overlayColor2), ellipse2);
    finalColor = mix(finalColor, lightenBlend(finalColor, overlayColor3), ellipse3);

    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(linearToSRGB(finalColor), 1.0);
}
