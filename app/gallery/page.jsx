'use client'
import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ShaderPreview } from '@/components/ShaderPreview'

import { getShaderParams } from '@/components/ShaderBg'
import { getAllShaders } from '@/templates/Shader/shaderConfig'

const shaderConfigs = getAllShaders().map(shader => ({
    id: shader.id,
    name: shader.name || shader.id,
    params: getShaderParams(shader.id)
}))

export default function GalleryPage() {
    return (
        <div className="min-h-screen w-full bg-gray-900 p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Shader Gallery</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shaderConfigs.map((config) => (
                    <ShaderPreview
                        key={config.id}
                        shaderId={config.id}
                        name={config.name}
                        params={config.params}
                    />
                ))}
            </div>
        </div>
    )
}
