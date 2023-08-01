varying vec3 vPos;
uniform vec3 uColor[3];
uniform float uLightness;

void main() {
    vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(-3.0, 3.0, vPos.x)), uColor[2], vPos.z),1);
    gl_FragColor = vec4(diffuseColor.rgb+uLightness, 1.);
}