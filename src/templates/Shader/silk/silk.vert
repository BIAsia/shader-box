//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0 / 7.0; // N=7
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

varying vec3 vNormal;
varying float displacement;
varying vec3 vPos;
varying vec3 vColor;
varying float vDistort;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uTimeOffset;

uniform vec2 uPosition;
uniform vec2 uScale;
uniform float uRotate;

uniform vec3 uColor[4];
uniform vec3 uBgColor;
uniform float uComplex;
uniform float uMorph;

void main() {
  float t = uTime * uSpeed * 0.002 + uTimeOffset + 1.;

  vec3 pos = position * vec3(0.2, 15.7, 1.) + vec3(uPosition.x + 0.3, uPosition.y + 0.3, 0);
  pos = vec3(pos.x * uScale.x, pos.y * uScale.y, pos.z);
  vPos = pos;

  // noise
  vec2 noiseCoord = pos.xy * vec2((2. - uScale.x), uScale.y);
  float noise = snoise(vec3(noiseCoord.x + t, noiseCoord.y + t, t));
  noise = max(0., noise);

  float noiseb = snoise(vec3(noiseCoord.x + t, noiseCoord.y + t, t));
  noiseb = max(0., noiseb);

  float tilt = -14.8 * pos.y;
  float incline = uv.x * 2.5;
  float offset = incline * mix(uPosition.x, uPosition.y, position.y);

  vec3 vPosition = vec3(position.x, position.y, position.z + noise * 0.4 + noiseb * 0.4 + offset);

  vColor = uBgColor;
  for(int i = 0; i < 10; i++) {

    float noiseFlow = 2.2 + float(i) * 0.7; // move speed
    float noiseSpeed = 0.6 + float(i) * 0.3; // flesh speed

    float noiseSeed = 13. + float(i) * 20.;
    vec2 noiseFreq = vec2(.27, .06) * 0.5 * (uComplex);

    float noiseFloor = 0.007;
    float noiseCeil = 1.2 + uMorph + float(i) * 0.07;

    float noise = smoothstep(noiseFloor, noiseCeil, snoise(vec3(noiseCoord.x * noiseFreq.x + t * noiseFlow, noiseCoord.y * noiseFreq.y, t * noiseSpeed + noiseSeed)));
    noise = clamp(noise, 0., 1.);
    float colori = mod(float(i), 4.);
    vColor = mix(vColor, uColor[int(colori)], noise);
  }

  vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 50. / -mvPosition.z;

}