'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/Button"
import { FileInput } from "@/components/FileInput"

// export const metadata = {

// }

const paddingRatio = 390 / 456;

const Mock = ({ titleA, titleB, subtitle, overlay, setOverlay }) => {
    return (
        <div className='flex flex-col items-center'>
            <div>
                <div className='w-full h-full p-24 flex items-center justify-center absolute md:scale-150'>
                    <div style={{ width: 456 * 0.5 }} className='absolute'>
                        <img src="/img/iPhone14-Midnight-Portrait.png" alt="My Photo" />
                    </div>
                    <div style={{ width: 390 * 0.5 }} className='absolute'>
                        <img src={overlay} alt="Overlay" />
                    </div>
                </div>
                {/* <div className='w-full h-full p-24 flex items-center justify-center absolute'>
                    
                </div> */}
            </div>
        </div>

    )
}

export { Mock }