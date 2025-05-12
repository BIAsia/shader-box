import React from 'react';
import { getShaderById } from '../templates/Shader/shaderConfig';

const ShaderHeader = ({ currentShaderId = 'spin' }) => {
    const shaderInfo = getShaderById(currentShaderId);

    if (!shaderInfo) {
        return null;
    }

    return (
        <div className="absolute top-0 left-0 p-6 z-10">
            <h1 className="text-3xl font-bold text-white">{shaderInfo.title}</h1>
            {shaderInfo.description && (
                <p className="text-white/70 mt-2">{shaderInfo.description}</p>
            )}

            {/* 平台支持信息 */}
            {shaderInfo.platforms && (
                <div className="flex space-x-2 mt-3">
                    {shaderInfo.platforms.ios && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">iOS</span>
                    )}
                    {shaderInfo.platforms.android && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">Android</span>
                    )}
                    {shaderInfo.platforms.web && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">Web</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShaderHeader;