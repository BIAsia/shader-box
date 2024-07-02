varying vec3 vPos;

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

float hash11(float p) {
    vec3 p3 = fract(vec3(p) * 443.8975);
    p3 += dot(p3, p3.yzx + 19.19);
    return 2.0 * fract((p3.x + p3.y) * p3.z) - 1.0;
}

float noise(float t) {
    float i = floor(t);
    float f = fract(t);

    return mix(hash11(i) * f, hash11(i + 1.0) * (f - 1.0), f);
}

vec3 jodieReinhardTonemap(vec3 c) {
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    vec3 tc = c / (c + 1.0);

    return mix(c / (l + 1.0), tc, tc);
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233 + uTime / 10000.))) * 43758.5453);
}

void main() {
    vec2 position = vec2(vPos.x * 1. / (uScale.x), vPos.y * 1. / uScale.y);
    vec2 coord = vec2(2.0, -2.0) * position.xy / uResolution.xy + vec2(-1.0, 1.0);
    coord.x *= uResolution.x / uResolution.y;

    coord = vec2(coord.x, 1.0 - coord.y);

    vec2 delta = vec2(noise(uTime), noise(uTime + 60.0)) * abs(noise(20.0 * uTime));
    float posGlitch = pow(noise(uTime), .6) * 0.4;

    vec2 pCenter = vec2(uResolution.xy / 2.);

    vec2 mouse = vec2(pCenter) / vec2(uResolution.x);

    // vec2  uv = (2. * vPos.xy - uResolution.xy) / uResolution.y,
    vec2 uv = -(2. * vPos.xy - uResolution.xy) / uResolution.y, center = uPosition, p1 = vec2(-.4 - length(mouse), 0) + center - mouse, p2 = vec2(.4 + length(mouse), 0) + center + mouse;

    uv = vec2(2.0 - uv.x, 1.0 - uv.y);

    float speed = uSpeed + 3., time = uTime * speed + uTimeOffset, radius = 2.65 + 0.4 * sin(time), thickness = 1.4 + 2.8, dist = distance(vPos.xy, center), dist1 = distance(vPos.xy, p1 + vec2(sin(time * 0.05))), dist2 = distance(vPos.xy, p2 - vec2(sin(time * 0.05)));

    radius = 2.65 + 0.4 * sin(time) * 1.5;
    thickness = uMorph + 2.4;

    vec4 ring = vec4(smoothstep(thickness / 2., 0., abs(dist - radius)));
    vec4 ring1 = vec4(smoothstep(thickness / 2., 0.0, abs(dist1 - radius)));
    vec4 ring2 = vec4(smoothstep(thickness / 2., .0, abs(dist2 - radius)));

    ring1.rgb = pow(ring1.rgb, vec3(2.2));
    ring2.rgb = pow(ring2.rgb, vec3(2.2));

    ring1.rgb = pow(ring1.rgb, vec3(1.0 / 2.2));
    ring2.rgb = pow(ring2.rgb, vec3(1.0 / 2.2));

    // vec3 colorRed = mix(uColor[0], uColor[1], vPos.y);
    vec3 colorRed = 1. - uColor[0];
    vec3 colorBlue = uColor[1];

    float beamWidth1 = abs(4.0 / (10.0 * (2. * radius - 1. * uTime)));
    float beamWidth2 = abs(4.0 / (10.0 * (2. * radius - 1. * uTime)));

    vec4 horBeam1 = vec4(beamWidth1 * ((colorRed) - 0.6), 1.);
    vec4 horBeam2 = vec4(beamWidth2 * ((colorBlue) - 0.6), 1.);

    vec4 ringRed = ring1 * vec4(colorRed, 1.);
    vec4 ringBlue = ring2 * vec4(colorBlue, 1.);

    vec4 min = min(ringBlue, ringRed);
    vec4 max = max(ringBlue, ringRed);
    vec4 fragColor = min;
    //fragColor = ringRed*(0.5+sin(posGlitch)) + ringBlue*(0.5-sin(posGlitch));

    vec2 uvRatio = vec2(0.0, length(uv) * 0.3);
    float ratio = uvRatio.y + 0.4 - 0.7;

    //fragColor = 0.25/(fragColor*fragColor);

    vec3 overlay = jodieReinhardTonemap(ringRed.rgb);
    //fragColor += vec4(overlay, 0.1);

    fragColor.rgb = mix(fragColor.rgb, uColor[2], ratio);

    // vec4 diffuseColor = vec4(mix(mix(uColor[0], uColor[1], smoothstep(-3.0, 3.0, vPos.x)), uColor[2], vPos.z),1);

    gl_FragColor = fragColor + vec4(uColor[3] + 0.1, 1.0) + uLightness;
}
