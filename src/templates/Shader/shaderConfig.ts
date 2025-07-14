// @/templates/Shader/shaderConfig.js

const shaderConfig = {
    spin: {
        id: 'spin',
        title: 'Spin',
        subtitle: '-diffuse',
        iOS: true,
        Android: true,
        Lynx: true,
        New: false,
        path: 'spin/spin',
        category: 'background',
        controls: [
            { name: 'speed', defaultValue: 1.0 },
            { name: 'intensity', defaultValue: 0.5 }
        ],
    },
    progressiveBlur: {
        id: 'progressiveBlur',
        title: 'Progressive Blur',
        subtitle: '-effect',
        iOS: false,
        Android: false,
        Lynx: false,
        New: false,
        path: 'progressiveBlur/progressiveBlur',
        category: 'effect',
    },
    advancedGradientBlur: {
        id: 'advancedGradientBlur',
        title: 'Advanced Gradient Blur',
        subtitle: '-effect',
        iOS: false,
        Android: false,
        Lynx: false,
        New: false,
        path: 'advancedGradientBlur/advancedGradientBlur',
        category: 'effect',
    },
    highlight: {
        id: 'highlight',
        title: 'Highlight',
        subtitle: '-curve',
        iOS: false,
        Android: false,
        Lynx: true,
        New: false,
        path: 'highlight/highlight',
        category: 'background',
    },
    zebraCurve: {
        id: 'zebraCurve',
        title: 'Zebra Gradient',
        subtitle: '-curve',
        iOS: true,
        Android: false,
        Lynx: true,
        New: false,
        path: 'zebraCurve/zebraCurve',
        category: 'background',
    },
    sharpGradient: {
        id: 'sharpGradient',
        title: 'Column Gradient',
        subtitle: '-curve',
        iOS: false,
        Android: false,
        Lynx: true,
        New: false,
        path: 'sharpGradient/sharpGradient',
        category: 'background',
    },
    sharpGradientR: {
        id: 'sharpGradientR',
        title: 'Column Gradient',
        subtitle: '-slash',
        iOS: false,
        Android: false,
        Lynx: true,
        New: false,
        path: 'sharpGradientR/sharpGradientR',
        category: 'background',
    },
    lava: {
        id: 'lava',
        title: 'Lava Gradient',
        subtitle: '-Diffuse',
        iOS: true,
        Android: false,
        Lynx: true,
        New: false,
        path: 'lava/gradientBg',
        category: 'background',
    },
    hole: {
        id: 'hole',
        title: 'Circle Gradient',
        subtitle: '-Hole',
        iOS: false,
        Android: false,
        Lynx: true,
        New: false,
        path: 'hole/circleBg',
        category: 'background',
    },
    // Add other shaders as needed
};

// List of shader IDs in the order you want them to appear
const shaderOrder = [
    'spin',
    'progressiveBlur',
    'advancedGradientBlur',
    'highlight',
    'zebraCurve',
    'sharpGradient',
    'sharpGradientR',
    'lava',
    'hole',
];

// Helper functions
export const getShaderById = (id) => shaderConfig[id] || null;
export const getAllShaders = () => shaderOrder.map(id => shaderConfig[id]);

export const getBackgroundShaders = () =>
    Object.values(shaderConfig).filter(shader => shader.category === 'background');

export const getEffectShaders = () =>
    Object.values(shaderConfig).filter(shader => shader.category === 'effect');

export const getNextShaderId = (currentId) => {
    const currentIndex = shaderOrder.indexOf(currentId);
    if (currentIndex === -1) return shaderOrder[0];
    return shaderOrder[(currentIndex + 1) % shaderOrder.length];
};

export const getPrevShaderId = (currentId) => {
    const currentIndex = shaderOrder.indexOf(currentId);
    if (currentIndex === -1) return shaderOrder[0];
    return shaderOrder[(currentIndex - 1 + shaderOrder.length) % shaderOrder.length];
};
