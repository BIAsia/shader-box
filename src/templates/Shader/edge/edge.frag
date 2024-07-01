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
const float dots = 50.; //number of lights

vec3 RAMP(vec3 cols[4], float x) {
    x *= float(cols.length() - 1);
    return mix(cols[int(x)], cols[int(x) + 1], smoothstep(0.0, 1.0, fract(x)));
}
//convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
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

vec3 random3(vec3 c) {
    float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0 * j);
    j *= .125;
    r.x = fract(512.0 * j);
    j *= .125;
    r.y = fract(512.0 * j);
    return r - 0.5;
}

float drawLine(float radius, float brightness, vec2 uv, float time) {
    vec2 p = (vPos.xy - .5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    p = uv - vec2(0.5);
    p.y *= uResolution.x / uResolution.y;
    //p.y *= 1.3;
    vec3 c = vec3(0, 0, 0.1); //background color
    for(float i = 0.; i < dots; i++) {
        //read frequency for this dot from audio input channel
        //based on its index in the circle
        float vol = .3;
        float b = vol * brightness;
        //get location of dot
        float x = -0.55;
        float y = i * 0.1 - 0.7;
        vec2 o = vec2(x, y);
        //get color of dot based on its index in the
        //circle + time to rotate colors
        vec3 dotCol = hsv2rgb(vec3((i + time * 10.) / dots, .85, 1.));
        //get brightness of this pixel based on distance to dot
        c += b / (length(p - o)) * dotCol;
    }

    float darkRadius = radius + 0.05;
    //black circle overlay
    float dist = distance(p, vec2(0));
    //c = c * smoothstep(radius, darkRadius, abs(uv.x+0.25));
    //c = c*smoothstep(radius, darkRadius, uv.x);
    // c.r += 0.1*rand(uv, time*0.01);

    c.r = clamp(c.r, 0., 1.6);
    c.r -= 0.6;

    return c.r;
}

void main() {
    vec3 rgb = vec3(0., 1., uTimeOffset);
    vec2 uv = vUV;
    vec2 coord = vec2(vUV.x * uResolution.y / uResolution.x, vUV.y);
    float time = uTime * 0.05 * uSpeed + uTimeOffset * 10.;

    vec3[4] colors;
    colors[0] = uColor[1];
    colors[1] = uColor[1];
    colors[2] = uColor[1];
    colors[3] = uColor[1];
    vec3 color = RAMP(colors, uv.y * 0.5 * abs(cos(time) - 0.8));

    float radius = .25; //radius of light ring
    radius += 0.05 * cos(time * 0.1);
    float brightness = 0.08 + uLightness * 0.1;
    brightness += 0.01 * sin(time * 0.01);

    float col1 = drawLine(radius, brightness, uv, time);
    vec2 uv2 = vec2(1. - uv.x, uv.y);
    float col2 = drawLine(radius, brightness, uv2, time);

    float col = col1 + col2;
    vec4 fragColor = vec4(vec3(col), 1);

    float col3 = drawLine(radius + 0.1 * sin(time), brightness, uv, time);
    float col4 = drawLine(radius + 0.1 * sin(time), brightness, uv2, time);
    vec3 colorOverlay = mix(vec3(0.), uColor[3], col3 + col4);

    fragColor.rgb = color * col + colorOverlay + uBgColor;
    gl_FragColor = vec4(vec3(fragColor.rgb), 1.);

}