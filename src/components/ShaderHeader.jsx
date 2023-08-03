'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/Button"

// export const metadata = {

// }
const ShaderHeader = ({ titleA, titleB, subtitle }) => {
    return (
        <div className='p-12 z-10'>
            <div className='pb-6'>
                <h2 className='text-white'>{titles[currentShader].title}</h2>
                <h2 className='text-white'>{titles[currentShader].subtitle}</h2>
            </div>
            <div>
                <button className='mr-4 text-white linkn link--mneme' onClick={handleClickPrev}>Prev</button>
                <button className='mr-4 text-white linkn link--mneme' onClick={handleClickNext}>Next</button>
            </div>
        </div>
    )
}

export { ShaderHeader }