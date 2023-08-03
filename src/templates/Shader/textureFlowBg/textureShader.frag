varying vec3 vPos;
uniform vec3 uColor[3];
uniform float uLightness;
uniform vec2  uResolution;
uniform vec2 uPosEffect;
uniform float uEffect;
uniform float uDensity;

void main() {
    vec2 uv = gl_FragCoord.xy/uResolution;
    // vec2 coord = 2.0*gl_FragCoord.xy/uResolution - vec2(1.0);
    vec2 coord = 2.0*gl_FragCoord.xy/uResolution;

    float line = fract((2.*coord.y+coord.x*uEffect)*(25.+uDensity*0.005));

    vec4 color = vec4(vec3(smoothstep(.1,.3,line-vPos.x*0.5*vPos.y) ),1.0);
    vec4 diffuseColor = vec4(mix(uColor[0], uColor[1], smoothstep(.1,.4,line-vPos.x*uPosEffect.x*vPos.y*uPosEffect.y)), uColor[2]);
    // vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(.1,.4,line-vPos.x*0.5*vPos.y)), uColor[2], vPos.z),1);
    gl_FragColor = vec4(diffuseColor);
}