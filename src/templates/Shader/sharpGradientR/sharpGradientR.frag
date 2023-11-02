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
    // coord.x *= uResolution.x/uResolution.y;
    // vec2 coord = 2.0*gl_FragCoord.xy/uResolution - vec;

    vec3 oklab1 = srgb2oklab(uColor[0]);
    vec3 oklab2 = srgb2oklab(uColor[1]);
    vec3 oklab3 = srgb2oklab(uColor[2]);
    vec3 oklab4 = srgb2oklab(uColor[3]);

    float col = uCol;

    vec2 st = vec2(coord.x, coord.y);
    st.x *= col;

    float h = 0.;

    float pointA = 0.4;
    float pointB = 0.9;

    // float frag_1 = coord.y/h;
    // float frag_2 = (coord.y-h) / (1.-h);

    float speed = uTime * (5.) * 0.01;

    float steper = floor(st.x) + 0.1;
    steper *= cos(speed * 0.1);
    vec3 fragColor = vec3(coord.y);
    // coord.y += 0.2;

    pointA = 0.5 * (floor(st.x + 2.) / col);
    coord.y += (cos(steper) + 2.) * 0.1;
    // coord.y += cos(steper(speed*0.01));
    // coord.y += abs(0.01*cos(steper*speed*0.01));
    coord.y -= 0.8 * sin(steper * speed * uSpeed * 0.01);
    // vec3 gradientA = mix(uColor[0], uColor[1],clamp(coord.y/pointA, 0., 1.));
    // vec3 gradientB = mix(uColor[1], uColor[2],clamp((coord.y-pointA)/(pointB-pointA), 0., 1.));
    // vec3 gradientC = mix(uColor[2], uColor[3], clamp(1.-(1.-coord.y)/(1.-pointB), 0., 1.));
    vec3 gradientA = mix(oklab1, oklab2, clamp(coord.y / pointA, 0., 1.));
    vec3 gradientB = mix(oklab2, oklab3, clamp((coord.y - pointA) / (pointB - pointA), 0., 1.));
    vec3 gradientC = mix(oklab3, oklab4, clamp(1. - (1. - coord.y) / (1. - pointB), 0., 1.));

        // fragColor = gradientC;

    fragColor = mix(gradientA, gradientB, step(pointA, coord.y));
        // fragColor = mix(gradientA, gradientB, step(pointA, coord.y));
    fragColor = mix(fragColor, gradientC, step(pointB, coord.y));
    fragColor = oklab2srgb(fragColor);

    fragColor += uLightness;

    // vec3 fragColor = mix(mix(uColor[0], uColor[1], frag_1), mix(uColor[1], uColor[2], frag_2), step(h, coord.y));
    // coord.y *= 1.5;
    // for (int i = 0; i < int(col); i++ ){
    //     // st.y += 0.03*floor(st.x)/col;
    //     // h += steper*floor(st.x)/col;
    //     // h = clamp(h, 0., 1.);
    //     // pointA += steper*floor(st.x)/col;
    //     // coord.y += 0.05*floor(st.x)/col;
    //     // coord.y += clamp(steper*floor(st.x)/col, -1., 1.);

    //     // fragColor = mix(mix(uColor[0], uColor[1], st.y/h), mix(uColor[1], uColor[2], (st.y-h) / (1.-h)), step(h, st.y));
    // }

    // fragColor = gradientA;

    // fragColor = mix(fragColor, gradientC, step(pointB, coord.y));

    // fragColor = vec3(coord.y);

    // float line = 0.2*(3.5-uMorph)*sin(coord.y*uDirection.y+coord.x*uDirection.x);
    // float line = fract((2.*coord.y)*(25.));

    // float line = fract((2.*coord.y+coord.x*uEffect)*(25.+uDensity*0.005));
    // vec4 color = vec4(vec3(smoothstep(.1,.2,line-coord.y*0.5 ) ),1.0);
    // vec4 color = vec4(vec3(smoothstep(.1,.3,line-coord.x*0.5*coord.y) ),1.0);
    // vec4 diffuseColor = vec4(mix(uColor[0], uColor[1], smoothstep(.1,.4,line-coord.x*uPosEffect.x*coord.y*uPosEffect.y)), uColor[2]);
    // vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(.1,.4,coord.x*0.5*coord.y)), uColor[2], coord.z),1);

    gl_FragColor = vec4(fragColor, 1.);
}