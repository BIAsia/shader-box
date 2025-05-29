// LevaControls.tsx
import { useControls, folder, button } from 'leva';
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useState, useEffect } from 'react';
import { getShaderById } from './shaderConfig';

// 添加 shader 类型定义
interface ShaderMetadata {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    type?: string;
    iOS?: boolean;
    Android?: boolean;
    Lynx?: boolean;
    New?: boolean;
    path: string;
}

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

export interface GradientConfig {
    hasGradient: boolean;
    gradientColor: string;
}

export interface BlurConfig {
    amount: number;
    direction: string;
    startPoint: number;
    endPoint: number;
    quality: number;
}

export interface AIGenerateConfig {
    customText: string;
}

// 组合配置类型
export interface ShaderConfig {
    shaderId?: string;
    aiGenerate?: AIGenerateConfig;
    animation?: AnimationConfig;
    color?: ColorConfig;
    shape?: ShapeConfig;
    blur?: BlurConfig;
    gradient?: GradientConfig;
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

const defaultGradientConfig: GradientConfig = {
    hasGradient: false,
    gradientColor: '#B8E0F8'
};

const defaultBlurConfig: BlurConfig = {
    direction: 'vertical',
    startPoint: 1.,
    endPoint: 0.4,
    amount: 200,
    quality: 30
};

const defaultAIGenerateConfig: AIGenerateConfig = {
    customText: ''
};

// 创建一个工厂函数来生成特定的控制钩子
export const createShaderControls = (configTypes: string[], initialConfig?: Partial<ShaderConfig>) => {
    return () => {
        const { scene, camera } = useThree();
        const gl = useThree((state) => state.gl);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        // 初始化配置，只包含需要的部分
        const config: ShaderConfig = {
            shaderId: initialConfig?.shaderId || 'spin',
            ...initialConfig
        };

        // AI Generate 控制
        let aiGenerateControls: AIGenerateConfig = { ...defaultAIGenerateConfig };
        let setAIGenerate: (values: Partial<AIGenerateConfig>) => void = () => { };

        const generateShaderParams = async (prompt: string) => {
            try {
                setIsLoading(true);
                setError(null);

                // 获取当前着色器信息
                const currentShader = getShaderById(config.shaderId || 'spin') as ShaderMetadata;
                if (!currentShader) {
                    throw new Error('Invalid shader configuration');
                }

                // 确定着色器类型
                let shaderType = currentShader.type;
                if (!shaderType) {
                    // 根据着色器特征推断类型
                    if (currentShader.subtitle?.includes('-diffuse') ||
                        currentShader.subtitle?.includes('-Diffuse')) {
                        shaderType = 'dynamic';
                    } else if (currentShader.subtitle?.includes('-effect')) {
                        shaderType = 'effect';
                    } else if (currentShader.subtitle?.includes('-curve')) {
                        shaderType = 'curve';
                    }
                }

                const response = await fetch('/api/generate-params', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt,
                        shaderId: currentShader.id,
                        shaderCategory: currentShader.category,
                        shaderType,
                        currentParams: {
                            color: config.color,
                            shape: config.shape
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate parameters');
                }

                const data = await response.json();

                // 更新颜色和形状参数
                if (config.color && data.color) {
                    setColor({
                        color1: data.color.color1,
                        color2: data.color.color2,
                        color3: data.color.color3,
                        color4: data.color.color4,
                        bgColor: data.color.bgColor,
                        lightness: data.color.lightness
                    });
                }

                if (config.shape && data.shape) {
                    setShape({
                        position: data.shape.position,
                        scaleX: data.shape.scaleX,
                        scaleY: data.shape.scaleY,
                        complex: data.shape.complex,
                        morph: data.shape.morph
                    });
                }
            } catch (error) {
                console.error('Error generating parameters:', error);
                setError(error instanceof Error ? error.message : 'Failed to generate parameters');
            } finally {
                setIsLoading(false);
            }
        };

        const generateRandomPrompt = (shaderId: string) => {
            const shader = getShaderById(shaderId) as ShaderMetadata;
            if (!shader) return 'Generate artistic shader parameters';

            const basePrompts = {
                background: {
                    dynamic: [
                        'Create a subtle and elegant background pattern',
                        'Design a professional background with muted colors',
                        'Generate a sophisticated low-contrast pattern',
                        'Create a refined background suitable for text overlay'
                    ],
                    default: [
                        'Create a mesmerizing background pattern',
                        'Design an elegant abstract background',
                        'Generate a dynamic flowing background',
                        'Create a subtle geometric pattern'
                    ]
                },
                effect: [
                    'Design a stunning visual effect',
                    'Create an eye-catching blur effect',
                    'Generate a smooth transition effect',
                    'Design a professional visual filter'
                ]
            };

            const styleAdjectives = shader.type === 'dynamic' ?
                ['subtle', 'refined', 'professional', 'sophisticated', 'elegant', 'muted'] :
                ['modern', 'elegant', 'vibrant', 'subtle', 'dynamic', 'minimalist', 'bold', 'sophisticated'];

            const colorThemes = shader.type === 'dynamic' ?
                [
                    'professional and understated',
                    'subtle and sophisticated',
                    'deep and muted',
                    'refined and balanced',
                    'elegant and subdued'
                ] :
                [
                    'warm and inviting',
                    'cool and calming',
                    'bright and energetic',
                    'soft and soothing',
                    'rich and deep',
                    'light and airy'
                ];

            const prompts = shader.category === 'background' ?
                (shader.type === 'dynamic' ? basePrompts.background.dynamic : basePrompts.background.default) :
                basePrompts.effect;

            const basePrompt = prompts[Math.floor(Math.random() * prompts.length)];
            const adjective = styleAdjectives[Math.floor(Math.random() * styleAdjectives.length)];
            const theme = colorThemes[Math.floor(Math.random() * colorThemes.length)];

            return `${basePrompt} with a ${adjective} style that feels ${theme}`;
        };

        const [{ customText }, setAIGenerateValues] = useControls('AI Generate', () => ({
            'Random': button(() => {
                const randomPrompt = generateRandomPrompt(config.shaderId);
                generateShaderParams(randomPrompt);
            }, {
                disabled: isLoading
            }),
            customText: {
                value: '',
                label: 'Custom'
            },
            'Generate': button(() => {
                if (customText.trim()) {
                    generateShaderParams(customText.trim());
                }
            }, {
                disabled: isLoading
            })
        }), [isLoading]);

        aiGenerateControls = { customText };
        setAIGenerate = setAIGenerateValues;

        // 动画控制
        let animationControls: AnimationConfig = { ...defaultAnimationConfig };
        let setAnimation: (values: Partial<AnimationConfig>) => void = () => { };
        if (configTypes.includes('animation')) {
            config.animation = {
                ...defaultAnimationConfig,
                ...initialConfig?.animation
            };

            const [{ speed, timeOffset }, setAnimationValues] = useControls('animation', () => ({

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

            }));

            animationControls = { speed, timeOffset };
            setAnimation = setAnimationValues;
        }

        // 颜色控制
        let colorControls: ColorConfig = { ...defaultColorConfig };
        let setColor: (values: Partial<ColorConfig>) => void = () => { };
        if (configTypes.includes('color')) {
            config.color = {
                ...defaultColorConfig,
                ...initialConfig?.color
            };

            const [{ color1, color2, color3, color4, bgColor, lightness }, setColorValues] = useControls('color', () => ({

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

            }));

            colorControls = { color1, color2, color3, color4, bgColor, lightness };
            setColor = setColorValues;
        }

        // 形状控制
        let shapeControls: ShapeConfig = { ...defaultShapeConfig };
        let setShape: (values: Partial<ShapeConfig>) => void = () => { };
        if (configTypes.includes('shape')) {
            config.shape = {
                ...defaultShapeConfig,
                ...initialConfig?.shape
            };

            const [{ position, scaleX, scaleY, complex, morph }, setShapeValues] = useControls('shape', () => ({

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

            }));

            shapeControls = { position, scaleX, scaleY, complex, morph };
            setShape = setShapeValues;
        }

        // 渐变控制
        let gradientControls: GradientConfig = { ...defaultGradientConfig };
        let setGradient: (values: Partial<GradientConfig>) => void = () => { };
        if (configTypes.includes('gradient')) {
            config.gradient = {
                ...defaultGradientConfig,
                ...initialConfig?.gradient
            };

            const [{ hasGradient, gradientColor }, setGradientValues] = useControls('gradient', () => ({

                hasGradient: {
                    value: config.gradient.hasGradient,
                    onChange: (v) => { config.gradient.hasGradient = v },
                    transient: false
                },
                gradientColor: {
                    value: config.gradient.gradientColor,
                    onChange: (v) => { config.gradient.gradientColor = v },
                    transient: false
                }

            }));

            gradientControls = { hasGradient, gradientColor };
            setGradient = setGradientValues;
        }

        // 模糊控制
        let blurControls: BlurConfig = { ...defaultBlurConfig };
        let setBlur: (values: Partial<BlurConfig>) => void = () => { };
        if (configTypes.includes('blur')) {
            config.blur = {
                ...defaultBlurConfig,
                ...initialConfig?.blur
            };

            const [{ amount, direction, startPoint, endPoint, quality }, setBlurValues] = useControls('blur', () => ({

                amount: {
                    value: config.blur.amount,
                    min: 1,
                    max: 200,
                    onChange: (v) => { config.blur.amount = v },
                    transient: false
                },
                direction: {
                    value: config.blur.direction,
                    options: ['horizontal', 'vertical'],
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

            }));

            blurControls = { direction, startPoint, endPoint, amount, quality };
            setBlur = setBlurValues;
        }

        // 添加截图、导入导出配置功能
        useControls('utilities', () => ({
            'Capture Image': button(() => {
                requestAnimationFrame(() => {
                    gl.render(scene, camera);
                    const link = document.createElement('a');
                    link.setAttribute('download', 'canvas.png');
                    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
                    link.click();
                });
            }),
            'Export Config': button(() => {
                console.log(config);
                const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const configUrl = URL.createObjectURL(configBlob);
                const link = document.createElement('a');
                link.setAttribute('download', 'config.json');
                link.setAttribute('href', configUrl);
                link.click();
            }),
            'Import Config': button(() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = async (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const importedConfig = JSON.parse(text);
                    updateConfig(importedConfig);
                };
                input.click();
            })
        }));

        // 更新配置的函数
        const updateConfig = (importedConfig: Partial<ShaderConfig>) => {
            if (importedConfig.animation && config.animation) {
                const animationUpdate = { ...importedConfig.animation };
                Object.assign(config.animation, importedConfig.animation);
                setAnimation(animationUpdate);
            }

            if (importedConfig.color && config.color) {
                const colorUpdate = { ...importedConfig.color };
                Object.assign(config.color, importedConfig.color);
                setColor(colorUpdate);
            }

            if (importedConfig.shape && config.shape) {
                const shapeUpdate = { ...importedConfig.shape };
                Object.assign(config.shape, importedConfig.shape);
                setShape(shapeUpdate);
            }

            if (importedConfig.gradient && config.gradient) {
                const gradientUpdate = { ...importedConfig.gradient };
                Object.assign(config.gradient, importedConfig.gradient);
                setGradient(gradientUpdate);
            }

            if (importedConfig.blur && config.blur) {
                const blurUpdate = { ...importedConfig.blur };
                Object.assign(config.blur, importedConfig.blur);
                setBlur(blurUpdate);
            }

            console.log('Config updated:', config);
        };

        // 返回值和配置
        return {
            // AI Generate 参数
            customText: aiGenerateControls.customText,
            isLoading,
            error,

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

            // 渐变控制参数
            hasGradient: gradientControls.hasGradient,
            gradientColor: gradientControls.gradientColor,

            // 模糊控制参数
            direction: blurControls.direction,
            startPoint: blurControls.startPoint,
            endPoint: blurControls.endPoint,
            amount: blurControls.amount,
            quality: blurControls.quality,

            // 同时保留原有的分组结构，以便向后兼容
            aiGenerate: aiGenerateControls,
            animation: animationControls,
            color: colorControls,
            shape: shapeControls,
            gradient: gradientControls,
            blur: blurControls,

            // 添加更新配置函数，以便外部调用
            updateConfig
        };
    };
};

// 为了向后兼容，保留原来的 useShaderControls
export const useShaderControls = createShaderControls(['animation', 'color', 'shape'], {});
