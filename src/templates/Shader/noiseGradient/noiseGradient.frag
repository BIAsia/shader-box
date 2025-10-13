precision highp float;

varying vec3 vPos;
varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform float uTimeOffset;
uniform vec2 uPosition;
uniform vec2 uScale;
uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uSpeed;
uniform float uRotate;
uniform float uMorph;
uniform float uComplex;
uniform float uLightness;

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float noise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float lines(vec2 uv, float offset) {
    return smoothstep(0.0, 0.5 + offset * 0.5, abs(0.4 * (sin(uv.y * 46.0) + offset * 2.0)));
}

mat2 rotate2D(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
    // position
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    position = position * 0.3 + 0.5;
    position *= .4;
    // position.y -= 0.6;
    vec2 uv = vUV;
    vec2 scale = uScale;
    uv.x = (uv.x - 0.5) * (1. - scale.x) + 0.5;
    uv.y = (uv.y - 0.5) * (1. - scale.y) + 0.5;

    float t = uTime * uSpeed + uTimeOffset;
    // Apply rotation
    position = rotate2D(uRotate) * position;
    vec3 vPosition = vec3(position.x, position.y, 1.0);

    // float n = noise(vPosition + t);
    // 改为：
    vec3 timeOffset = vec3(cos(t * 0.8) + sin(t * 1.7) * 0.3, sin(t * 1.1) + cos(t * 0.6) * 0.3, cos(t * 0.7)) * 0.1;
    float n = noise(vPosition + timeOffset);
    vec3 color1 = uColor[0] + vec3(cos(t) * 0.1);

    vec2 baseUV = rotate2D(n) * vPosition.xy * (noise(vPosition) + 0.5);
    baseUV = rotate2D(n) * vPosition.xy * 0.15 * (1.0 - uMorph) + 0.07 * n * uComplex;
    baseUV *= rotate2D(3.44);

    float basePattern = clamp(lines(baseUV, 0.6), 0.0, 1.0);
    float secondPattern = clamp(lines(baseUV, 0.1 + 0.1 * cos(n)), 0.0, 1.0);
    float thirdPattern = clamp(lines(baseUV, 0.3), 0.0, 1.0);

    vec3 baseColor = mix(uColor[1], color1, basePattern);
    vec3 secondBaseColor = mix(baseColor, uColor[2], secondPattern);
    vec3 finalColor = mix(secondBaseColor, uColor[3], thirdPattern);

    if(uLightness >= 0.) {
        finalColor = mix(finalColor, vec3(1, 1, 1), uLightness);
    } else {
        finalColor = mix(finalColor, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(finalColor, 1.0);
    // gl_FragColor = vec4(vec3(basePattern), 1.0);

}