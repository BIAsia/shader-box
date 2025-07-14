'use client'
import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'

import { getShaderById } from '@/templates/Shader/shaderConfig'

const ShaderComponent = {}

    // Dynamically import all shaders
    ;[
        'spin',
        'progressiveBlur',
        'advancedGradientBlur',
        'highlight',
        'zebraCurve',
        'sharpGradient',
        'sharpGradientR',
        'lava',
        'hole'
    ].forEach(id => {
        const config = getShaderById(id)
        if (config) {
            ShaderComponent[id] = dynamic(
                () => import(`@/templates/Shader/${config.path}`),
                { ssr: false }
            )
        }
    })

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        if (this.props.onError) {
            this.props.onError(error)
        }
    }

    render() {
        if (this.state.hasError) {
            return null
        }
        return this.props.children
    }
}

export function ShaderPreview({ shaderId, name, params }) {
    const [isHovered, setIsHovered] = useState(false)
    const [staticImage, setStaticImage] = useState(null)
    const canvasRef = useRef()

    useEffect(() => {
        // Capture static frame when component mounts
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png')
            setStaticImage(dataUrl)
        }
    }, [])

    const ShaderToRender = ShaderComponent[shaderId]

    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const handleShaderError = (err) => {
        console.error(`Error loading shader ${shaderId}:`, err)
        setError(true)
    }

    return (
        <div
            className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer bg-gray-800"
            onMouseEnter={() => !error && setIsHovered(true)}
            onMouseLeave={() => !error && setIsHovered(false)}
        >
            {error ? (
                <div className="absolute inset-0 flex items-center justify-center text-red-500">
                    Failed to load shader
                </div>
            ) : !isHovered && staticImage ? (
                <img
                    src={staticImage}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <div className="w-full h-full">
                    <Canvas ref={canvasRef} className="w-full h-full">
                        {ShaderToRender && (
                            <ErrorBoundary onError={handleShaderError}>
                                <ShaderToRender {...params} />
                            </ErrorBoundary>
                        )}
                    </Canvas>
                </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                <h3 className="text-lg font-semibold">{name}</h3>
            </div>
        </div>
    )
}
