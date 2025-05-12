// LevaControls.tsx
import { useControls, folder, button } from 'leva';
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

// 将每种控制类型定义为独立的接口
export interface AnimationConfig {
    speed: number;
    timeOffset: number;
}

export interface ColorConfig {
    color1: string;
    color2: string;
    color3: string;
    color4: string;
    bgColor: string;
    lightness: number;
}

export interface ShapeConfig {
    position: { x: number; y: number };
    scaleX: number;
    scaleY: number;
    complex: number;
    morph: number;
}

export interface BlurConfig {
    amount: number;
    direction: string;
    startPoint: number;
    endPoint: number;
    quality: number;
}

// 组合配置类型
export interface ShaderConfig {
    animation?: AnimationConfig;
    color?: ColorConfig;
    shape?: ShapeConfig;
    blur?: BlurConfig;
}

// 默认配置值
const defaultAnimationConfig: AnimationConfig = {
    speed: 1,
    timeOffset: 0
};

const defaultColorConfig: ColorConfig = {
    color1: '#404a70',
    color2: '#8d99ae',
    color3: '#2b2d42',
    color4: '#2b2d42',
    bgColor: '#000000',
    lightness: 0
};

const defaultShapeConfig: ShapeConfig = {
    position: { x: 0, y: 0 },
    scaleX: 1.0,
    scaleY: 1.0,
    complex: 1,
    morph: 0
};

const defaultBlurConfig: BlurConfig = {
    direction: 'down',
    startPoint: 0.,
    endPoint: 0.4,
    amount: 60,
    quality: 30
};

