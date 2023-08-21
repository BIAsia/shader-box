varying vec3 vPos;
uniform vec2  uResolution;           // viewport resolution (in pixels)
uniform float uTime;                 // shader playback time (in seconds)
uniform vec2 uMouse;
uniform vec3 uColor[4];
uniform float uScale;
uniform vec2 uRoot;
uniform float uMorph;
uniform float uLightness;

vec3 lab2lch( in vec3 c )
{
    return vec3(
        c.x,
        sqrt((c.y*c.y) + (c.z * c.z)),
        atan(c.z,c.y)
    );
}

vec3 lch2lab( in vec3 c )
{
    return vec3(
        c.x,
        c.y*cos(c.z),
        c.y*sin(c.z)
    );
}

vec3 mul3( in mat3 m, in vec3 v )
{
    return vec3(
        dot(v,m[0]),
        dot(v,m[1]),
        dot(v,m[2])
    );
}

vec3 srgb2oklab(vec3 c) 
{
    mat3 m1 = mat3(
        0.4122214708,0.5363325363,0.0514459929,
        0.2119034982,0.6806995451,0.1073969566,
        0.0883024619,0.2817188376,0.6299787005
    );
    
    vec3 lms = mul3(m1,c);

    lms = pow(lms,vec3(1./3.));

    mat3 m2 = mat3(
        +0.2104542553,+0.7936177850,-0.0040720468,
        +1.9779984951,-2.4285922050,+0.4505937099,
        +0.0259040371,+0.7827717662,-0.8086757660
    );
    
    return mul3(m2,lms);
}

vec3 oklab2srgb(vec3 c)
{
    mat3 m1 = mat3(
        1.0000000000,+0.3963377774,+0.2158037573,
        1.0000000000,-0.1055613458,-0.0638541728,
        1.0000000000,-0.0894841775,-1.2914855480
    );

    vec3 lms = mul3(m1,c);
    
    lms = lms * lms * lms;

    mat3 m2 = mat3(
        +4.0767416621,-3.3077115913,+0.2309699292,
        -1.2684380046,+2.6097574011,-0.3413193965,
        -0.0041960863,-0.7034186147,+1.7076147010
    );
    return mul3(m2,lms);
}

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
}

vec3 rgb2vec3(float r, float g, float b){
    return vec3(r/255., g/255., b/255.);
}

float variation(vec2 v1, vec2 v2, float strength, float speed, float time) {
	return sin(
        dot(normalize(v1), normalize(v2)) * strength + time * speed
    ) / 100.0;
}


void main() {
    vec2 coord = vec2(2.0,-2.0)*vPos.xy/uResolution.xy;
    coord.x *= uResolution.x/uResolution.y;

    vec2 uv = coord;

    vec3 color = vec3(1.);
    vec3 color1 = rgb2vec3(20., 248., 221.);
    vec3 color2 = rgb2vec3(158., 255., 82.);
    vec3 color3 = rgb2vec3(20., 111., 248.);

    // color1 = uColor[0];
    // color2 = uColor[1];
    // color3 = uColor[2];

    vec3 color1LAB = srgb2oklab(color1);
    vec3 color2LAB = srgb2oklab(color2);
    vec3 color3LAB = srgb2oklab(color3);
    
    float time = 0.1 * uTime;
    float radius = 0.35;
    vec2 center = vec2(0.);

    vec2 diff = center-uv;
    float len = length(diff);
    
    float curveX = 17.;
    float curveY = 17.;
    float motionY = 2.;
    float motionX = 2.;
    float widthA = 1.2;
    float widthB = 0.01;
    float widthC = 1.6;

    len += variation(diff, vec2(0.0, 0.1), curveX, motionY, time);
    len -= variation(diff, vec2(0.1, 0.0), curveY, motionX, time);
    
    float circleA = smoothstep(radius-widthA, radius, len) - smoothstep(radius, radius+widthA, len);
    float circleB = smoothstep(radius-widthB, radius, len) - smoothstep(radius, radius+widthB, len);
    float circleBR = smoothstep(radius-widthB+0.01, radius, len) - smoothstep(radius, radius+widthB+0.01, len);
    float circleC = smoothstep(radius-widthC, radius, len) - smoothstep(radius, radius+widthC, len);

    


    color = vec3(circleA);
    vec2 v = rotate2d(time) * uv;
    vec2 v2 = rotate2d(time+1.5) * uv;

    vec3 gradient1RGB = mix(mix(1.-color1, 1.-color2, smoothstep(-2., 1., v.x*v.y)), 1.-color3, smoothstep(-1., 2., v2.x*v2.y));
    vec3 gradient2RGB = mix(mix(1.-color1, 1.-color2, smoothstep(-3., 3., circleB)), 1.-color3, smoothstep(-3., 3., circleB));

    vec3 gradient1LAB = mix(mix(1.-color1LAB, 1.-color2LAB, smoothstep(-1., 1., v.x*v.y)), 1.-color3LAB, smoothstep(-2., 2., v2.x*v2.y));
    vec3 gradient1 = oklab2srgb(gradient1LAB);
    vec3 gradient2LAB = mix(mix(1.-color1LAB, 1.-color2LAB, smoothstep(-1., 1., circleB)), 1.-color3LAB, smoothstep(-1., 1., circleB));
    vec3 gradient2 = oklab2srgb(gradient2LAB);


    color *= vec3(v.x+v.y, v.y*v.x, 0.7-v.y*v.x);

    color *= gradient1;
    color *= 0.4*gradient2;

    color *= gradient1RGB;
    color *= gradient2RGB;

    color += 0.2*vec3(circleC);


    
    color -= 0.2 *vec3(circleB);
    
    gl_FragColor = vec4(vec3(1.0) - color, 1.);



    // vec3 lchA = vec3(0.7, 0.5, 340);
    // vec3 lchB = vec3(0.9, 0.5, 200);
    // vec3 lchGradient = mix(lchA, lchB, uv.y);
    // gl_FragColor = vec4(oklab2srgb(lch2lab(lchGradient)), 1.);
    // vec3 labA = lch2lab(lchA), labB = lch2lab(lchB);
    // vec3 lchGradient = 
    // vec3 testLAB = mix(srgb2oklab(uColor[0]), srgb2oklab(uColor[1]), uv.y);
    // vec3 LABcolor = oklab2srgb(testLAB);
    // vec3 test = mix(uColor[0], uColor[1], uv.y);
    // gl_FragColor = vec4(LABcolor, 1.);
    // gl_FragColor = vec4(test, 1.);
    // gl_FragColor = diffuseColor;
}
