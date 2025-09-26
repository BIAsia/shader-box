varying vec3 vPos;
varying vec2 vUV;

void main() {
    vec3 pos = position;
    vUV = uv;
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}