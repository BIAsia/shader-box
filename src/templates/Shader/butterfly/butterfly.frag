varying vec3 vPos;
uniform vec3 uColor[4];
uniform float uLightness;
uniform vec2 uResolution;
uniform vec2 uPosEffect;
uniform float uEffect;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDensity;
uniform float uMorph;
uniform float uCol;
uniform vec2 uDirection;

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 mul3(in mat3 m, in vec3 v) {
    return vec3(dot(v, m[0]), dot(v, m[1]), dot(v, m[2]));
}

vec3 srgb2oklab(vec3 c) {
    mat3 m1 = mat3(0.4122214708, 0.5363325363, 0.0514459929, 0.2119034982, 0.6806995451, 0.1073969566, 0.0883024619, 0.2817188376, 0.6299787005);

    vec3 lms = mul3(m1, c);

    lms = pow(lms, vec3(1. / 3.));

    mat3 m2 = mat3(+0.2104542553, +0.7936177850, -0.0040720468, +1.9779984951, -2.4285922050, +0.4505937099, +0.0259040371, +0.7827717662, -0.8086757660);

    return mul3(m2, lms);
}

vec3 oklab2srgb(vec3 c) {
    mat3 m1 = mat3(1.0000000000, +0.3963377774, +0.2158037573, 1.0000000000, -0.1055613458, -0.0638541728, 1.0000000000, -0.0894841775, -1.2914855480);

    vec3 lms = mul3(m1, c);

    lms = lms * lms * lms;

    mat3 m2 = mat3(+4.0767416621, -3.3077115913, +0.2309699292, -1.2684380046, +2.6097574011, -0.3413193965, -0.0041960863, -0.7034186147, +1.7076147010);
    return mul3(m2, lms);
}

float star(in vec2 uv, in float t) {
    float phi = atan(uv.y, uv.x);
    float d = length(uv) * (1. + 0.15 * sin(phi * 4. + 0.2 * t) + 0.1 * sin(1.2 * phi * 10. + 0.6 * t) + 0.2 * sin(phi * phi * 2. + 0.4 * t)) * 7.7 * (1. + 0.1 * sin(t));
    //d = sqrt(d);
    d = log(d * d);
    return 0.7 * d;
}

float starN(in vec2 uv, in float t) {
    float phi = atan(uv.y, uv.x);
    float d = length(uv) * (1. + 0.55 * sin(phi * 4. + 0.8 * t) + 0.1 * sin(1.2 * phi * 10. + 0.6 * t) + 0.2 * sin(phi * phi * 2. + 0.4 * t)) * 7.7 * (1. + 0.1 * sin(t));
    //d = sqrt(sin(d));
   // d = sqrt(cos(d));
    d = (d);
    return 1.4 * d;
}

mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec3 blend(in vec3 base, in vec3 blend) {
    vec3 result;
    result.r = (blend.r < 0.5) ? (2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r)) : (sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r));
    result.g = (blend.g < 0.5) ? (2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g)) : (sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g));
    result.b = (blend.b < 0.5) ? (2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b)) : (sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b));
    return result;
}

vec3 starTextureN(in float size, in vec2 uv, in float t) {
    float d = 0.5 * min(starN(uv, t), starN(uv, t - 2.1));
    d = size * (1. + 0.2 * cos(t)) * min(d, starN(uv, t - 6.1));
    float dist = sqrt(smoothstep(1., 0., d));
    return vec3(dist);
}

vec3 starTexture(in float size, in vec2 uv, in float t) {
    float d = 0.5 * min(star(uv, t), star(uv, t - 2.1));
    d = size * (1. + 0.2 * sin(t)) * min(d, star(uv, t - 3.1));
    float dist = sqrt(smoothstep(1., 0., d));
    return vec3(dist);
}

float butterFlyOriginal(in float a, in float r, in float count, in float t) {
    // 中心向外四散的图形
    float shape = abs(cos(a * (count * 3.) + (t * 0.8))) * sin(a * count - (t * 0.8));
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 0.8, r));
    alpha += (1. - smoothstep(shape, shape + 1.5, r)) * 0.2;
    return alpha;
}

float butterFlyA(in float a, in float r, in float count, in float t) {
    // 中心向外四散的图形
    r = r;
    float v1 = a * (count) + (t * 0.8);
    float v2 = a * (count) - (t * 0.8);
    float shape = abs(cos(v1)) * sin(v2);
    //shape = tan(shape);
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 0.4, r + 0.1)) + (1. - smoothstep(shape, shape + 1.4, r + 0.1)) * 0.2;
    //float alpha = abs(1. - smoothstep(shape, shape + 0.8, r + 0.1 * sin(t) * cos(t))) + (1. - smoothstep(shape, shape + 1.5, r + 0.1 * sin(t) * cos(t))) * 0.2;

    return alpha;
}

