varying vec3 vPos;
varying vec3 vColor;
uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uLightness;

void main() {
    vec4 diffuseColor = vec4(vColor + vec3(0.1), 1.);
    if(uLightness >= 0.) {
        diffuseColor = mix(diffuseColor, vec4(1, 1, 1, 1), uLightness);
    } else {
        diffuseColor = mix(diffuseColor, vec4(0, 0, 0, 1), -uLightness);
    }

    vec3 overlay = vec3((1. - vPos.y) * 0.2 + 1.);
    // diffuseColor.rgb = diffuseColor.rgb * overlay;

    gl_FragColor = vec4(diffuseColor.rgb, 1.);
}