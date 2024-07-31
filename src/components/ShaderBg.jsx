'use client'
import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'

import { FileInput } from "@/components/FileInput"

const GradientBg = dynamic(() => import("@/templates/Shader/lava/gradientBg"), {
    ssr: true,
})

const TextureBg = dynamic(() => import("@/templates/Shader/textureFlowBg/textureBg"), {
    ssr: false,
})

const CircleBg = dynamic(() => import("@/templates/Shader/hole/circleBg"), {
    ssr: false,
})

const TwoCircleBg = dynamic(() => import("@/templates/Shader/twoCircleBg/twoCircleBg"), {
    ssr: false,
})

const ShinyCircleBg = dynamic(() => import("@/templates/Shader/shinyCircleBg/shinyCircleBg"), {
    ssr: false,
})

const SharpGradientBg = dynamic(() => import("@/templates/Shader/sharpGradient/sharpGradient"), {
    ssr: false,
})
const SharpGradientRBg = dynamic(() => import("@/templates/Shader/sharpGradientR/sharpGradientR"), {
    ssr: false,
})

const ZebraCurveBg = dynamic(() => import("@/templates/Shader/zebraCurve/zebraCurve"), {
    ssr: false,
})

const PortalBg = dynamic(() => import("@/templates/Shader/portal/portal"), {
    ssr: false,
})

const HighlightBg = dynamic(() => import("@/templates/Shader/highlight/highlight"), {
    ssr: false,
})

const SpinBg = dynamic(() => import("@/templates/Shader/spin/spin"), {
    ssr: false,
})

const EdgeBg = dynamic(() => import("@/templates/Shader/edge/edge"), {
    ssr: false,
})

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

const ShaderBg = ({ shader, title, subtitle, setOverlay, setMockVisible, isMockVisible }) => {
    const shaders = [
        // <EdgeBg />,
        <SpinBg />,
        <HighlightBg />,
        <ZebraCurveBg />,
        <SharpGradientBg />,
        <SharpGradientRBg />,
        <GradientBg />,
        // <TextureBg />,
        <CircleBg />,
        // <TwoCircleBg />,
        // <ShinyCircleBg />,

    ]
    const titles = [
        // { title: 'Edge', subtitle: '-diffuse' },
        { title: 'Spin', subtitle: '-diffuse', iOS: true, Android: true, Lynx: true },
        { title: 'Highlight', subtitle: '-curve', iOS: false, Android: false, Lynx: true },
        { title: 'Zebra Gradient', subtitle: '-curve', iOS: true, Android: false, Lynx: true },
        { title: 'Column Gradient', subtitle: '-curve', iOS: false, Android: false, Lynx: true },
        { title: 'Column Gradient', subtitle: '-slash', iOS: false, Android: false, Lynx: true },
        { title: 'Lava Gradient', subtitle: '-Diffuse', iOS: true, Android: true, Lynx: true },
        // { title: 'Lava Gradient', subtitle: '-Zebra' },
        { title: 'Circle Gradient', subtitle: '-Hole', iOS: false, Android: false, Lynx: true },
        // { title: 'Circle Gradient', subtitle: '-Double' },
        // { title: 'Circle Gradient', subtitle: '-OKLAB' },

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
            <div className='p-8 z-10 flex flex-col justify-between items-start h-full absolute w-full'>
                <div className='flex flex-row justify-between items-start w-full'>
                    <div>
                        <div className='pb-3'>
                            <h2 className='text-white'>{titles[currentShader].title}</h2>
                            <h2 className='text-white'>{titles[currentShader].subtitle}</h2>
                        </div>
                        {titles[currentShader].iOS ?
                            <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full mr-2 cursor-default'>iOS</p>
                            : null}
                        {titles[currentShader].Android ?
                            <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full mr-2 cursor-default'>Android</p>
                            : null}
                        {titles[currentShader].Lynx ?
                            <p className='text-white text-xs py-2 px-3 bg-white bg-opacity-20 text-opacity-70 font-medium inline rounded-full cursor-default'>Lynx</p>
                            : null}
                        {/* <div className='pb-6'>
                        <p className='text-white text-sm opacity-70'>{titles[currentShader].available}</p>
                    </div> */}
                    </div>
                    <div className='flex flex-col'>
                        <button className='mr-4 text-white linkn link--mneme' onClick={handleClickPrev}>← Prev Shader</button>
                        <button className='mr-4 text-white linkn link--mneme' onClick={handleClickNext}>Next Shader→</button>
                    </div>
                </div>


                <div className='flex'>
                    {isMockVisible && <FileInput setImageSrc={setOverlay}></FileInput>}
                    <button className='text-white opacity-70 transition-all hover:opacity-100 text-sm' onClick={setMockVisible}>{isMockVisible ? 'Go full-screen' : 'Show Mock'}</button>
                </div>
            </div>

            {isMockVisible ? (
                <div className='absolute flex h-full w-full flex-col items-center justify-center'>
                    <Canvas style={{ width: 390 * 0.6 * 1.25, height: 844 * 0.6 * 1.25 }} className='absolute -z-10' id='shaderView'>
                        {shaders[currentShader]}
                    </Canvas>
                </div>
            ) : (
                <Canvas className='absolute flex h-full w-full flex-col items-center justify-center -z-10' id='shaderView'>
                    {shaders[currentShader]}
                </Canvas>
            )}




            {/* <View style={{ width: 390 * 0.6, height: 844 * 0.6, userSelect: 'none', pointerEvents: 'none' }} className='absolute md:scale-125 top-5 left-9' id='shaderView'>
                {shaders[currentShader]}
            </View> */}


            {/* <div className='flex flex-col items-center justify-center' id="shader-container">
                <View style={{ width: 390 * 0.6, height: 844 * 0.6, userSelect: 'none', pointerEvents: 'none' }} className='absolute flex md:scale-125' id='shaderView'>
                    {shaders[currentShader]}
                </View>
            </div> */}

            {/* <div className='w-screen h-screen flex items-center justify-center absolute top-0 left-0'>
                <div className='absolute md:scale-125 h-full w-full flex-col items-top justify-top' style={{ width: 456 * 0.6, height: 844 * 0.6 }} >
                    <View className='h-full w-full -z-10' id='shaderView'>
                        {shaders[currentShader]}
                    </View>
                </div>
            </div> */}

            {/* <View className='absolute flex h-full w-full flex-col items-center justify-center -z-10' id='shaderView'>
                {shaders[currentShader]}
            </View> */}
        </>

    )
}

export { ShaderBg }