import * as THREE from "three";
import { useFrame, extend, useThree } from "@react-three/fiber";
import React, { useRef, useState, useEffect } from "react";
import { shaderMaterial } from "@react-three/drei";
import { useControls, button, folder } from 'leva';
import { createShaderControls } from "../ShaderControl";
import vertex from "./audioWave.vert";
import fragment from "./audioWave.frag";

// audio buffer size for shader uniform
const AUDIO_SIZE = 64;

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
        uAudio: new Float32Array(AUDIO_SIZE),
        uAudioLen: AUDIO_SIZE,
        uAudioStrength: 1.0,
        uTrajInfluence: 1.0,
        uRadiusInfluence: 1.0,
        uAudioLevel: 0.0,
        uTrajXInfluence: 0.3,
        uTrajYInfluence: 1.2,
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
    const pcmRef = useRef(new Float32Array(AUDIO_SIZE));
    const smoothRef = useRef(new Float32Array(AUDIO_SIZE));
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
            trajInfluence: { value: 1.0, min: 0, max: 4, step: 0.01 },
            trajXInfluence: { value: 0.3, min: 0, max: 4, step: 0.01 },
            trajYInfluence: { value: 1.2, min: 0, max: 4, step: 0.01 },
            radiusInfluence: { value: 1.0, min: 0, max: 4, step: 0.01 },
            gain: { value: 1.0, min: 0, max: 8, step: 0.01 },
            smoothing: { value: 0.85, min: 0.0, max: 0.99, step: 0.01 },
            ampSmoothing: { value: 0.96, min: 0.8, max: 0.999, step: 0.001 }
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

                // downsample to AUDIO_SIZE with smoothing and gain from controls
                const step = Math.floor(size / AUDIO_SIZE) || 1;
                const gain = (audioControls as any).AudioSettings?.gain ?? 1.0;
                const smoothing = (audioControls as any).AudioSettings?.smoothing ?? 0.85;
                for (let i = 0; i < AUDIO_SIZE; i++) {
                    let sum = 0;
                    let count = 0;
                    const start = i * step;
                    for (let j = 0; j < step && (start + j) < size; j++) {
                        sum += buf[start + j];
                        count++;
                    }
                    const v = count > 0 ? (sum / count) * gain : 0;
                    pcmRef.current[i] = v;
                    // smoothing (alpha is smoothing param)
                    const alpha = smoothing;
                    smoothRef.current[i] = smoothRef.current[i] * alpha + pcmRef.current[i] * (1 - alpha);
                }

                // write to shader uniform
                const arr = new Float32Array(AUDIO_SIZE);
                for (let i = 0; i < AUDIO_SIZE; i++) arr[i] = smoothRef.current[i];
                materialRef.current.uniforms.uAudio.value = arr;
                materialRef.current.uniforms.uAudioLen.value = AUDIO_SIZE;
                materialRef.current.uniforms.uAudioStrength.value = (audioControls as any).AudioSettings?.audioStrength ?? 1.0;
                materialRef.current.uniforms.uTrajInfluence.value = (audioControls as any).AudioSettings?.trajInfluence ?? 1.0;
                materialRef.current.uniforms.uTrajXInfluence.value = (audioControls as any).AudioSettings?.trajXInfluence ?? ((audioControls as any).AudioSettings?.trajInfluence ?? 1.0) * 0.3;
                materialRef.current.uniforms.uTrajYInfluence.value = (audioControls as any).AudioSettings?.trajYInfluence ?? ((audioControls as any).AudioSettings?.trajInfluence ?? 1.0) * 1.2;
                materialRef.current.uniforms.uRadiusInfluence.value = (audioControls as any).AudioSettings?.radiusInfluence ?? 1.0;
                // compute global amplitude (mean absolute) and smooth it with ampSmoothing
                let sumAbs = 0;
                for (let i = 0; i < AUDIO_SIZE; i++) sumAbs += Math.abs(smoothRef.current[i]);
                const audioLevel = sumAbs / AUDIO_SIZE; // 0..1-ish
                const ampSmoothing = (audioControls as any).AudioSettings?.ampSmoothing ?? 0.96;
                audioLevelRef.current = audioLevelRef.current * ampSmoothing + audioLevel * (1 - ampSmoothing);
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
