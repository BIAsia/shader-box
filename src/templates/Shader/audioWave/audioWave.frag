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

vec3 linearToSRGB(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return pow(c, vec3(1.0 / 2.2));
}

vec4 screenBlend(vec4 base, vec4 blend) {
    float a = 1.0 - (1.0 - base.a) * (1.0 - blend.a);
    vec3 rgb = 1.0 - (1.0 - base.rgb) * (1.0 - blend.rgb);
    return vec4(rgb, a);
}

vec3 adjustSaturation(vec3 color, float sat) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luma), color, sat);
}

// Ease-in-out function (smoothstep)
float easeInOut(float t) {
    return t * t * (3.0 - 2.0 * t);
}

float phaseA(float delay) {
    return easeInOut(clamp((uTimeOffset + 1.0) / (1.0 + delay), 0.0, 1.0));
}

float phaseB(float delay) {
    return easeInOut(clamp((uTimeOffset - delay) / (1.0 - delay), 0.0, 1.0));
}

vec2 rotate2D(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Soft-edged, gently deformed ellipse mask
vec2 ellipseSDF(vec2 pos, vec2 center, float radius, float blur, vec2 axis, float warp, float time, float angle) {
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
    return vec2(d, blurV);
}

vec2 roundRectSDF(vec2 pos, vec2 center, vec2 size, float radius, float blur, float angle) {
    vec2 p = rotate2D(pos - center, angle);
    vec2 q = abs(p) - size + vec2(radius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    return vec2(dist, blur);
}

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y + 3.);
    float delayStep = 0.08;
    float delay1 = 0.0;
    float delay2 = delayStep;
    float delay3 = delayStep * 2.0;
    float phaseA1 = phaseA(delay1);
    float phaseA2 = phaseA(delay2);
    float phaseA3 = phaseA(delay3);
    float phaseB1 = phaseB(delay1);
    float phaseB2 = phaseB(delay2);
    float phaseB3 = phaseB(delay3);

    float t = uTime * 0.05 * uSpeed;

    // Audio-driven parameter (0..1), based on smoothed amplitude from CPU.
    // Keep motion in silence consistent with current look.
    float audioBase = clamp(uAudioLevel * uAudioStrength, 0.0, 1.0);
    float audioParam1 = audioBase * phaseB1;
    float audioParam2 = audioBase * phaseB2;
    float audioParam3 = audioBase * phaseB3;

    float baseRadius = 1.3 + uMorph * 0.08;
    float pulse1 = mix(0.3, 1.0 + 0.01 * sin(t * 0.9), phaseB1);
    float pulse2 = mix(0.3, 1.0 + 0.01 * sin(t * 0.9), phaseB2);
    float pulse3 = mix(0.3, 1.0 + 0.01 * sin(t * 0.9), phaseB3);
    float radiusFactor1 = 1.0 + audioParam1 * uRadiusInfluence;
    float radiusFactor2 = 1.0 + audioParam2 * uRadiusInfluence;
    float radiusFactor3 = 1.0 + audioParam3 * uRadiusInfluence;
    float ellipseRadius1 = baseRadius * pulse1 * radiusFactor1;
    float ellipseRadius2 = baseRadius * pulse2 * radiusFactor2;
    float ellipseRadius3 = baseRadius * pulse3 * radiusFactor3;

    float audioBoost1 = audioParam1 * uRadiusInfluence;
    float audioBoost2 = audioParam2 * uRadiusInfluence;
    float audioBoost3 = audioParam3 * uRadiusInfluence;
    float audioFactor1 = 1.0 + audioBoost1 * 0.6;  // bottom ellipse (least)
    float audioFactor2 = 1.0 + audioBoost2 * 1.0;
    float audioFactor3 = 1.0 + audioBoost3 * 1.4;  // top ellipse (most)

    float blurAmount1 = (0.48 + uComplex * 0.02 + audioParam1 * 2.) * phaseB1;
    float blurAmount2 = (0.48 + uComplex * 0.02 + audioParam2 * 2.) * phaseB2;
    float blurAmount3 = (0.48 + uComplex * 0.02 + audioParam3 * 2.) * phaseB3;
    float warpAmount1 = (0.45 + uComplex * 0.2 + audioParam1 * 2.) * phaseB1;
    float warpAmount2 = (0.45 + uComplex * 0.2 + audioParam2 * 2.) * phaseB2;
    float warpAmount3 = (0.45 + uComplex * 0.2 + audioParam3 * 2.) * phaseB3;

    float rotSpeed = 0.28;
    float rotSpeed2 = 0.30;
    float rotSpeed3 = 0.36;
    float rot = mix(uRotate * 0.35, mod(t * rotSpeed + uRotate * 0.35, 2.0 * PI), phaseB1);
    float rot2 = mix(uRotate * 0.35, mod(t * rotSpeed2 + uRotate * 0.55 + 1.1, 2.0 * PI), phaseB2);
    float rot3 = mix(uRotate * 0.35, mod(t * rotSpeed3 + uRotate * 0.25 - 0.9, 2.0 * PI), phaseB3);

    float stateCenter = easeInOut(clamp(uTimeOffset, 0.0, 1.0));
    vec2 center = mix(vec2(0.0, .8), vec2(0.0, 0.2), stateCenter);
    vec2 axisBase = vec2(0.8, .5);
    vec2 axisTarget1 = vec2(1.2, 1.1 + 0.1 * cos(t));
    vec2 axisTarget2 = vec2(1.0, 1.0);
    vec2 axisTarget3 = vec2(1.0, 0.7);
    vec2 axis = mix(axisBase, axisTarget1, phaseB1);
    vec2 axis2 = mix(axisBase, axisTarget2, phaseB2);
    vec2 axis3 = mix(axisBase, axisTarget3, phaseB3);

    vec2 rectBaseSize = vec2(0.95, 0.15);
    vec2 rectSquareSize = vec2(rectBaseSize.y, rectBaseSize.y);
    vec2 rectTargetSize1 = rectBaseSize;
    vec2 rectTargetSize2 = vec2(0.9, 0.17);
    vec2 rectTargetSize3 = vec2(0.85, 0.2);
    vec2 rectSize1A = mix(rectBaseSize, rectSquareSize, phaseA1);
    vec2 rectSize2A = mix(rectBaseSize, rectSquareSize, phaseA2);
    vec2 rectSize3A = mix(rectBaseSize, rectSquareSize, phaseA3);
    vec2 rectSize1 = mix(rectSize1A, rectTargetSize1, phaseB1);
    vec2 rectSize2 = mix(rectSize2A, rectTargetSize2, phaseB2);
    vec2 rectSize3 = mix(rectSize3A, rectTargetSize3, phaseB3);
    float rectRadius1 = min(rectSize1.x, rectSize1.y);
    float rectRadius2 = min(rectSize2.x, rectSize2.y);
    float rectRadius3 = min(rectSize3.x, rectSize3.y);
    float rectBlur1 = max(blurAmount1 * 0.35, 0.003);
    float rectBlur2 = max(blurAmount2 * mix(0.35, 0.25, phaseB2), 0.003);
    float rectBlur3 = max(blurAmount3 * mix(0.35, 0.2, phaseB3), 0.003);

    float ellipseScale2 = mix(1.0, 0.8, phaseB2);
    float ellipseScale3 = mix(1.0, 0.9, phaseB3);
    float blurMix2 = mix(1.3, 0.25, phaseB2);
    float blurMix3 = mix(1.3, 0.2, phaseB3);
    float warpMix2 = mix(1.0, 0.9, phaseB2);
    float warpMix3 = mix(1.0, 0.85, phaseB3);
    vec2 ellipseSdf1 = ellipseSDF(position, center, ellipseRadius1 * audioFactor1, blurAmount1 * 1.6, axis, warpAmount1, mix(0.0, t, phaseB1), rot);
    vec2 ellipseSdf2 = ellipseSDF(position, center, ellipseRadius2 * ellipseScale2 * audioFactor2, blurAmount2 * blurMix2, axis2, warpAmount2 * warpMix2, mix(0.0, t + 0.35, phaseB2), rot2);
    vec2 ellipseSdf3 = ellipseSDF(position, center, ellipseRadius3 * ellipseScale3 * audioFactor3, blurAmount3 * blurMix3, axis3, warpAmount3 * warpMix3, mix(0.0, t + 0.4, phaseB3), rot3);

    vec2 rectSdf1 = roundRectSDF(position, center, rectSize1, rectRadius1, rectBlur1, rot);
    vec2 rectSdf2 = roundRectSDF(position, center, rectSize2, rectRadius2, rectBlur2, rot2);
    vec2 rectSdf3 = roundRectSDF(position, center, rectSize3, rectRadius3, rectBlur3, rot3);

    float d1 = mix(rectSdf1.x, ellipseSdf1.x, phaseB1);
    float b1 = mix(rectSdf1.y, ellipseSdf1.y, phaseB1);
    float d2 = mix(rectSdf2.x, ellipseSdf2.x, phaseB2);
    float b2 = mix(rectSdf2.y, ellipseSdf2.y, phaseB2);
    float d3 = mix(rectSdf3.x, ellipseSdf3.x, phaseB3);
    float b3 = mix(rectSdf3.y, ellipseSdf3.y, phaseB3);

    float aa1 = fwidth(d1);
    float aa2 = fwidth(d2);
    float aa3 = fwidth(d3);
    float ellipse = smoothstep(b1 + aa1, -b1 - aa1, d1);
    float ellipse2 = smoothstep(b2 + aa2, -b2 - aa2, d2);
    float ellipse3 = smoothstep(b3 + aa3, -b3 - aa3, d3);

    vec2 gradP = rotate2D(position - center, rot) / axis;
    float gradT = clamp(0.5 + 0.5 * gradP.y, 0.0, 1.0);
    vec3 ellipseColor = mix(uColor[0], uColor[3], gradT);
    float satBoost1 = 1.0 + audioParam1 * 2.;
    float lightBoost1 = 1.0 + audioParam1 * 2.;
    float satBoost2 = 1.0 + audioParam2 * 2.;
    float lightBoost2 = 1.0 + audioParam2 * 2.;
    float satBoost3 = 1.0 + audioParam3 * 2.;
    float lightBoost3 = 1.0 + audioParam3 * 2.;

    ellipseColor = adjustSaturation(ellipseColor, satBoost1) * lightBoost1;
    vec3 overlayColor2 = adjustSaturation(uColor[1], satBoost2) * lightBoost2;
    vec3 overlayColor3 = adjustSaturation(uColor[2], satBoost3) * lightBoost3;

    vec4 ellipse1 = vec4(ellipseColor * ellipse, ellipse);
    vec4 ellipse2Color = vec4(overlayColor2 * ellipse2, ellipse2);
    vec4 ellipse3Color = vec4(overlayColor3 * ellipse3, ellipse3);
    vec4 ellipseBlend = screenBlend(screenBlend(ellipse1, ellipse2Color), ellipse3Color);
    vec3 finalColor = clamp(uBgColor * (1.0 - ellipseBlend.a) + ellipseBlend.rgb, 0.0, 1.0);
    //finalColor = uBgColor + ellipseBlend.rgb;

    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(linearToSRGB(finalColor), 1.0);
}
