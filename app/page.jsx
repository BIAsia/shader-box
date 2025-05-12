'use client'
import React, { useState, useEffect, useRef } from 'react'
import { PageHeader } from "@/components/PageHeader"
import { PageFooter } from "@/components/PageFooter"
import { Mock } from "@/components/Mock"
import { ShaderHeader } from "@/components/ShaderHeader"
import { ShaderBg } from "@/components/ShaderBg"
import { Leva, button, useControls, folder } from 'leva'

import dynamic from 'next/dynamic'
import record from 'canvas-to-video'
import { Suspense } from 'react'
import ReactGA from 'react-ga4';
ReactGA.initialize('G-JFF0CZQNDN');





// const WaterGradientDream = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
const CircleBg = dynamic(() => import("@/templates/Shader/hole/circleBg"), {
  ssr: false,
})
const GradientBg = dynamic(() => import("@/templates/Shader/lava/gradientBg"), {
  ssr: false,
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
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

export default function Page() {
  const colors = {
    elevation1: "#ffffff1A",
    elevation2: "#ffffff00",
    elevation3: "#ffffff00",
    accent1: "#ffffff21",
    accent2: "#ffffff21",
    accent3: "#ffffff21",
    highlight1: "#ffffff45",
    highlight2: "#ffffff",
    highlight3: "#ffffff",
    vivid1: "#ffffff"
  }
  const sizes = {
    rootWidth: '240px',
    rowHeight: '20px',
    folderHeight: '48px',
    controlWidth: '120px',
    titleBarHeight: "32px"
  }
  const space = {
    rowGap: '8px'
  }

  const theme = {
    colors,
    sizes,
    space
  };

  const [imageSrc, setImageSrc] = useState("/img/Overlay.png");

  ReactGA.send({ hitType: "pageview", page: "/home", title: "Visit" });

  const [isMockVisible, setMockVisible] = useState(true);
  useEffect(() => {
    setMockVisible(window.innerWidth > 460);
  }, [])

  const handleButtonClick = () => {
    setMockVisible(!isMockVisible);
  };

  const [currentShaderId, setCurrentShaderId] = useState('spin');

  const handleShaderChange = (shaderId) => {
    setCurrentShaderId(shaderId);
  };
  return (
    <>
      <div className='h-screen w-screen flex flex-col justify-between items-start absolute z-10'>
        <ShaderBg initialShaderId={currentShaderId} onShaderChange={handleShaderChange} className="absolute -z-10 flex item-center justify-center w-screen" setOverlay={setImageSrc} setMockVisible={handleButtonClick} isMockVisible={isMockVisible}></ShaderBg>
        {isMockVisible && <Mock overlay={imageSrc} setOverlay={setImageSrc}></Mock>}

        {/* <PageFooter title={'Shader Box'}>
          <div className="h-4 flex items-center flex-grow">
            <a href="https://tux-ds.cn.goofy.app/toolbox?auth=admin" className="header-text text-opacity-70 text-white link link--leda link--leda--bottom">TUX Toolbox ↗</a>
          </div>
          <div className="h-4 flex items-center flex-grow">
            <a href="https://tux-ds.cn.goofy.app/" className="header-text text-opacity-70 text-white link link--leda link--leda--bottom">TUX Website ↗</a>
          </div>
        </PageFooter> */}
        <div className="top-32 right-8 absolute w-60">
          <Leva theme={theme} flat={true} fill />
        </div>

      </div>


    </>
  )
}