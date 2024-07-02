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

vec3 rgb2vec3(float r, float g, float b) {
    return vec3(r / 255., g / 255., b / 255.);
}

float aa_noise(float t, int num_samples) {
    float sum = 0.0;
    float weight_sum = 0.0;
    float aa_range = 1.0 / float(num_samples);

    for(int j = 0; j < num_samples; j++) {
        float offset = aa_range * (float(j) + 0.5);
        float sample_t = t + offset;
        float i = floor(sample_t);
        float f = fract(sample_t);
        float sample_value = mix(hash11(i) * f, hash11(i + 1.0) * (f - 1.0), f);

        float weight = 1.0 - abs(offset * 2.0 - 1.0);
        sum += sample_value * weight;
        weight_sum += weight;
    }

    return sum / weight_sum;
}

float noise(float t) {
    float i = floor(t);
    float f = fract(t);

    return mix(hash11(i) * f, hash11(i + 1.0) * (f - 1.0), f);
}

float hash12(vec2 p) {
    vec3 k = vec3(0.3183099, 0.3678794, 43758.5453);
    p = fract(p * k.x);
    p += dot(p, p + k.y);
    return fract(p.x * p.y * k.z);
}

float noise_vec2(vec2 t) {
    vec2 i = floor(t);
    vec2 f = fract(t);
    vec2 u = smoothstep(0.0, 1.0, f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

float aa_noise_vec2(vec2 t, int num_samples) {
    float sum = 0.0;
    float weight_sum = 0.0;
    vec2 aa_range = vec2(1.0) / float(num_samples);

    for(int j = 0; j < num_samples; j++) {
        for(int k = 0; k < num_samples; k++) {
            vec2 offset = vec2(float(j) + 0.5, float(k) + 0.5) * aa_range;
            vec2 sample_t = t + offset;
            float sample_value = noise_vec2(sample_t);

            float weight_x = 1.0 - abs(offset.x * 2.0 - 1.0);
            float weight_y = 1.0 - abs(offset.y * 2.0 - 1.0);
            float weight = weight_x * weight_y;
            sum += sample_value * weight;
            weight_sum += weight;
        }
    }

    return sum / weight_sum;
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
    vec2 coord = vec2(2.0, -2.0) * vPos.xy / uResolution.xy + vec2(-1.0, 1.0);
    coord.x *= uResolution.x / uResolution.y;

    coord = vec2(coord.x, 1.0 - coord.y);

    vec2 delta = vec2(aa_noise(uTime, 4), aa_noise(uTime + 60.0, 4)) * abs(aa_noise(20.0 * uTime, 4));
    float posGlitch = pow(aa_noise(uTime, 4), .6) * 0.4;

    vec2 pCenter = vec2(uResolution.xy / 2.);

    vec2 mouse = vec2(pCenter) / vec2(uResolution.x);

    // vec2  uv = (2. * vPos.xy - uResolution.xy) / uResolution.y,
    vec2 uv = -(2. * vPos.xy - uResolution.xy) / uResolution.y, center = vec2(2., 0.), p1 = vec2(-.4 - length(mouse), 0) + center - mouse, p2 = vec2(.4 + length(mouse), 0) + center + mouse;

    uv = vec2(2.0 - uv.x, 1.0 - uv.y);

    float speed = uSpeed, time = uTime * speed + uTimeOffset * 10., radius = 2.65 + 0.4 * sin(time * 0.1) * length(mouse), thickness = 1.4 + 2.8 * length(mouse), dist = distance(vPos.xy, center), dist1 = distance(vPos.xy, p1 + vec2(0., 0.)), dist2 = distance(vPos.xy, p2 - vec2(0., 0.));

    // + sin(distance(iMouse.xy, center))*0.4

    p1 = vec2(-.0, 0) + center;
    p2 = vec2(.0, 0) + center;
    radius = 3.25 + 0.4 * sin(time * 0.1) * (uComplex);
    thickness = uMorph * 3. + 4.;
    // mouse = vec2(-pCenter) / vec2(uResolution.x);
    vec2 position = vec2(vPos.x * 1. / (uScale.x), vPos.y * 1. / uScale.y);
    dist1 = distance(position, uPosition);

    // radius *= uScale;

    vec4 ring = vec4(smoothstep(thickness / 2., 0., abs(dist1 - radius)));
    vec4 ring1 = vec4(smoothstep(thickness / 2., 0.0, abs(dist1 - radius)));
    vec4 ring2 = vec4(smoothstep(thickness / 2., .0, abs(dist1 - radius)));

    ring1.rgb = pow(ring1.rgb, vec3(2.2));
    ring2.rgb = pow(ring2.rgb, vec3(2.2));

    ring1.rgb = pow(ring1.rgb, vec3(1.0 / 2.2));
    ring2.rgb = pow(ring2.rgb, vec3(1.0 / 2.2));

    vec4 fragColor = vec4(mix(uColor[0], uColor[1], ring1.rgb), 1.);
    fragColor = vec4(mix(fragColor.rgb, uColor[2], smoothstep(thickness / 2., 0., dist1 - radius * 0.7)), 1.);
    fragColor = vec4(mix(uBgColor, fragColor.rgb, smoothstep(thickness / 2., 0., abs(dist1 - radius))), 1.);

    if(uLightness >= 0.) {
        fragColor.rgb = mix(fragColor.rgb, vec3(1, 1, 1), uLightness);
    } else {
        fragColor.rgb = mix(fragColor.rgb, vec3(0, 0, 0), -uLightness);
    }

    gl_FragColor = fragColor;
}