// 创建一个工厂函数来生成特定的控制钩子
export const createShaderControls = (configTypes: string[], initialConfig?: Partial<ShaderConfig>) => {
    return () => {
        const { scene, camera } = useThree();
        const gl = useThree((state) => state.gl);

        // 初始化配置，只包含需要的部分
        const config: ShaderConfig = {};

        // 动画控制
        let animationControls: AnimationConfig = { ...defaultAnimationConfig };
        if (configTypes.includes('animation')) {
            config.animation = {
                ...defaultAnimationConfig,
                ...initialConfig?.animation
            };

            const [{ speed, timeOffset }, setAnimation] = useControls('animation', () => ({
                animation: folder({
                    speed: {
                        value: config.animation.speed,
                        min: 0,
                        max: 5,
                        onChange: (v) => { config.animation.speed = v },
                        transient: false
                    },
                    timeOffset: {
                        value: config.animation.timeOffset,
                        min: 0,
                        max: 10,
                        onChange: (v) => { config.animation.timeOffset = v },
                        transient: false
                    }
                })
            }));

            animationControls = { speed, timeOffset };
        }

        // 颜色控制
        let colorControls: ColorConfig = { ...defaultColorConfig };
        if (configTypes.includes('color')) {
            config.color = {
                ...defaultColorConfig,
                ...initialConfig?.color
            };

            const [{ color1, color2, color3, color4, bgColor, lightness }, setColor] = useControls('color', () => ({
                color: folder({
                    color1: {
                        value: config.color.color1,
                        onChange: (v) => { config.color.color1 = v },
                        transient: false
                    },
                    color2: {
                        value: config.color.color2,
                        onChange: (v) => { config.color.color2 = v },
                        transient: false
                    },
                    color3: {
                        value: config.color.color3,
                        onChange: (v) => { config.color.color3 = v },
                        transient: false
                    },
                    color4: {
                        value: config.color.color4,
                        onChange: (v) => { config.color.color4 = v },
                        transient: false
                    },
                    bgColor: {
                        value: config.color.bgColor,
                        onChange: (v) => { config.color.bgColor = v },
                        transient: false
                    },
                    lightness: {
                        value: config.color.lightness,
                        min: 0,
                        max: 1,
                        onChange: (v) => { config.color.lightness = v },
                        transient: false
                    }
                })
            }));

            colorControls = { color1, color2, color3, color4, bgColor, lightness };
        }

        // 形状控制
        let shapeControls: ShapeConfig = { ...defaultShapeConfig };
        if (configTypes.includes('shape')) {
            config.shape = {
                ...defaultShapeConfig,
                ...initialConfig?.shape
            };

            const [{ position, scaleX, scaleY, complex, morph }, setShape] = useControls('shape', () => ({
                shape: folder({
                    position: {
                        value: config.shape.position,
                        onChange: (v) => { config.shape.position = v },
                        transient: false
                    },
                    scaleX: {
                        value: config.shape.scaleX,
                        min: 0.1,
                        max: 2,
                        onChange: (v) => { config.shape.scaleX = v },
                        transient: false
                    },
                    scaleY: {
                        value: config.shape.scaleY,
                        min: 0.1,
                        max: 2,
                        onChange: (v) => { config.shape.scaleY = v },
                        transient: false
                    },
                    complex: {
                        value: config.shape.complex,
                        min: 0,
                        max: 10,
                        onChange: (v) => { config.shape.complex = v },
                        transient: false
                    },
                    morph: {
                        value: config.shape.morph,
                        min: 0,
                        max: 1,
                        onChange: (v) => { config.shape.morph = v },
                        transient: false
                    }
                })
            }));

            shapeControls = { position, scaleX, scaleY, complex, morph };
        }

        // 模糊控制
        let blurControls: BlurConfig = { ...defaultBlurConfig };
        if (configTypes.includes('blur')) {
            config.blur = {
                ...defaultBlurConfig,
                ...initialConfig?.blur
            };

            const [{ amount, direction, startPoint, endPoint, quality }, setBlur] = useControls('blur', () => ({
                blur: folder({
                    amount: {
                        value: config.blur.amount,
                        min: 1,
                        max: 100,
                        onChange: (v) => { config.blur.amount = v },
                        transient: false
                    },
                    direction: {
                        value: config.blur.direction,
                        options: ['up', 'down', 'left', 'right'],
                        onChange: (v) => { config.blur.direction = v },
                        transient: false
                    },
                    startPoint: {
                        value: config.blur.startPoint,
                        min: 0,
                        max: 1,
                        onChange: (v) => { config.blur.startPoint = v },
                        transient: false
                    },
                    endPoint: {
                        value: config.blur.endPoint,
                        min: 0,
                        max: 1,
                        onChange: (v) => { config.blur.endPoint = v },
                        transient: false
                    },
                    quality: {
                        value: config.blur.quality,
                        min: 4,
                        max: 56,
                        step: 1,
                        onChange: (v) => { config.blur.quality = v },
                        transient: false
                    }
                })
            }));

            blurControls = { direction, startPoint, endPoint, amount, quality };
        }

        // 更新配置的函数
        const updateConfig = (importedConfig: Partial<ShaderConfig>) => {
            if (importedConfig.animation && config.animation) {
                Object.assign(config.animation, importedConfig.animation);
                // 更新控制面板
            }

            if (importedConfig.color && config.color) {
                Object.assign(config.color, importedConfig.color);
                // 更新控制面板
            }

            if (importedConfig.shape && config.shape) {
                Object.assign(config.shape, importedConfig.shape);
                // 更新控制面板
            }

            if (importedConfig.blur && config.blur) {
                Object.assign(config.blur, importedConfig.blur);
                // 更新控制面板
            }

            console.log('Config updated:', config);
        };

        // 返回值和配置
        return {
            // 动画控制参数
            speed: animationControls.speed,
            timeOffset: animationControls.timeOffset,

            // 颜色控制参数
            color1: colorControls.color1,
            color2: colorControls.color2,
            color3: colorControls.color3,
            color4: colorControls.color4,
            bgColor: colorControls.bgColor,
            lightness: colorControls.lightness,

            // 形状控制参数
            position: shapeControls.position,
            scaleX: shapeControls.scaleX,
            scaleY: shapeControls.scaleY,
            complex: shapeControls.complex,
            morph: shapeControls.morph,

            // 模糊控制参数
            direction: blurControls.direction,
            startPoint: blurControls.startPoint,
            endPoint: blurControls.endPoint,
            amount: blurControls.amount,
            quality: blurControls.quality,

            // 同时保留原有的分组结构，以便向后兼容
            animation: animationControls,
            color: colorControls,
            shape: shapeControls,
            blur: blurControls
        };
    };
};

// 为了向后兼容，保留原来的 useShaderControls
export const useShaderControls = createShaderControls(['animation', 'color', 'shape'], {});
