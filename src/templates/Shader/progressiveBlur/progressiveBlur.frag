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

vec3 draw(sampler2D image, vec2 uv) {
  return texture2D(image, vec2(uv.x, uv.y)).rgb;
}

// 模糊函数
vec3 blur(vec2 uv, sampler2D image, float blurAmount, float gradient) {
  vec3 blurredImage = vec3(0.0);
  float angleStep = 2.0 * 3.14159265 / uRepeats;

  for(float i = 0.; i < uRepeats; i++) {
    float angle = i * angleStep;
    float randVal1 = rand(vec2(i, uv.x + uv.y));
    vec2 offset1 = vec2(cos(angle), sin(angle)) * (randVal1 + blurAmount) * blurAmount * gradient;
    // 应用方向向量影响
    offset1 = offset1 * length(uDirection) + uDirection * blurAmount * gradient * 0.5;
    vec2 uv1 = uv + offset1;
    blurredImage += texture2D(image, uv1).rgb;
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

  // 计算渐变因子 - 使用 startPoint 和 endPoint 控制模糊范围
  float gradient;

  // 根据方向计算归一化位置
  float normalizedPos;

  if(abs(uDirection.x) > abs(uDirection.y)) {
    // 水平方向模糊
    normalizedPos = (vPos.x / uResolution.x) + 0.5; // 0-1范围

    if(uDirection.x > 0.0) {
      // 从左到右
      gradient = 1.0 - smoothstep(uStartPoint, uEndPoint, 1.0 - normalizedPos);
    } else {
      // 从右到左
      gradient = 1.0 - smoothstep(uStartPoint, uEndPoint, normalizedPos);
    }
  } else {
    // 垂直方向模糊
    normalizedPos = (-vPos.y / uResolution.y) + 0.5; // 0-1范围

    if(uDirection.y > 0.0) {
      // 从上到下
      gradient = 1.0 - smoothstep(uStartPoint, uEndPoint, normalizedPos);
    } else {
      // 从下到上
      gradient = 1.0 - smoothstep(uStartPoint, uEndPoint, 1.0 - normalizedPos);
    }
  }
  float amount = 0.001 * uAmount + 0.02;
  // 应用模糊效果
  vec4 final = vec4(blur(adjustedUV, uTexture, amount, gradient), 1.);

  // 输出
  gl_FragColor = vec4(box * final.rgb, box);

  // vec3 temp = vec3(gradient);
  // gl_FragColor = vec4(final.rgb, box);
}