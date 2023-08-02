varying vec3 vPos;
uniform vec3 uColor[3];
uniform float uLightness;
uniform vec2  uResolution;

void main() {
    vec2 uv = gl_FragCoord.xy/uResolution;
    // vec2 coord = 2.0*gl_FragCoord.xy/uResolution - vec2(1.0);
    vec2 coord = 2.0*gl_FragCoord.xy/uResolution;

    float line = fract((2.*coord.y)*25.);

    vec4 color = vec4(vec3( smoothstep(.1,.3,abs(line-.5)) ),1.0);
    vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(-3.0, 3.0, vPos.x)), uColor[2], vPos.z),1);
    gl_FragColor = vec4(color+1.);
}