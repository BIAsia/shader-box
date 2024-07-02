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

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x) + uPosition.x, vPos.y * 1. / uScale.y + uPosition.y);
    vec2 coord = position / uResolution.xy + vec2(0.5);

    vec3 oklab1 = srgb2oklab(uColor[0]);
    vec3 oklab2 = srgb2oklab(uColor[1]);
    vec3 oklab3 = srgb2oklab(uColor[2]);
    vec3 oklab4 = srgb2oklab(uColor[3]);

    float col = uComplex + 4.;

    vec2 st = vec2(coord.x, coord.y);
    st.x *= col;

    float h = 0.;

    float pointA = 0.4 * (uPosition.y + 1.);
    float pointB = 0.9 + uMorph;

    float speed = uTime * (5.) * 0.05 * uSpeed + uTimeOffset;

    float steper = floor(st.x) + 0.1;
    steper *= cos(speed * 0.1);
    vec3 fragColor = vec3(coord.y);

    pointA = 0.5 * (floor(st.x + 2.) / col);
    coord.y += (cos(steper) + 2.) * 0.1;

    coord.y -= 0.8 * sin(steper * speed * uSpeed * 0.01);

    vec3 gradientA = mix(oklab1, oklab2, clamp(coord.y / pointA, 0., 1.));
    vec3 gradientB = mix(oklab2, oklab3, clamp((coord.y - pointA) / (pointB - pointA), 0., 1.));
    vec3 gradientC = mix(oklab3, oklab4, clamp(1. - (1. - coord.y) / (1. - pointB), 0., 1.));

    fragColor = mix(gradientA, gradientB, step(pointA, coord.y));
    fragColor = mix(fragColor, gradientC, step(pointB, coord.y));
    fragColor = oklab2srgb(fragColor);

    if(uLightness >= 0.) {
        fragColor.rgb = mix(fragColor.rgb, vec3(1, 1, 1), uLightness);
    } else {
        fragColor.rgb = mix(fragColor.rgb, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = vec4(fragColor, 1.);
}