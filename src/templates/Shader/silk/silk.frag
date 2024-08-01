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

#define PI 3.1415927

mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec3 RGBColor(vec3 rgb) {
    return vec3(rgb.r / 255., rgb.g / 255., rgb.b / 255.);
}

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 rgb2hsl(in vec3 c) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = c.r;
    float g = c.g;
    float b = c.b;
    float cMin = min(r, min(g, b));
    float cMax = max(r, max(g, b));

    l = (cMax + cMin) / 2.0;
    if(cMax > cMin) {
        float cDelta = cMax - cMin;
        //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
        s = l < .0 ? cDelta / (cMax + cMin) : cDelta / (2.0 - (cMax + cMin));
        if(r == cMax) {
            h = (g - b) / cDelta;
        } else if(g == cMax) {
            h = 2.0 + (b - r) / cDelta;
        } else {
            h = 4.0 + (r - g) / cDelta;
        }

        if(h < 0.0) {
            h += 6.0;
        }
        h = h / 6.0;
    }
    return vec3(h, s, l);
}

float rand(vec2 co, float time) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233 + time / 10000.))) * 43758.5453);
}

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x) - uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    position *= 0.1;
    vec2 uv = vUV;
    vec2 scale = uScale;
    uv.x = (uv.x - 0.5) * (1. - scale.x) + 0.5;
    uv.y = (uv.y - 0.5) * (1. - scale.y) + 0.5;
    // vec2 uv = vec2(vUV.x * uResolution.y / uResolution.x, vUV.y);

    float time = uTime * 0.01 * uSpeed + uTimeOffset;
    vec3 color = uColor[0];

    //vec2 position = vec2(0.5) - uv + uPosition;
    float r = length(position) * 3.;
    float a = atan(position.y, position.x);
    float count = uComplex;
    float morph = 1. - uMorph / 0.7;
    float shape = abs(morph * sin(a * (count * .5) + (time * 0.8 + 0.4))) *
        sin(a * count - (time * 0.8 + 0.2));
    vec3 alpha1 = shape * uColor[2];

    float shape2 = abs(0.2 * sin(a * (count * .5) + (time * 0.8 + 0.5))) *
        cos(a * count * 2. - (time * 0.8 + 0.5));
    shape += shape2;
    vec3 alpha2 = shape2 * uColor[3];

    shape = pow(shape, 1.);

    // color = uBgColor;
    color = mix(color, uColor[1], r);

    // color *= 1. + 0.5;

    float alpha = (1. - smoothstep(shape, shape + 0.8, r)) + (1. - smoothstep(shape, shape + 1.5, r)) * 0.2;
    alpha = clamp(alpha, 0., 1.0);
    // alpha -= 0.1;

    color = mix(uBgColor, color, alpha);

    // color *= alpha;

    // color -= alpha1 * 0.4;
    // color -= alpha2 * 0.4;

    color = mix(uBgColor, color, r * 1.);

    // color -= vec3(0.2);

    if(uLightness >= 0.) {
        color = mix(color, vec3(1, 1, 1), uLightness);
    } else {
        color = mix(color, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(vec3(color), 1.);
}