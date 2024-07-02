varying vec3 vNormal;
varying float displacement;
varying vec3 vPos;
varying float vDistort;

uniform vec2  uResolution; 
uniform float uTime;

void main() {
  vPos = position;

  // float t = uTime * uSpeed;
  // float distortion = 0.75 * cnoise(0.43 * position * uNoiseDensity + t);

  vec3 pos = position + normal;
  // vec3 pos = position + normal * distortion * uNoiseStrength;
  // vPos.xy = position.xy - uResolution/2.;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}