varying vec3 vPos;
uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uLightness;
uniform vec2 uResolution;
uniform vec2 uPos;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uCol;
uniform float uHue;
uniform float uHasParticle;
uniform float uParticleSize;
uniform vec2 uParticlePos;
uniform bool uIsPolar;
uniform float uColorCol;
// const float PI = 3.14159265358979323846;
#define PI 3.1415927
#define TWO_PI 6.283185

#define ANIMATION_SPEED 1.0
#define MOVEMENT_SPEED 1.5
#define MOVEMENT_DIRECTION vec2(0.7, -1.0)

#define PARTICLE_SIZE 0.005*uParticleSize

#define PARTICLE_SCALE (vec2(0.9, 1.6))
#define PARTICLE_SCALE_VAR (vec2(0.05, 0.2))

#define PARTICLE_BLOOM_SCALE (vec2(0.5, 0.8))
#define PARTICLE_BLOOM_SCALE_VAR (vec2(0.3, 0.1))

#define SPARK_COLOR uColor[1]
#define BLOOM_COLOR uColor[2]
#define SMOKE_COLOR uColor[1]

#define SIZE_MOD 1.05
#define ALPHA_MOD 0.9
#define LAYERS_COUNT 10

float hash1_2(in vec2 x) {
    return fract(sin(dot(x, vec2(52.127, 61.2871))) * 521.582);
}

vec2 hash2_2(in vec2 x) {
    return fract(sin(x * mat2x2(20.52, 24.1994, 70.291, 80.171)) * 492.194);
}

//Simple interpolated noise
vec2 noise2_2(vec2 uv) {
    //vec2 f = fract(uv);
    vec2 f = smoothstep(0.0, 1.0, fract(uv));

    vec2 uv00 = floor(uv);
    vec2 uv01 = uv00 + vec2(0, 1);
    vec2 uv10 = uv00 + vec2(1, 0);
    vec2 uv11 = uv00 + 1.0;
    vec2 v00 = hash2_2(uv00);
    vec2 v01 = hash2_2(uv01);
    vec2 v10 = hash2_2(uv10);
    vec2 v11 = hash2_2(uv11);

    vec2 v0 = mix(v00, v01, f.y);
    vec2 v1 = mix(v10, v11, f.y);
    vec2 v = mix(v0, v1, f.x);

    return v;
}

//Simple interpolated noise
float noise1_2(in vec2 uv) {
    vec2 f = fract(uv);
    //vec2 f = smoothstep(0.0, 1.0, fract(uv));

    vec2 uv00 = floor(uv);
    vec2 uv01 = uv00 + vec2(0, 1);
    vec2 uv10 = uv00 + vec2(1, 0);
    vec2 uv11 = uv00 + 1.0;

    float v00 = hash1_2(uv00);
    float v01 = hash1_2(uv01);
    float v10 = hash1_2(uv10);
    float v11 = hash1_2(uv11);

    float v0 = mix(v00, v01, f.y);
    float v1 = mix(v10, v11, f.y);
    float v = mix(v0, v1, f.x);

    return v;
}

//Rotates point around 0,0
vec2 rotate(in vec2 point, in float deg) {
    float s = sin(deg);
    float c = cos(deg);
    return mat2x2(s, c, -c, s) * point;
}

vec2 randomAround2_2(in vec2 point, in vec2 range, in vec2 uv) {
    return point + (hash2_2(uv) - 0.5) * range;
}

//Cell center from point on the grid
vec2 voronoiPointFromRoot(in vec2 root, in float deg) {
    vec2 point = hash2_2(root) - 0.5;
    float s = sin(deg);
    float c = cos(deg);
    point = mat2x2(s, c, -c, s) * point * 0.66;
    point += root + 0.5;
    return point;
}

float degFromRootUV(in vec2 uv) {
    return uTime * 0.05 * uSpeed * ANIMATION_SPEED * (hash1_2(uv)) * 2.0;
}

vec3 fireParticles(in vec2 uv, in vec2 originalUV) {
    vec3 particles = vec3(0.0);
    vec2 rootUV = floor(uv);
    float deg = degFromRootUV(rootUV);
    vec2 pointUV = voronoiPointFromRoot(rootUV, deg);
    float dist = 1.0;
    float distBloom = 0.0;

   	//UV manipulation for the faster particle movement
    vec2 tempUV = uv + (noise2_2(uv * 2.0) - 0.5) * 0.1;
    tempUV += -(noise2_2(uv * 3.0 + uTime * 0.01 * uSpeed) - 0.5) * 0.07;

    //Sparks sdf
    dist = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_SCALE, PARTICLE_SCALE_VAR, rootUV));

    //Bloom sdf
    distBloom = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_BLOOM_SCALE, PARTICLE_BLOOM_SCALE_VAR, rootUV));

    //Add sparks
    particles += (1.0 - smoothstep(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 3.0, dist)) * SPARK_COLOR;

    //Add bloom
    particles += pow((1.0 - smoothstep(0.0, PARTICLE_SIZE * 6.0, distBloom)) * 1.0, 3.0) * BLOOM_COLOR;

    //Upper disappear curve randomization
    float border = (hash1_2(rootUV) - 0.5) * 2.0;
    float disappear = 1.0 - smoothstep(border, border + 0.5, originalUV.y);

    //Lower appear curve randomization
    border = (hash1_2(rootUV + 0.214) - 1.8) * 0.7;
    float appear = smoothstep(border, border + 0.4, originalUV.y);

    return particles * disappear * appear;
}

