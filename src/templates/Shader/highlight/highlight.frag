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
uniform float uHue;
uniform vec2 uDirection;
const float PI = 3.14159265358979323846;

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 mul3(in mat3 m, in vec3 v) {
    return vec3(dot(v, m[0]), dot(v, m[1]), dot(v, m[2]));
}

vec3 lab2lch(in vec3 c) {
    vec3 color = vec3(c.x, sqrt((c.y * c.y) + (c.z * c.z)), atan(c.z, c.y));
    color = vec3(color.x / 100., color.y / 100. * 0.34, color.z * PI * 2. * 360. / 100.);

    return color;
}

vec3 RGB2Lab(in vec3 rgb) {
    float R = rgb.x;
    float G = rgb.y;
    float B = rgb.z;
    // threshold
    float T = 0.008856;

    float X = R * 0.412453 + G * 0.357580 + B * 0.180423;
    float Y = R * 0.212671 + G * 0.715160 + B * 0.072169;
    float Z = R * 0.019334 + G * 0.119193 + B * 0.950227;

    // Normalize for D65 white point
    X = X / 0.950456;
    Y = Y;
    Z = Z / 1.088754;

    bool XT, YT, ZT;
    XT = false;
    YT = false;
    ZT = false;
    if(X > T)
        XT = true;
    if(Y > T)
        YT = true;
    if(Z > T)
        ZT = true;

    float Y3 = pow(Y, 1.0 / 3.0);
    float fX, fY, fZ;
    if(XT) {
        fX = pow(X, 1.0 / 3.0);
    } else {
        fX = 7.787 * X + 16.0 / 116.0;
    }
    if(YT) {
        fY = Y3;
    } else {
        fY = 7.787 * Y + 16.0 / 116.0;
    }
    if(ZT) {
        fZ = pow(Z, 1.0 / 3.0);
    } else {
        fZ = 7.787 * Z + 16.0 / 116.0;
    }

    float L;
    if(YT) {
        L = (116.0 * Y3) - 16.0;
    } else {
        L = 903.3 * Y;
    }
    float a = 500.0 * (fX - fY);
    float b = 200.0 * (fY - fZ);

    return vec3(L, a, b);
}

vec3 lch2lab(in vec3 c) {
    return vec3(c.x, c.y * cos(c.z), c.y * sin(c.z));
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
    coord = vPos.xy + vec2(0.5);
    float t = uTime * 0.15;
    vec2 uv = coord - vec2(0.5);
    vec2 transUV = vPos.xy / uResolution.xy + 0.5;

    vec3 testLCH = vec3(0.7827, 0.109, uHue);

    testLCH = lch2rgb(testLCH);

    vec2 uvColor = uv + vec2(0., -1.0);
    uv += vec2(0., -1.0);

    uv *= rotate2d(t * 0.2);

    // 中心颜色渐变
    float r = length(uv) * 0.5;
    float r0 = length(uvColor) * 0.5;
    float r2 = length(uvColor) * length(uvColor);
    float r3 = min(exp2(3. - 2. * length(uvColor)), 1.);
    vec3 color = mix(uColor[0], uColor[1], r2);
    color = mix(uColor[2], color, r3);

    // 多点渐变测试
    vec3 col = RAMP(uColor, r0 * 0.5);

    // color = mix(color, uColor[2], r * 2. - 0.5);
    float a = atan(uv.y, uv.x);
    // float count = 3. + sin(t) * .3;
    float count = 4.;

    vec3 fragColor = color;
    // vec3 fragColor = color * butterFlyOriginal(a, r, count, t);

    fragColor = color * vec3(butterFlyC(a, r, count, t));
    fragColor = col * vec3(butterFlyC(a, r, count, t));

    fragColor -= 0.5 * uColor[3] * vec3(butterFlyC(a * .5, r * 2., count * .5, t));
    //fragColor -= 0.5 * uColor[1] * vec3(butterFlyOriginal(a * 2., r * .5, count * .15, t));
    // fragColor = vec3(r3);
    // fragColor = blend(fragColor, uColor[0]);
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