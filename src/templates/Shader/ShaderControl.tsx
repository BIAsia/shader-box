// LevaControls.tsx
import { useControls, folder, button } from 'leva';
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export type ShaderConfig = {
    animation: {
        speed: number;
        timeOffset: number;
    };
    color: {
        color1: string;
        color2: string;
        color3: string;
        color4: string;
        bgColor: string;
        lightness: number;
    };
    shape: {
        position: { x: number; y: number };
        scaleX: number;
        scaleY: number;
        complex: number;
        morph: number;
    };
};

export const useShaderControls = (initialConfig?: Partial<ShaderConfig>) => {
    const { scene, camera } = useThree();
    const gl = useThree((state) => state.gl);

    // Initialize config with default values or provided values
    const config: ShaderConfig = {
        animation: {
            speed: initialConfig?.animation?.speed ?? 1,
            timeOffset: initialConfig?.animation?.timeOffset ?? 0
        },
        color: {
            color1: initialConfig?.color?.color1 ?? '#404a70',
            color2: initialConfig?.color?.color2 ?? '#8d99ae',
            color3: initialConfig?.color?.color3 ?? '#2b2d42',
            color4: initialConfig?.color?.color4 ?? '#2b2d42',
            bgColor: initialConfig?.color?.bgColor ?? '#000000',
            lightness: initialConfig?.color?.lightness ?? 0
        },
        shape: {
            position: initialConfig?.shape?.position ?? { x: 0, y: 0 },
            scaleX: initialConfig?.shape?.scaleX ?? 1.0,
            scaleY: initialConfig?.shape?.scaleY ?? 1.0,
            complex: initialConfig?.shape?.complex ?? 1,
            morph: initialConfig?.shape?.morph ?? 0
        }
    };

    // Capture Image
    useControls({
        'Capture Image': button(() => {
            requestAnimationFrame(() => {
                gl.render(scene, camera);
                const link = document.createElement('a');
                link.setAttribute('download', 'canvas.png');
                link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
                link.click();
            });
        }),
    });

    // Export/Import Config
    useControls({
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
    });

    // Animation controls
    const [{ speed, timeOffset }, setAnimation] = useControls('animation', () => ({
        animation: folder({
            speed: {
                value: config.animation.speed,
                min: 0,
                max: 10,
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
        }, { collapsed: false })
    }));

    // Color controls
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
                min: -1,
                max: 1,
                onChange: (v) => { config.color.lightness = v },
                transient: false
            }
        })
    }));

    // Shape controls
    const [{ position, scaleX, scaleY, complex, morph }, setShape] = useControls('shape', () => ({
        shape: folder({
            position: {
                value: config.shape.position,
                step: 0.01,
                onChange: (v) => { config.shape.position = v },
                transient: false
            },
            scaleX: {
                value: config.shape.scaleX,
                min: 0.1,
                max: 10,
                onChange: (v) => { config.shape.scaleX = v },
                transient: false
            },
            scaleY: {
                value: config.shape.scaleY,
                min: 0.1,
                max: 10,
                onChange: (v) => { config.shape.scaleY = v },
                transient: false
            },
            complex: {
                value: config.shape.complex,
                min: 1,
                max: 20,
                step: 1,
                onChange: (v) => { config.shape.complex = v },
                transient: false
            },
            morph: {
                value: config.shape.morph,
                min: -1,
                max: 1,
                onChange: (v) => { config.shape.morph = v },
                transient: false
            }
        })
    }));

    // Function to update config from imported data
    const updateConfig = (importedConfig: Partial<ShaderConfig>) => {
        if (importedConfig.animation) {
            const animationUpdate = { ...importedConfig.animation };
            Object.assign(config.animation, importedConfig.animation);
            setAnimation(animationUpdate);
        }

        if (importedConfig.color) {
            const colorUpdate = { ...importedConfig.color };
            Object.assign(config.color, importedConfig.color);
            setColor(colorUpdate);
        }

        if (importedConfig.shape) {
            const shapeUpdate = { ...importedConfig.shape };
            Object.assign(config.shape, importedConfig.shape);
            setShape(shapeUpdate);
        }

        console.log('Config updated:', config);
    };

    // Return values and config for use in shader component
    return {
        animation: { speed, timeOffset },
        color: { color1, color2, color3, color4, bgColor, lightness },
        shape: { position, scaleX, scaleY, complex, morph },
        config,
        updateConfig
    };
};
