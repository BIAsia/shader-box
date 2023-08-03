'use client'
import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import CircleBg from '@/templates/Shader/circleBg'
import GradientBg from '@/templates/Shader/gradientBg'
import TextureBg from '@/templates/Shader/textureFlowBg/textureBg'
import { FileInput } from "@/components/FileInput"

// export const metadata = {

// }

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
    ssr: false,
    loading: () => (
        <div className='absolute flex h-96 w-full flex-col items-center justify-center'>
            <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
            </svg>
        </div>
    ),
})

const ShaderBg = ({ shader, title, subtitle, setOverlay }) => {
    const shaders = [
        <GradientBg />,
        <CircleBg />,
        <TextureBg />
    ]
    const titles = [
        { title: 'Lava Gradient', subtitle: '-Diffuse' },
        { title: 'Circle Gradient', subtitle: '-Diffuse' },
        { title: 'Zebra Flow', subtitle: '-Sharp' },
    ]
    const [currentShader, setCurrentShader] = useState(0)
    const handleClickNext = () => {
        setCurrentShader((oldShader) => (oldShader + 1) % shaders.length);
    }
    const handleClickPrev = () => {
        setCurrentShader((oldShader) => (oldShader - 1 + shaders.length) % shaders.length);
    };

    return (
        <>
            <div className='p-8 z-10 flex flex-col justify-between items-start h-full'>
                <div>
                    <div className='pb-6'>
                        <h2 className='text-white'>{titles[currentShader].title}</h2>
                        <h2 className='text-white'>{titles[currentShader].subtitle}</h2>
                    </div>
                    <div>
                        <button className='mr-4 text-white linkn link--mneme' onClick={handleClickPrev}>Prev</button>
                        <button className='mr-4 text-white linkn link--mneme' onClick={handleClickNext}>Next</button>
                    </div>
                </div>

                <FileInput setImageSrc={setOverlay}></FileInput>
            </div>
            <View className='absolute flex h-full w-full flex-col items-center justify-center -z-10'>
                {shaders[currentShader]}
            </View>
        </>

    )
}

export { ShaderBg }