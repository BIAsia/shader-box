'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/Button"
import { FileInput } from "@/components/FileInput"

// export const metadata = {

// }

const paddingRatio = 390 / 456;

const Mock = ({ titleA, titleB, subtitle, overlay, setOverlay }) => {
    return (
        <div id='mock' className='w-full flex flex-col items-center justify-center'>
            <div className='w-screen h-screen flex items-center justify-center absolute top-0 left-0'>
                <div style={{ width: 456 * 0.6 }} className='absolute'>
                    <img src="/img/iPhone14-Midnight-Portrait.png" alt="My Photo" />
                </div>
                <div style={{ width: 390 * 0.6 }} className='absolute'>
                    <img src={overlay} alt="Overlay" />
                </div>
            </div>
        </div>

    )
}

export { Mock }