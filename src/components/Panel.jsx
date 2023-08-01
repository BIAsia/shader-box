'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
    useControls,
    useCreateStore,
    folder,
    Leva,
    LevaPanel,
    monitor,
    button
} from "leva";

export default function App() {

    const colors = {
        elevation1: "#ffffff1A",
        elevation2: "#ffffff1A",
        elevation3: "#ffffff1A",
        accent1: "#ffffff21",
        accent2: "#ffffff21",
        accent3: "#ffffff21",
        highlight1: "#ffffff",
        highlight2: "#ffffff",
        highlight3: "#ffffff",
        vivid1: "#ffffff"
    }

    const theme = {
        colors,
    };

    return (
        <Leva theme={theme} flat={true} fill={false} />
    );
}