//Layering particles to imitate 3D view
vec3 layeredParticles(in vec2 uv, in float sizeMod, in float alphaMod, in int layers, in float smoke) {
    vec3 particles = vec3(0);
    float size = 3.0;
    float alpha = 1.0;
    vec2 offset = vec2(0.0);
    vec2 noiseOffset;
    vec2 bokehUV;

    for(int i = 0; i < layers; i++) {
        //Particle noise movement
        noiseOffset = (noise2_2(uv * size * 2.0 + 0.5) - 0.5) * 0.15;

        //UV with applied movement
        bokehUV = (uv * size + uTime * 0.01 * uSpeed * MOVEMENT_DIRECTION * MOVEMENT_SPEED) + offset + noiseOffset; 

        //Adding particles								if there is more smoke, remove smaller particles
        particles += fireParticles(bokehUV, uv) * alpha * (1.0 - smoothstep(0.0, 1.0, smoke) * (float(i) / float(layers)));

        //Moving uv origin to avoid generating the same particles
        offset += hash2_2(vec2(alpha, alpha)) * 10.0;

        alpha *= alphaMod;
        size *= sizeMod;
    }

    return particles;
}

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
    float t = uTime * 0.15 * (uSpeed * 0.3);
    vec2 uv = coord - vec2(0.5);
    vec2 transUV = vPos.xy / uResolution.xy + 0.5;

    vec3 testLCH = vec3(0.7827, 0.109, uHue);

    testLCH = lch2rgb(testLCH);

    uv -= vec2(uPos.x, -uPos.y);
    vec2 uvColor = uv;

    uv *= rotate2d(t * 0.2);

    // 中心颜色渐变
    float r = length(uv) * 0.5;
    float r0 = length(uvColor) * 0.5;
    float r2 = length(uvColor) * length(uvColor);
    float r3 = min(exp2(3. - 2. * length(uvColor)), 1.);
    vec3 color = mix(uColor[0], uColor[1], r2);
    color = mix(uColor[2], color, r3);

    // color = mix(color, uColor[2], r * 2. - 0.5);
    float a = atan(uv.y, uv.x);
    // float count = 3. + sin(t) * .3;
    float count = uCol;

    // vec3 ColorList[5];
    // ColorList[0] = uColor[0];
    // ColorList[1] = uColor[1];
    // ColorList[2] = uColor[2];
    // ColorList[3] = uColor[3];
    // ColorList[4] = uColor[0];

    vec2 uvPolarColor = vec2(uvColor.x, uvColor.y + uResolution.y * 0.5 + 1.);

    // 多点渐变测试
    vec3 col = RAMP(uColor, r0 * uColorCol);
    float alpha = smoothstep(0., 1., r);
    if(uIsPolar) {
        col = RAMP(uColor, 0.3 * atan(uvPolarColor.y, uvPolarColor.x * 4.));
        col *= alpha;
    }
    //col = RAMP(ColorList, r2 * 0.5) 

    vec3 fragColor = color;
    // vec3 fragColor = color * butterFlyOriginal(a, r, count, t);

    fragColor = color * vec3(butterFlyC(a, r, count, t));
    fragColor = col * vec3(butterFlyC(a, r, count, t));
    // fragColor = col;

    // fragColor *= alpha;

    // fragColor -= 0.5 * uColor[3] * vec3(butterFlyC(a * .5, r * 2., count * .5, t));
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
    if(uLightness >= 0.) {
        fragColor = mix(fragColor, vec3(1, 1, 1), uLightness);
    } else {
        fragColor = mix(fragColor, vec3(0, 0, 0), -uLightness);
    }

    vec3 particles = layeredParticles(coord * 0.3 - vec2(uParticlePos.x, -uParticlePos.y), SIZE_MOD, ALPHA_MOD, LAYERS_COUNT, 3.);
    fragColor += particles * uHasParticle;

    fragColor += uBgColor;

    //fragColor = vec3(v.x);
    gl_FragColor = vec4(fragColor, 1.);
}