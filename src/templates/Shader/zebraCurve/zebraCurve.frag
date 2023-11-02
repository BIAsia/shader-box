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
    // vec2 coord = vec2(2.0,-2.0)*vPos.xy/uResolution.xy;
    vec2 coord = vPos.xy / uResolution.xy + vec2(0.5);
    vec3 oklab1 = uColor[0];
    vec3 oklab2 = uColor[1];
    vec3 oklab3 = uColor[2];
    vec3 oklab4 = uColor[3];

    // vec3 fragColor = mix(oklab1, oklab2, (coord.x * coord.y + 0.5 * sin(uTime * 0.01)));
    vec3 fragColor = mix(oklab1, oklab2, (coord.x * coord.y));

    vec4 black = vec4(0., 0., 0., 1.);

    float speed = uTime * 0.5 * uSpeed;
    float col = 2. + abs(25. - uCol);

    coord *= 7.;
    for(float i = 0., v; i++ < 70.;) {
        v = 9. - i / 6. + 2. * cos(coord.x + sin(i / 6. + speed * 0.01)) - coord.y, black = mix(black, vec4(int(mod(i, col))), smoothstep(0., 0.2 / uResolution.y, v));
    }
    black.rgb += oklab3;
    fragColor += 0.2 * oklab4;

    gl_FragColor = vec4(fragColor * black.rgb + uLightness, 1.);
}