'use client'
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { FileInput } from "@/components/FileInput"
import { getShaderById, getAllShaders, getNextShaderId, getPrevShaderId } from "@/templates/Shader/shaderConfig"
import ShaderSidebar from "@/components/ShaderSidebar"
import { LoadingOverlay } from "@/components/LoadingOverlay"

// Helper function for dynamic imports
const importShader = (shaderId) => {
    const shader = getShaderById(shaderId);
    if (!shader) return null;

    return dynamic(() => import(`@/templates/Shader/${shader.path}`), {
        ssr: false,
        loading: () => null, // 避免默认 loading 状态
    });
};

const ShaderBg = ({ initialShaderId = 'spin', setOverlay, setMockVisible, isMockVisible }) => {
    const [currentShaderId, setCurrentShaderId] = useState(initialShaderId);
    const [ShaderComponent, setShaderComponent] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState('/img/Background.png');
    const [isLoading, setIsLoading] = useState(false);
    const [isComponentLoading, setIsComponentLoading] = useState(false);

    // 处理背景图片和覆盖图片的更新
    useEffect(() => {
        const currentShader = getShaderById(currentShaderId);

        // 先更新背景图片
        if (currentShaderId === 'advancedGradientBlur') {
            setBackgroundImage('/img/Background2.png');
        } else if (currentShaderId === 'progressiveBlur') {
            setBackgroundImage('/img/Background.png');
        }

        // 再更新覆盖图片
        if (currentShaderId === 'advancedGradientBlur') {
            setOverlay?.('/img/EffectOverlay.png');
        } else {
            setOverlay?.('/img/Overlay.png');
        }
    }, [currentShaderId, setOverlay]);

    // 处理着色器组件的动态加载
    useEffect(() => {
        const loadComponent = async () => {
            setIsComponentLoading(true);
            try {
                const Component = await importShader(currentShaderId);
                setShaderComponent(() => Component);
            } finally {
                setIsComponentLoading(false);
            }
        };

        loadComponent();
    }, [currentShaderId]);

    const handleClickNext = () => {
        setCurrentShaderId(getNextShaderId(currentShaderId));
    };

    const handleClickPrev = () => {
        setCurrentShaderId(getPrevShaderId(currentShaderId));
    };

    const currentShader = getShaderById(currentShaderId);
    const isEffectShader = currentShader?.category === 'effect';

    // 渲染着色器组件
    const renderShaderComponent = () => {
        if (!ShaderComponent || isComponentLoading) return null;

        const commonProps = {
            shaderId: currentShaderId,
            setLoading: setIsLoading,
            key: currentShaderId // 强制在切换时重新创建组件
        };

        return isEffectShader ? (
            <ShaderComponent {...commonProps} imageUrl={backgroundImage} />
        ) : (
            <ShaderComponent {...commonProps} />
        );
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading || isComponentLoading} />
            <div className='p-8 z-10 flex flex-col justify-between items-start h-full absolute w-full'>
                <div className='flex flex-row justify-between items-start w-full'>
                    <div>
                        <div className='pb-3'>
                            <h2 className='text-white'>{currentShader?.title}</h2>
                            <h2 className='text-white'>{currentShader?.subtitle}</h2>
                        </div>
                        <a href="https://bytedance.larkoffice.com/wiki/YugMwzAaQiC2V8khsFdc974onQh" target="_blank" rel="noopener noreferrer" className="block">
                            {currentShader?.New ?
                                <p className='text-black text-xs py-2 px-3 bg-white text-opacity-70 font-medium inline rounded-full mr-2'>New</p>
                                : null}
                            {currentShader?.iOS ?
                                <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full mr-2'>iOS</p>
                                : null}
                            {currentShader?.Android ?
                                <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full mr-2'>Android</p>
                                : null}
                            {currentShader?.Lynx ?
                                <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full'>Lynx</p>
                                : null}
                        </a>
                        <ShaderSidebar
                            onSelectShader={setCurrentShaderId}
                            currentShaderId={currentShaderId}
                        />
                    </div>
                    <div className='flex flex-wrap'>
                        <button className='mr-4 text-white linkn link--mneme' onClick={handleClickPrev}>← Prev</button>
                        <button className='mr-4 text-white linkn link--mneme link--mnemeR' onClick={handleClickNext}>Next →</button>
                    </div>
                </div>

                <div className='flex'>
                    {isMockVisible && <FileInput
                        setImageSrc={setOverlay}
                        setBackgroundImage={setBackgroundImage}
                        isEffectShader={isEffectShader}
                    />}
                    <button className='text-white opacity-70 transition-all hover:opacity-100 text-sm' onClick={setMockVisible}>
                        {isMockVisible ? 'Full Screen' : 'Show Mock'}
                    </button>
                </div>
            </div>

            {isMockVisible ? (
                <div className='absolute flex h-full w-full flex-col items-center justify-center'>
                    <Canvas style={{ width: 390 * 0.6 * 1.25, height: 844 * 0.6 * 1.25 }} className='absolute -z-10' id='shaderView'>
                        {renderShaderComponent()}
                    </Canvas>
                </div>
            ) : (
                <Canvas className='absolute flex h-full w-full flex-col items-center justify-center -z-10' id='shaderView'>
                    {renderShaderComponent()}
                </Canvas>
            )}
        </>
    )
}

export { ShaderBg }
