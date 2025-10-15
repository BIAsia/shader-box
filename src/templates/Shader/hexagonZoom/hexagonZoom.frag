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

// Hexagon Signed Distance Function (SDF)
float hexSDF(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
}

vec2 rotate(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Generate combined gradient color
vec3 getGradientColor(vec2 pos, float time, float timeOffset, vec3 colorArr[4], vec3 bgColor) {
    float r = length(pos) * 4.0;
    float a = atan(pos.y, pos.x);
    float count = uComplex;
    float morph = 1.0 - uMorph / 0.7;
    float shape = abs(morph * sin(a * (count * 0.5) + 0.4)) * sin(a * count - 0.2);
    float shape2 = abs(0.2 * sin(a * (count * 0.5) + 0.5)) * cos(a * count * 2.0 - 0.5);
    shape += shape2;
    shape = pow(shape, 2.0);
    float angle = atan(pos.y, pos.x) + time * 8.0 + timeOffset;
    float normalizedAngle = (angle + PI) / (2.0 * PI);
    normalizedAngle = fract(normalizedAngle);
    vec3 gradientColor;
    if(normalizedAngle < 0.25) {
        float t = normalizedAngle * 4.0;
        float st = smoothstep(0.0, 1.0, t);
        gradientColor = mix(colorArr[0], colorArr[1], st);
    } else if(normalizedAngle < 0.5) {
        float t = (normalizedAngle - 0.25) * 4.0;
        float st = smoothstep(0.0, 1.0, t);
        gradientColor = mix(colorArr[1], colorArr[2], st);
    } else if(normalizedAngle < 0.75) {
        float t = (normalizedAngle - 0.5) * 4.0;
        float st = smoothstep(0.0, 1.0, t);
        gradientColor = mix(colorArr[2], colorArr[3], st);
    } else {
        float t = (normalizedAngle - 0.75) * 4.0;
        float st = smoothstep(0.0, 1.0, t);
        gradientColor = mix(colorArr[3], colorArr[0], st);
    }
    float alpha = (1.0 - smoothstep(shape, shape + 1., r * 1.)) + (1.0 - smoothstep(shape, shape + 3.5, r)) * 0.1;
    float centerRadius = 0.1;
    float centerFalloff = 0.3;
    float centerMask = 1.0 - smoothstep(centerRadius - centerFalloff, centerRadius + centerFalloff, r);
    alpha = alpha * (1.0 - centerMask * 1.0);
    alpha = clamp(alpha, 0.0, 1.0);
    gradientColor = mix(bgColor, gradientColor, alpha);
    gradientColor = mix(bgColor, gradientColor, r * 2.0);
    return vec3(gradientColor);
}

// Rounded hexagon Signed Distance Function (SDF)
float roundedHexSDF(vec2 p, float r, float roundness) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y) - roundness;
}

// Rounded hexagon SDF with pointy top orientation
float roundedHexSDFPointyTop(vec2 p, float r, float roundness) {
    p = rotate(p, PI / 6.0);
    return roundedHexSDF(p, r, roundness);
}

void main() {
    vec2 position = vec2(vPos.x / uScale.x - uPosition.x, vPos.y / uScale.y + uPosition.y);
    position *= 0.5;
    // To rotate the whole shape by 90 degrees, uncomment below:
    // position = rotate(position, uRotate + PI * 0.5);
    float roundness = 0.2;
    float time = uTime * 0.1 * uSpeed;
    vec3 color = uBgColor;
    for(int i = 0; i < 4; i++) {
        float fi = float(i);
        float layerTime = mod(time + fi * 0.25, 1.0);
        float scale = mix(0.2, 1.6, layerTime);
        float fade = 1.0 - smoothstep(0.2, 1.6, scale);
        float hex = 1.0 - smoothstep(-0.01, 0.01, roundedHexSDFPointyTop(position, scale, roundness));
        float alpha = hex * fade;
        vec3 grad;
        float rotateTime = (mod(fi, 2.0) == 0.0) ? time : -time;
        rotateTime = mod(rotateTime, 100.0);
        if(i == 0) {
            vec3 colorArr[4];
            colorArr[0] = uColor[1];
            colorArr[1] = uBgColor;
            colorArr[2] = uColor[2];
            colorArr[3] = uColor[1];
            grad = getGradientColor(position * .1, rotateTime, fi * 2.1, colorArr, uBgColor);
        } else if(i == 1) {
            vec3 colorArr[4];
            colorArr[0] = uBgColor;
            colorArr[1] = uColor[3];
            colorArr[2] = uColor[2];
            colorArr[3] = uBgColor;
            grad = getGradientColor(position * .1, rotateTime, fi * 2.1, colorArr, uBgColor);
        } else if(i == 2) {
            vec3 colorArr[4];
            colorArr[0] = uColor[0];
            colorArr[1] = uBgColor;
            colorArr[2] = uBgColor;
            colorArr[3] = uBgColor;
            grad = getGradientColor(position * .1, rotateTime, fi * 1.1, colorArr, uBgColor);
        } else {
            vec3 colorArr[4];
            colorArr[0] = uColor[1];
            colorArr[1] = uBgColor;
            colorArr[2] = uBgColor;
            colorArr[3] = uColor[1];
            grad = getGradientColor(position * .1, rotateTime, fi * 3.1, colorArr, uBgColor);
        }
        color = mix(color, grad, alpha);
    }

    // Lightness adjustment
    if(uLightness >= 0.) {
        color = mix(color, vec3(1, 1, 1), uLightness);
    } else {
        color = mix(color, vec3(0, 0, 0), -uLightness);
    }
    gl_FragColor = vec4(color, 1.0);
}
