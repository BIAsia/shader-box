'use client'
import React, { useState, useEffect, useRef } from 'react'

// export const metadata = {

// }
const PageHeader = ({ children }) => {
    return (
        <div className='inline-flex flex-col items-start gap-4 p-8 w-full'>
            <div className='w-full h-px bg-white'></div>
            <div className='flex justify-between items-start self-stretch'>
                <div className='flex items-center gap-2 h-4'>
                    <p className='header-text font-medium text-white'>Shader Box</p>
                    <p className='text-white text-xs text-opacity-70'>v0.7 beta</p>
                </div>
                <div className='flex w-7/12 items-start'>
                    {children}
                </div>
            </div>
            <div className='w-full h-px bg-white bg-opacity-30'></div>
        </div>
    )
}

export { PageHeader }