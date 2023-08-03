'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/Button"

// export const metadata = {

// }
const Mock = ({ titleA, titleB, subtitle, overlay }) => {
    return (
        <>
            <div className='w-full h-full p-24 flex items-center justify-center absolute'>
                <div style={{ width: 456 * 0.8, }}>
                    <img src="/img/iPhone14-Midnight-Portrait.png" alt="My Photo" />
                </div>
            </div>
            <div className='w-full h-full p-24 flex items-center justify-center absolute'>
                <div style={{ width: 390 * 0.8, }}>
                    <img src={overlay} alt="Overlay" />
                </div>
            </div>
        </>

    )
}

export { Mock }