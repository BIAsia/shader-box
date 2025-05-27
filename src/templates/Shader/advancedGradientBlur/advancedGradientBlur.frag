varying vec3 vPos;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uImgPosition;
uniform vec2 uImgSize;

// 贴图
uniform sampler2D uTexture;

// Blur 相关参数 - 按照 tsx 接口调整
uniform vec2 uDirection;    // 模糊方向向量
uniform float uStartPoint;  // 起始点
uniform float uEndPoint;    // 结束点
uniform float uAmount;      // 模糊量
uniform float uRepeats;     // 重复次数

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 扩展的texture采样函数 - 对超出边界的UV进行边缘像素扩展
vec3 sampleTextureExtended(sampler2D tex, vec2 uv) {
  // 将UV坐标限制到边缘像素
  vec2 clampedUV = clamp(uv, 0.0, 1.0);
  return texture2D(tex, clampedUV).rgb;
}

vec3 draw(sampler2D image, vec2 uv) {
  return sampleTextureExtended(image, uv);
}

// 模糊函数 - 保持原有逻辑，但使用扩展的texture采样
vec3 blur(vec2 uv, sampler2D image, float blurAmount, float gradient) {
  vec3 blurredImage = vec3(0.0);
  float angleStep = 2.0 * 3.14159265 / uRepeats;

  for(float i = 0.; i < uRepeats; i++) {
    float angle = i * angleStep;
    float randVal1 = rand(vec2(i, uv.x + uv.y));
    vec2 offset1 = vec2(cos(angle), sin(angle)) * (randVal1 + blurAmount) * blurAmount * gradient;
    // 应用方向向量影响
    // offset1 = offset1 * length(uDirection) + uDirection * blurAmount * gradient * 0.5;
    vec2 uv1 = uv + offset1;
    // 使用扩展的texture采样函数
    blurredImage += sampleTextureExtended(image, uv1);
  }

  return blurredImage / uRepeats;
}

// 旋转
mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

void main() {
  // 坐标转换
  vec2 uv = vec2((vPos.x / uResolution.x) + 0.5, -(vPos.y / uResolution.y) + 0.5);

  // 图片叠加 - 直接使用原始坐标
  vec2 adjustedUV = vec2((uv.x - uImgPosition.x) / uImgSize.x, (uImgPosition.y - uv.y + uImgSize.y) / uImgSize.y);

  // 图片卡片边界
  vec2 imgBoundary = step(uImgPosition, uv) * step(vec2(1.0) - uImgPosition - uImgSize, vec2(1.0) - uv);
  vec3 box = vec3(imgBoundary.x * imgBoundary.y);

  // 计算渐变因子 - 使用更均匀的渐变方式
  float gradient;

  // 归一化方向向量
  vec2 normDirection = normalize(uDirection);

  // 计算归一化坐标 (0-1范围)
  vec2 normalizedCoord = vec2((vPos.x / uResolution.x) + 0.5, (-vPos.y / uResolution.y) + 0.5);

  // 计算投影位置 - 将坐标投影到方向向量上
  float projectedPos = dot(normalizedCoord - vec2(0.5), normDirection) + 0.5;

  // 根据方向向量的符号调整投影方向
  if(dot(normDirection, vec2(1.0, 1.0)) < 0.0) {
    projectedPos = 1.0 - projectedPos;
  }

  // 使用改进的平滑过渡
  float t = (projectedPos - uStartPoint) / (uEndPoint - uStartPoint);
  t = clamp(t, 0.0, 1.0);

  // 组合线性插值和smoothstep以获得更均匀的渐变
  float smoothT = smoothstep(0.0, 1.0, t);
  gradient = mix(t, smoothT, 0.7); // 0.7是线性和平滑之间的混合因子，可以调整

  // 反转渐变方向
  gradient = 1.0 - gradient;

  float amount = 0.0008 * uAmount;
  // 应用模糊效果 - blur逻辑保持不变，但texture采样会自动扩展边缘像素
  vec4 final = vec4(blur(adjustedUV, uTexture, amount, gradient), 1.);

  // 输出
  gl_FragColor = vec4(box * final.rgb, box);

  // 调试用 - 显示渐变
  // vec3 temp = vec3(gradient);
  gl_FragColor = vec4(final);
}
