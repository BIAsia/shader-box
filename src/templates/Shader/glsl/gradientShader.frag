varying vec3 vPos;
uniform vec3 uColor[3];
uniform float uLightness;
uniform float uChroma;

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

void main() {
    vec3 adjustment = vec3(0, uChroma, uLightness);
    // vec3 color1 = hsl2rgb(rgb2hsl(uColor[0]) + adjustment);
    // vec3 color2 = hsl2rgb(rgb2hsl(uColor[1]) + adjustment);
    // vec3 color3 = hsl2rgb(rgb2hsl(uColor[2]) + adjustment);
    // vec3 diffuseColor = vec3(mix(mix(color1, color2, smoothstep(-3.0, 3.0, vPos.x)), color3, vPos.z));
    // diffuseColor = min(max(diffuseColor, vec3(0.)), vec3(1.));
    // vec3 diffuseColor = hsl2rgb(hsldiffuseColor);
    vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(-3.0, 3.0, vPos.x)), uColor[2], vPos.z), 1);
    if(uLightness >= 0.) {
        diffuseColor = mix(diffuseColor, vec4(1, 1, 1, 1), uLightness);
    } else {
        diffuseColor = mix(diffuseColor, vec4(0, 0, 0, 1), -uLightness);
    }

    // vec3 color = diffuseColor.rgb;
    // color = color + ;
    // hslColor = min(max(hslColor, vec3(0.)), vec3(1.));
    // color = rgb2hsl(color);
    // color = hsl2rgb(rgb2hsl(color) + vec3(0., uChroma, 0.));
    // diffuseColor = vec4(lchdiffuseColor);
    gl_FragColor = vec4(diffuseColor.rgb, 1.);
}