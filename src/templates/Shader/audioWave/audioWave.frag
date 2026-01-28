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

// Smooth circle with diffuse edges
float smoothCircle(vec2 pos, vec2 center, float radius, float blur) {
    float dist = length(pos - center);
    return 1.0 - smoothstep(radius - blur, radius + blur, dist);
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

    float circleRadius = 1.2 + uMorph * 0.1 + audioPos * 0.6 * uRadiusInfluence;
    float blurAmount = 2.5 + uComplex * 0.1 + audioPos * 1.5;

    // modulate frequency / trajectory by audio (Y-driven more than X)
    float freqMod = 1.0 + audioPos * 2.0 * uTrajYInfluence;

    float xPos1 = .7 * sin(t * freqMod) + uMorph * (0.5 + audioPos * 0.5 * uTrajXInfluence);
    float yPos1 = abs(sin(0.3 * t * (1.0 + audioPos * uTrajYInfluence))) * 0.7;
    vec2 center1 = vec2(xPos1, yPos1);
    float circle1 = smoothCircle(position, center1, circleRadius, blurAmount);

    float xPos2 = -.7 * sin(t * freqMod + PI) - uMorph * (0.5 + audioPos * 0.5 * uTrajXInfluence);
    float yPos2 = abs(sin(0.3 * t * (1.0 + audioPos * uTrajYInfluence) + PI)) * 0.7;
    vec2 center2 = vec2(xPos2, yPos2);
    float circle2 = smoothCircle(position, center2, circleRadius, blurAmount);

    vec3 color1 = uColor[0];
    vec3 color2 = uColor[1];
    vec3 color3 = uColor[2];
    vec3 color4 = uColor[3];

    vec3 circle1Color = mix(uBgColor, mix(color1, color2, 0.5), circle1);
    vec3 circle2Color = mix(uBgColor, mix(color3, color4, 0.5), circle2);

    float totalWeight = circle1 + circle2;
    vec3 blendedColor;
    if(totalWeight > 0.0) {
        blendedColor = (circle1Color * circle1 + circle2Color * circle2) / totalWeight;
    } else {
        blendedColor = uBgColor;
    }

    float combinedAlpha = clamp(circle1 + circle2, 0.0, 1.0);
    vec3 finalColor = mix(uBgColor, blendedColor, combinedAlpha);

    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
