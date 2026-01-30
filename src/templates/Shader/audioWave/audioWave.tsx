import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { useControls, button, folder } from 'leva';
import { createShaderControls } from "../ShaderControl";
import vertex from "./audioWave.vert";
import fragment from "./audioWave.frag";

const AudioWaveMaterial = shaderMaterial(
    {
        uResolution: new THREE.Vector2(0, 0),
        uTime: 0,
        uSpeed: 1.,
        uTimeOffset: 0.0,
        uLightness: 0.,
        uPosition: new THREE.Vector2(0.0, 0.0),
        uScale: new THREE.Vector2(1.0, 1.0),
        uRotate: 0.,
        uColor: ["#1e90ff", "#20b2aa", "#4169e1", "#3cb371"].map(
            (color) => new THREE.Color(color)
        ),
        uBgColor: new THREE.Color('#000000'),
        uComplex: 1,
        uMorph: 0.0,
        uAudioStrength: 1.0,
        uRadiusInfluence: 1.0,
        uAudioLevel: 0.0,
    },
    vertex,
    fragment
);

AudioWaveMaterial.key = THREE.MathUtils.generateUUID();

extend({ AudioWaveMaterial });

declare module '@react-three/fiber' {
    interface ThreeElements {
        audioWaveMaterial: JSX.IntrinsicElements['shaderMaterial'] & { key: string }
    }
}

export const useAudioWaveControls = createShaderControls(['animation', 'color', 'shape'], { shaderId: 'audioWave' }, { showAIGenerate: true });

const AudioWaveBg: React.FC = (props: any) => {
    const { viewport } = useThree()

    const {
        animation: { speed, timeOffset },
        color: { color1, color2, color3, color4, bgColor, lightness },
        shape: { position, scaleX, scaleY, complex, morph }
    } = useAudioWaveControls();

    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // audio state
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioLevelRef = useRef(0);

    // add Leva-like Add Audio control using a simple input trigger
    useEffect(() => {
        // noop: UI is handled by global controls; we'll create a hidden input when needed
    }, []);

    const handleFile = async (file: File | null) => {
        if (!file) return;
        try {
            const arrayBuffer = await file.arrayBuffer();
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

            // stop previous source
            if (sourceRef.current) {
                try { sourceRef.current.stop(); } catch (e) { }
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;

            source.connect(analyser);
            analyser.connect(ctx.destination);
            source.start(0);

            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch (err) {
            console.error('Failed to load audio', err);
        }
    };

    // expose a hidden file input and Leva controls to trigger it and microphone toggle
    useEffect(() => {
        const id = 'audio-input-audiowave';
        let input = document.getElementById(id) as HTMLInputElement | null;
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.id = id;
            input.style.display = 'none';
            input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                handleFile(f || null);
            };
            document.body.appendChild(input);
        }

        return () => {
            // keep input for reuse
        };
    }, []);
    // media stream ref for microphone so we can stop tracks later
    const streamRef = useRef<MediaStream | null>(null);

    // start microphone capture and create analyser
    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.85;
            src.connect(analyser);
            analyserRef.current = analyser;
            // keep a reference to the media source in sourceRef for potential cleanup
            (sourceRef as any).current = src;
        } catch (err) {
            console.error('Microphone access denied or failed', err);
        }
    };

    // stop microphone and release tracks
    const stopMic = () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if ((sourceRef as any).current) {
                try { (sourceRef as any).current.disconnect(); } catch (e) { }
                (sourceRef as any).current = null;
            }
        } catch (e) {
            console.warn('Error stopping microphone', e);
        }
        analyserRef.current = null;
    };

    // Leva controls: Add Audio + explicit mic start/stop buttons + influence parameters
    const audioControls = useControls('Audio', () => ({
        'Add Audio': button(() => {
            const input = document.getElementById('audio-input-audiowave') as HTMLInputElement | null;
            input?.click();
        }),
        'Start Microphone': button(() => startMic()),
        'Stop Microphone': button(() => stopMic()),
        AudioSettings: folder({
            audioStrength: { value: 1.0, min: 0, max: 4, step: 0.01 },
            radiusInfluence: { value: 1.0, min: 0, max: 4, step: 0.01 },
            gain: { value: 1.0, min: 0, max: 8, step: 0.01 },
            ampSmoothing: { value: 0.96, min: 0.8, max: 0.999, step: 0.001 },
            noiseGate: { value: 0.01, min: 0.0, max: 0.1, step: 0.001 }
        })
    }));

    useFrame(({ clock }, delta) => {
        const a = clock.getElapsedTime()
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = a * 10
            materialRef.current.uniforms.uResolution.value = new THREE.Vector2(viewport.width, viewport.height)

            // update audio data
            const analyser = analyserRef.current;
            if (analyser) {
                const size = analyser.fftSize;
                const buf = new Float32Array(size);
                analyser.getFloatTimeDomainData(buf);

                const gain = (audioControls as any).gain ?? 1.0;
                materialRef.current.uniforms.uAudioStrength.value = (audioControls as any).audioStrength ?? 1.0;
                materialRef.current.uniforms.uRadiusInfluence.value = (audioControls as any).radiusInfluence ?? 1.0;
                // compute global amplitude (RMS) and smooth it with a single EMA parameter
                let sumSq = 0;
                for (let i = 0; i < size; i++) {
                    const v = buf[i] * gain;
                    sumSq += v * v;
                }
                const rms = Math.sqrt(sumSq / size); // 0..1-ish
                const noiseGate = (audioControls as any).noiseGate ?? 0.01;
                const gated = Math.max(0, rms - noiseGate) / Math.max(1e-5, 1.0 - noiseGate);
                const ampSmoothing = (audioControls as any).ampSmoothing ?? 0.96;
                audioLevelRef.current = audioLevelRef.current * ampSmoothing + gated * (1 - ampSmoothing);
                materialRef.current.uniforms.uAudioLevel.value = audioLevelRef.current;
            }
        }
    })

    return (
        <mesh
            ref={meshRef as React.RefObject<THREE.Mesh>}
        >
            <planeBufferGeometry args={[viewport.width, viewport.height, 1, 1]} />
            {/* @ts-ignore */}
            <audioWaveMaterial
                key={AudioWaveMaterial.key}
                ref={materialRef}
                uSpeed={speed}
                uTimeOffset={timeOffset}
                uLightness={lightness}
                uPosition={new THREE.Vector2(position.x, position.y)}
                uScale={new THREE.Vector2(scaleX, scaleY)}
                uRotate={0}
                uColor={[color1, color2, color3, color4].map((color) => new THREE.Color(color))}
                uBgColor={new THREE.Color(bgColor)}
                uComplex={complex}
                uMorph={morph}
                uResolution={new THREE.Vector2(viewport.width, viewport.height)}
            />
        </mesh>
    );
};

export default AudioWaveBg;
