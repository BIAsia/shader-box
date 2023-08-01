'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'


// export const metadata = {

// }
const Button = ({ variant = 'primary', label }) => {
    const router = useRouter()
    const urls = ['/circle-gradient', 'water-gradient']
    const size = 'px-4 py-1'
    const primaryStyle = 'button button--mimas'
    const handleClick = () => {
        const randomIndex = Math.floor(Math.random() * urls.length)
        const path = urls[randomIndex]
        router.push(path)
    }
    return (
        <button onClick={handleClick} className={size + ' ' + primaryStyle}>
            <span>{label}</span>
        </button>
    )
}

export { Button }