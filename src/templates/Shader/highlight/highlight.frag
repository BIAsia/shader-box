varying vec3 vPos;

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

float butterFlyOriginal(in float a, in float r, in float count, in float t) {
    // 中心向外四散的图形
    float shape = abs(cos(a * (count * 3.) + (t * 0.8))) * sin(a * count - (t * 0.8));
    // 收敛边缘
    float alpha = (1. - smoothstep(shape, shape + 0.8, r));
    alpha += (1. - smoothstep(shape, shape + 1.5, r)) * 0.2;
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

//see link in description for the source of those transfer function
float transfer(float v) {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * pow(v, 0.4166666666666667) - 0.055;
}

vec3 transfer(vec3 v) {
    return vec3(transfer(v.x), transfer(v.y), transfer(v.z));
}

// slightly rearranged vector components so it matches with LCH
vec3 lch2rgb(vec3 lch) {
    // lch.y *= 0.34;
    lch.z /= 360.;

    vec3 lab = vec3(lch.x, lch.y * cos(lch.z * PI * 2.0), lch.y * sin(lch.z * PI * 2.0));

    vec3 lms = vec3(lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z, lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z, lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z);

    lms = pow(max(lms, vec3(0.0)), vec3(3.0));

    vec3 rgb = vec3(+4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z, -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z, -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.7076147010 * lms.z);

    rgb = transfer(rgb);
    return rgb;
}

vec3 RAMP(vec3 cols[4], float x) {
    x *= float(cols.length() - 1);
    return mix(cols[int(x)], cols[int(x) + 1], smoothstep(0.0, 1.0, fract(x)));
}

void main() {
    vec2 coord = vPos.xy / uResolution.xy + vec2(0.5);
    vec2 position = vec2(vPos.x * 1. / (uScale.x), vPos.y * 1. / uScale.y);
    coord = position + vec2(0.5);
    float t = uTime * 0.15 * (uSpeed * 0.3) + uTimeOffset;
    vec2 uv = coord - vec2(0.5);
    vec2 transUV = vPos.xy / uResolution.xy + 0.5;

    uv -= vec2(uPosition.x, -uPosition.y);
    vec2 uvColor = uv;

    uv *= rotate2d(t * 0.2);

    // 中心颜色渐变
    float r = length(uv) * 0.5;
    float r0 = length(uvColor) * 0.5;
    float r2 = length(uvColor) * length(uvColor);
    float r3 = min(exp2(3. - 2. * length(uvColor)), 1.);
    vec3 color = mix(uColor[0], uColor[1], r2);
    color = mix(uColor[2], color, r3);

    float a = atan(uv.y, uv.x);
    float count = uComplex + 1.;

    vec2 uvPolarColor = vec2(uvColor.x, uvColor.y + uResolution.y * 0.5 + 1.);

    // 多点渐变测试
    vec3 col = RAMP(uColor, r0 * (uMorph + 0.2));
    float alpha = smoothstep(0., 1., r);

    vec3 fragColor = color;

    fragColor = color * vec3(butterFlyC(a, r, count, t));
    fragColor = col * vec3(butterFlyC(a, r, count, t));

    if(uLightness >= 0.) {
        fragColor = mix(fragColor, vec3(1, 1, 1), uLightness);
    } else {
        fragColor = mix(fragColor, vec3(0, 0, 0), -uLightness);
    }

    fragColor += uBgColor;
    gl_FragColor = vec4(fragColor, 1.);
}