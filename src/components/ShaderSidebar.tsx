import React from 'react';
import { getBackgroundShaders, getEffectShaders } from '../templates/Shader/shaderConfig';

interface ShaderSidebarProps {
    onSelectShader: (shaderId: string, shaderTitle: string) => void;
    currentShaderId?: string;
}

const ShaderSidebar: React.FC<ShaderSidebarProps> = ({ onSelectShader, currentShaderId }) => {
    const backgroundShaders = getBackgroundShaders();
    const effectShaders = getEffectShaders();

    return (
        <div className="z-10 mt-12 p-1 text-white max-w-[250px]">
            <div className="mb-12">
                <h3 className="text-xs font-medium uppercase mb-2 opacity-50">Dynamic</h3>
                <ul className="space-y-2">
                    {backgroundShaders.map((shader) => (
                        <li key={shader.id}>
                            <button
                                onClick={() => onSelectShader(shader.id, shader.title)}
                                className={`mr-4 text-white linkn link--mneme link--mnemeR ${currentShaderId === shader.id ? 'bg-white/20' : ''
                                    }`}
                            >
                                {shader.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="text-xs font-medium uppercase mb-2 opacity-50">Effect</h3>
                <ul className="space-y-2">
                    {effectShaders.map((shader) => (
                        <li key={shader.id}>
                            <button
                                onClick={() => onSelectShader(shader.id, shader.title)}
                                className={`mr-4 text-white linkn link--mneme link--mnemeR ${currentShaderId === shader.id ? 'bg-white/20' : ''
                                    }`}
                            >
                                {shader.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ShaderSidebar;