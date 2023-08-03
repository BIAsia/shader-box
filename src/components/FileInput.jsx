'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'


// export const metadata = {

// }
const FileInput = ({ setImageSrc }) => {
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            setImageSrc(reader.result);
        }

        if (file) {
            reader.readAsDataURL(file);
        } else {
            setImageSrc(null);
        }
    };

    return (
        <div className="w-full py-2">
            <label
                htmlFor="file-upload"
                className="w-full cursor-pointer text-sm border border-white border-opacity-50 font-medium hover:bg-white hover:text-black text-white py-2 px-4 transition">
                Change Overlay
            </label>
            <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div>
    );
}

export { FileInput }