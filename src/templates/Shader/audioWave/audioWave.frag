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
uniform float uAudio[64];
uniform float uAudioLen;
uniform float uAudioStrength;
uniform float uTrajInfluence;
uniform float uTrajXInfluence;
uniform float uTrajYInfluence;
uniform float uRadiusInfluence;
uniform float uAudioLevel;

#define PI 3.1415927
#define AUDIO_SIZE 64

vec3 RGBColor(vec3 rgb) {
    return vec3(rgb.r / 255., rgb.g / 255., rgb.b / 255.);
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

// Smooth deformed ellipse with diffuse edges
float smoothEllipse(vec2 pos, vec2 center, float radius, float blur, vec2 axis, float warp, float time, float angle) {
    vec2 wobble = vec2(sin(time * 0.9 + 1.3), cos(time * 0.9 - 0.6)) * (0.12 * warp);
    vec2 axisWarp = axis * (1.0 + wobble);
    vec2 p = rotate2D(pos - center, angle) / axisWarp;
    float dist = length(p);
    float r = radius * (1.0 + 0.06 * warp * sin((p.x + p.y) * 2.4 + time * 0.45));
    return 1.0 - smoothstep(r - blur, r + blur, dist);
}

// Sample the audio array by phase [0,1)
float sampleAudio(float phase) {
    float idxf = fract(phase) * float(AUDIO_SIZE);
    int i = int(floor(idxf));
    int i2 = (i + 1) % AUDIO_SIZE;
    float f = fract(idxf);
    float v1 = uAudio[i];
    float v2 = uAudio[i2];
    return mix(v1, v2, f);
}

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y + 3.);
    vec2 uv = vUV;
    vec2 scale = uScale;
    uv.x = (uv.x - 0.5) * (1. - scale.x) + 0.5;
    uv.y = (uv.y - 0.5) * (1. - scale.y) + 0.5;

    float time = uTime * 0.05 * uSpeed + uTimeOffset;
    float t = time;

    // Get an audio-driven value based on time; range assumed ~[-1,1]
    // Use smoothed amplitude level (0..1) to reduce rapid waveform flicker
    float audioPos = clamp(uAudioLevel * uAudioStrength, 0.0, 1.0);

    float scaleAmp = mix(0.02, 0.18, audioPos);
    float scalePulse = 1.0 + scaleAmp * sin(t);

    float baseRadius = 0.6 + uMorph * 0.12;
    float circleRadius = baseRadius * scalePulse * (1.0 + audioPos * 0.55 * uRadiusInfluence);
    float blurAmount = 2.3 + uComplex * 0.2 + audioPos * 2.2;
    float warpAmount = 0.6 + audioPos * 2.1 + uComplex * 0.3;

    // modulate frequency / trajectory by audio (Y-driven more than X)
    float freqMod = 1.0 + audioPos * 2.0 * uTrajYInfluence;
    float trajBoost = 0.1 + audioPos * 1.1 * uTrajInfluence;

    float xPos = (uMorph * 0.16 + audioPos * 0.7 * uTrajXInfluence) * trajBoost;
    float yPos = sin(t * 0.25 * (1.0 + audioPos * uTrajYInfluence)) * 0.6 * freqMod * trajBoost;
    vec2 center = vec2(xPos, yPos);

    float radius1 = circleRadius;
    float radius2 = circleRadius * 1.25;
    float radius3 = circleRadius * 1.7;

    float rotSpeed = 0.12 + audioPos * 0.65;
    float rot1 = t * rotSpeed + uRotate * 0.4;
    float rot2 = t * -rotSpeed * 0.7 + uRotate * 0.6;
    float rot3 = t * rotSpeed * 0.45 + uRotate * 0.9;

    float circle1 = smoothEllipse(position, center, radius1, blurAmount, vec2(1.25, 0.85), warpAmount, t, rot1);
    float circle2 = smoothEllipse(position, center, radius2, blurAmount, vec2(1.10, 0.70), warpAmount * 0.9, t + 1.4, rot2);
    float circle3 = smoothEllipse(position, center, radius3, blurAmount, vec2(1.35, 0.95), warpAmount * 0.8, t + 2.2, rot3);

    vec3 color1 = uColor[0];
    vec3 color2 = uColor[1];
    vec3 color3 = uColor[2];
    vec3 color4 = uColor[3];

    float sharedInfluence = 0.15;
    vec3 base1 = mix(color1, color4, sharedInfluence);
    vec3 base2 = mix(color2, color4, sharedInfluence);
    vec3 base3 = mix(color3, color4, sharedInfluence);

    vec3 additive = base1 * circle1 + base2 * circle2 + base3 * circle3;
    vec3 finalColor = clamp(uBgColor + additive * 1.25, 0.0, 1.0);

    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
