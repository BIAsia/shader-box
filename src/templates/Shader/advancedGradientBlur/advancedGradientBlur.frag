varying vec3 vPos;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uImgPosition;
uniform vec2 uImgSize;
uniform vec3 uGradientColor;

// 贴图
uniform sampler2D uTexture;

// Blur 相关参数 - 按照 tsx 接口调整
uniform float uRepeats;     // 重复次数

uniform float uEdgeRatio;
uniform bool uIsBottom;     // 新增：控制图片是否放在底部

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

float getGradient(float projectedPos, float startPoint, float endPoint) {
  float t = (projectedPos - startPoint) / (endPoint - startPoint);
  t = clamp(t, 0.0, 1.0);

  // 组合线性插值和smoothstep以获得更均匀的渐变
  float smoothT = smoothstep(0.0, 1.0, t);
  float gradient = mix(t, smoothT, 0.7); // 0.7是线性和平滑之间的混合因子，可以调整

  // 反转渐变方向
  if(gradient - 0. > 0.001)
    gradient = 1.0 - gradient;
  return gradient;
}

float gradientSmooth(float y, float startPoint, float endPoint) {
  if(startPoint > endPoint) {
    return 0.0;
  }
  return smoothstep(startPoint, endPoint, y);
}

void main() {
  // 坐标转换
  vec2 uv = vec2((vPos.x / uResolution.x) + 0.5, -(vPos.y / uResolution.y) + 0.5);
  vec2 adjustedUV, imgBoundary;
  vec3 box;
  float blurGradient, overlayGradient;

  if(!uIsBottom) {
    adjustedUV = vec2((uv.x - uImgPosition.x) / uImgSize.x, (uImgPosition.y - uv.y + uImgSize.y) / uImgSize.y);
    imgBoundary = step(uImgPosition, uv) * step(vec2(1.0) - uImgPosition - uImgSize, vec2(1.0) - uv);
    box = vec3(imgBoundary.x * imgBoundary.y);
    blurGradient = gradientSmooth(uv.y, uImgSize.y * (uEdgeRatio + 0.1), uImgSize.y * 1.5);
    overlayGradient = gradientSmooth(uv.y, uImgSize.y * uEdgeRatio, uImgSize.y * 1.5);
    // uv.y = 1.0 - uv.y;
  } else {
    uv.y = 1.0 - uv.y;
    adjustedUV = vec2((uv.x - uImgPosition.x) / uImgSize.x, (uv.y - uImgPosition.y) / uImgSize.y);
    imgBoundary = step(uImgPosition, uv) * step(vec2(1.0) - uImgPosition - uImgSize, vec2(1.0) - uv);
    box = vec3(imgBoundary.x * imgBoundary.y);
    blurGradient = gradientSmooth(uv.y, uImgSize.y * (uEdgeRatio + 0.1), uImgSize.y * 1.5);
    overlayGradient = gradientSmooth(uv.y, uImgSize.y * uEdgeRatio, uImgSize.y * 1.5);
  }

  // // 图片叠加 - 直接使用原始坐标
  // vec2 adjustedUV = vec2((uv.x - uImgPosition.x) / uImgSize.x, (uImgPosition.y - uv.y + uImgSize.y) / uImgSize.y);

  // 根据位置调整UV坐标计算

  // if(uIsBottom) {
  // // 底部放置：图片在底部，延伸顶部区域
  //   adjustedUV = vec2((uv.x - uImgPosition.x) / uImgSize.x, (uv.y - uImgPosition.y) / uImgSize.y);
  // } else {
  // // 顶部放置：图片在顶部，延伸底部区域（原逻辑）

  // }

  // if(uIsBottom) {
  // // 底部放置：从图片顶部边缘开始向上渐变
  //   float imgTop = uImgPosition.y + uImgSize.y;
  //   blurGradient = gradientSmooth(uv.y, imgTop - uImgSize.y * 0.1, imgTop + uImgSize.y * 0.9);
  //   overlayGradient = gradientSmooth(uv.y, imgTop - uImgSize.y * uEdgeRatio, imgTop + uImgSize.y * 0.9);
  // } else {
  // // 顶部放置：从图片底部边缘开始向下渐变（原逻辑）
  //   blurGradient = gradientSmooth(uv.y, uImgSize.y * (uEdgeRatio + 0.1), uImgSize.y * 1.5);
  //   overlayGradient = gradientSmooth(uv.y, uImgSize.y * uEdgeRatio, uImgSize.y * 1.5);
  // }

  float amount = 0.0008 * 200.;
  // 应用模糊效果 - blur逻辑保持不变，但texture采样会自动扩展边缘像素
  vec4 final = vec4(blur(adjustedUV, uTexture, amount, blurGradient), 1.);

  // 输出
  // gl_FragColor = vec4(box * final.rgb, box);

  // 调试用 - 显示渐变
  // vec3 temp = vec3(overlayGradient) * uGradientColor;
  final = mix(final, vec4(uGradientColor, 1.), overlayGradient);
  gl_FragColor = vec4(final);
  // gl_FragColor = vec4(temp, 1.);
}
