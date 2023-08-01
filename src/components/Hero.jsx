'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/Button"

// export const metadata = {

// }
const Hero = ({ titleA, titleB, subtitle }) => {
    return (
        <div className='w-full p-24'>
            <div className='pb-12'>
                <h1 className='text-white'>{titleA}</h1>
                <h1 className='text-white'>{titleB}</h1>
                <h1 className='text-white'>{subtitle}</h1>
            </div>
            <div className='ml-2'>
                <Button label={'Shuffle'} ></Button>
            </div>

        </div>
    )
}

export { Hero }