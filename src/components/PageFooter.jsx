'use client'
import React, { useState, useEffect, useRef } from 'react'

// export const metadata = {

// }
const PageFooter = ({ title, children }) => {
    return (
        <div className='inline-flex flex-col items-start gap-4 p-8 pt-4 w-full'>
            <div className='w-full h-px bg-white bg-opacity-30'></div>
            <div className='flex justify-between items-start self-stretch'>
                <div className='flex items-center gap-2'>
                    <p className='header-text text-white'>{title}</p>
                </div>
                <div className='flex w-7/12 items-start'>
                    {children}
                </div>
            </div>
        </div>
    )
}

export { PageFooter }