float butterFlyB(in float a, in float r, in float count, in float t) {
    // 中心向外四散的图形
    r = r * 0.5;
    float v1 = a * (count * 3.) + (t * 0.4);
    float v2 = a * (count * 3.) - (t * 0.4);
    float shape = abs(1. - cos(v1)) * sin(v2);
    //shape = tan(shape);
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 0.4, r + 0.1)) + (1. - smoothstep(shape, shape + 1.4, r + 0.1)) * 0.2;
    //float alpha = abs(1. - smoothstep(shape, shape + 0.8, r + 0.1 * sin(t) * cos(t))) + (1. - smoothstep(shape, shape + 1.5, r + 0.1 * sin(t) * cos(t))) * 0.2;

    return alpha;
}

float butterFlyC(in float a, in float r, in float count, in float t) {
    // 中心向外四散的图形
    r = r * 0.5;
    // r *= cos(t);
    float v1 = a * (count) + (t * 0.4);
    float v2 = a * (count) - (t * 0.4);
    float shape = abs(1. - cos(v1)) * sin(v2);
    //shape = tan(shape);
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 1., r + 0.1 * cos(t)));
    alpha += (1. - smoothstep(shape, shape + 1.4, r + 0.1)) * 0.2;
    // float alpha =  + (1. - smoothstep(shape, shape + 1.4, r + 0.1)) * 0.2;
    //float alpha = abs(1. - smoothstep(shape, shape + 0.8, r + 0.1 * sin(t) * cos(t))) + (1. - smoothstep(shape, shape + 1.5, r + 0.1 * sin(t) * cos(t))) * 0.2;

    return alpha;
}

void main() {
    vec2 coord = vPos.xy / uResolution.xy + vec2(0.5);
    coord = vPos.xy + vec2(0.5);
    float t = uTime * 0.15;
    vec2 uv = coord - vec2(0.5);

    uv *= rotate2d(t * 0.2);

    // 中心颜色渐变
    float r = length(uv) * 0.5;
    float r2 = length(uv) * length(uv);
    float r3 = min(exp2(3. - 2. * length(uv)), 1.);
    vec3 color = mix(uColor[0], uColor[1], r2);
    color = mix(uColor[2], color, r3);
    // color = mix(color, uColor[2], r * 2. - 0.5);
    float a = atan(uv.y, uv.x);
    // float count = 3. + sin(t) * .3;
    float count = 4.;

    // 中心向外四散的图形
    float shape = abs(cos(a * (count * 3.) + (t * 0.8))) * sin(a * count - (t * 0.8));
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 0.8, r)) + (1. - smoothstep(shape, shape + 1.5, r)) * 0.2;

    vec3 fragColor = color;
    // vec3 fragColor = color * butterFlyOriginal(a, r, count, t);
    fragColor = mix(color, uColor[2], 1. - 2. * butterFlyA(a, r, count, t));
    // fragColor = mix(color, uColor[2], 1. - 2. * butterFlyOriginal(a, r, count, t));
    // fragColor = mix(color, uColor[2], 1. - 2. * butterFlyB(a, r, count, t));
    fragColor = mix(color, uColor[2], 1. - 2. * butterFlyC(a, r, count, t));
    fragColor = color * butterFlyOriginal(a, r, count, t);
    fragColor = color * vec3(butterFlyC(a, r, count, t));
    // fragColor = color;
    // fragColor = vec3(r3);
    // fragColor = blend(fragColor, uColor[2]);
    //uv *= 1.5;
    // float d = 0.5 * min(star(uv, t), star(uv, t - 2.1));
    // d = (1. + 0.1 * sin(t)) * min(d, star(uv, t - 3.1));
    // float dist = sqrt(smoothstep(1., 0., d));
    // //dist = pow(dist, 2.);

    // vec3 fragColor = vec3(dist);
    // vec2 v = rotate2d(t * 0.5) * uv;
    // vec3 color = hsl2rgb(vec3(0., 1., v.x));

    // vec3 newColor = mix(uColor[0], uColor[1], (v.x + v.y));

    // vec3 fragColor = starTexture(1., uv, t) * newColor;
    // vec3 frag_S = starTexture(2., uv, (t)) * newColor;
    // vec3 frag_L = starTexture(.5, uv, sin(t * 2.)) * uColor[2];
    // // fragColor = blend(fragColor, frag_S);
    // //fragColor = blend(frag_L, fragColor);
    // fragColor += 0.1 * (frag_S);
    // fragColor += frag_L;

    // fragColor = blend(fragColor, fragColor);

    // vec3 highlight = starTextureN(1.5, uv, t) * uColor[1];
    // highlight = blend(highlight, highlight);
    // highlight = blend(highlight, highlight);
    // fragColor = blend(fragColor, highlight);
    // fragColor = vec3(1.) - fragColor;
    // fragColor = mix(fragColor, highlight, uv.x);
    // fragColor = highlight;
    //vec3 fragColor2 = vec3(dist * 0.5) * uColor[0];
    //fragColor *= vec3(v.x * 1., v.y * 2., .8 - v.y * v.x);
   // fragColor = fragColor1 + fragColor2;
    fragColor += uLightness;

    //fragColor = vec3(v.x);
    gl_FragColor = vec4(fragColor, 1.);
}