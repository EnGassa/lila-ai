"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Detailed Face Mesh Points (Percentages)
const MESH_POINTS = [
    // Center / Nose
    { x: 50, y: 25 }, // 0: Forehead Top
    { x: 50, y: 38 }, // 1: Between Eyes
    { x: 50, y: 50 }, // 2: Nose Bridge
    { x: 50, y: 58 }, // 3: Nose Tip
    { x: 50, y: 65 }, // 4: Upper Lip Center
    { x: 50, y: 73 }, // 5: Lower Lip Center
    { x: 50, y: 82 }, // 6: Chin

    // Left Side (Face's Right)
    { x: 35, y: 28 }, // 7: Left Forehead
    { x: 25, y: 35 }, // 8: Left Temple
    { x: 32, y: 38 }, // 9: Left Eye Outer
    { x: 42, y: 38 }, // 10: Left Eye Inner
    { x: 32, y: 42 }, // 11: Left Eye Bottom
    { x: 20, y: 45 }, // 12: Left Cheek Upper
    { x: 35, y: 50 }, // 13: Left Nose Side
    { x: 28, y: 60 }, // 14: Left Cheek Lower
    { x: 38, y: 68 }, // 15: Left Mouth Corner
    { x: 30, y: 75 }, // 16: Left Jaw

    // Right Side (Face's Right)
    { x: 65, y: 28 }, // 17: Right Forehead
    { x: 75, y: 35 }, // 18: Right Temple
    { x: 68, y: 38 }, // 19: Right Eye Outer
    { x: 58, y: 38 }, // 20: Right Eye Inner
    { x: 68, y: 42 }, // 21: Right Eye Bottom
    { x: 80, y: 45 }, // 22: Right Cheek Upper
    { x: 65, y: 50 }, // 23: Right Nose Side
    { x: 72, y: 60 }, // 24: Right Cheek Lower
    { x: 62, y: 68 }, // 25: Right Mouth Corner
    { x: 70, y: 75 }, // 26: Right Jaw
];

// Triangulation Connections (Indices)
const MESH_CONNECTIONS = [
    // Center Line
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],

    // Left Side Triangles
    [0, 7], [7, 8], [8, 12], [8, 9], [7, 9], [1, 10], // Forehead/Temple
    [1, 7], [9, 10], [9, 11], [10, 11], [1, 11], // Eye
    [11, 2], [11, 13], [2, 13], [13, 3], // Nose/Cheek
    [12, 9], [12, 11], [12, 14], [14, 13], [14, 15], // Cheek
    [13, 4], [4, 15], [15, 5], [5, 16], [15, 16], [14, 16], [6, 16], // Mouth/Chin/Jaw

    // Right Side Triangles
    [0, 17], [17, 18], [18, 22], [18, 19], [17, 19], [1, 20], // Forehead/Temple
    [1, 17], [19, 20], [19, 21], [20, 21], [1, 21], // Eye
    [21, 2], [21, 23], [2, 23], [23, 3], // Nose/Cheek
    [22, 19], [22, 21], [22, 24], [24, 23], [24, 25], // Cheek
    [23, 4], [4, 25], [25, 5], [5, 26], [25, 26], [24, 26], [6, 26], // Mouth/Chin/Jaw
];

export default function HeroAnimation() {
    const [phase, setPhase] = useState<"intro" | "scan" | "analyze" | "generate">("intro");
    const [isMobile, setIsMobile] = useState(false);

    // Mouse interaction for 3D tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = event.clientX - rect.left;
        const mouseYPos = event.clientY - rect.top;
        const xPct = mouseXPos / width - 0.5;
        const yPct = mouseYPos / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    useEffect(() => {
        // Sequence Timings
        const SCAN_START = 1500;
        const ANALYZE_START = 7000;
        const GENERATE_START = 12000;
        const LOOP_DURATION = 16000;

        const runSequence = () => {
            setPhase("intro");
            setTimeout(() => setPhase("scan"), SCAN_START);
            setTimeout(() => setPhase("analyze"), ANALYZE_START);
            setTimeout(() => setPhase("generate"), GENERATE_START);
        };

        runSequence();
        const interval = setInterval(runSequence, LOOP_DURATION);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="relative w-full h-[500px] flex justify-center items-center perspective-[1000px] cursor-default"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >

            {/* --- Main 3D Container --- */}
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                animate={{
                    x: phase === "analyze" || phase === "generate" ? 0 : 0,
                    scale: phase === "analyze" ? 0.95 : 1,
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative w-[300px] md:w-[350px] aspect-[3/4]"
            >
                {/* Face Image Layer */}
                <motion.div
                    className="absolute inset-0 z-10"
                    style={{
                        transform: "translateZ(0px)",
                        maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)"
                    }}
                >
                    <img
                        src="/hero_face.png"
                        alt="Face Analysis"
                        className="w-full h-full object-contain drop-shadow-2xl grayscale-[0.05] opacity-80"
                    />
                </motion.div>

                {/* --- Scanning Laser --- */}
                <AnimatePresence>
                    {phase === "scan" && (
                        <motion.div
                            initial={{ top: "0%", opacity: 0 }}
                            animate={{
                                top: ["0%", "100%", "0%"],
                                opacity: [0, 1, 1, 0]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 5, ease: "easeInOut" }}
                            className="absolute left-[-20%] right-[-20%] h-1 z-50"
                            style={{ transform: "translateZ(80px)" }}
                        >
                            {/* Outer Glow (Soft Blue) */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2E4052] to-transparent blur-md opacity-50"></div>
                            {/* Main Line (Dark to Light Blue Gradient) */}
                            <div className="absolute inset-0 h-[2px] top-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#2E4052] to-transparent shadow-[0_0_20px_#2E4052]"></div>
                            {/* Inner Core (White/Light for "Light" effect) */}
                            <div className="absolute inset-0 h-[1px] top-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-80"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Face Mesh Overlay --- */}
                <AnimatePresence>
                    {(phase === "scan" || phase === "analyze") && (
                        <motion.div
                            className="absolute inset-0 z-40"
                            style={{ transform: "translateZ(40px)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Mesh Lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 stroke-[0.5]">
                                {MESH_CONNECTIONS.map(([startIdx, endIdx], i) => {
                                    const start = MESH_POINTS[startIdx];
                                    const end = MESH_POINTS[endIdx];
                                    return (
                                        <motion.line
                                            key={`line-${i}`}
                                            x1={`${start.x}%`} y1={`${start.y}%`}
                                            x2={`${end.x}%`} y2={`${end.y}%`}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1, delay: i * 0.01 }}
                                        />
                                    );
                                })}
                            </svg>

                            {/* Mesh Dots */}
                            {MESH_POINTS.map((pt, i) => {
                                // Identify concern points: 
                                // 7: Left Forehead (Dehydration)
                                // 14: Left Cheek Lower (Redness)
                                // 23: Right Nose Side (Pores)
                                // 24: Right Cheek Lower (Texture)
                                const isConcern = [7, 14, 23, 24].includes(i);

                                return (
                                    <motion.div
                                        key={`dot-${i}`}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: phase === "analyze" ? (isConcern ? 1 : 0.8) : 0.9,
                                            scale: phase === "analyze" ? (isConcern ? [1, 2.5, 2] : [1, 1.5, 1]) : 1,
                                            backgroundColor: phase === "analyze" ? "#C48F7C" : "#fff"
                                        }}
                                        transition={{
                                            duration: 0.4,
                                            delay: phase === "analyze" ? i * 0.01 : i * 0.02,
                                            repeat: phase === "analyze" && isConcern ? Infinity : 0,
                                            repeatType: "reverse",
                                            repeatDelay: 0.5
                                        }}
                                        className="absolute w-1 h-1 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                                        style={{ left: `${pt.x}%`, top: `${pt.y}%`, transform: 'translate(-50%, -50%)' }}
                                    />
                                );
                            })}

                            {/* Face ID Corner Brackets */}
                            <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
                            <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
                            <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
                            <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Analysis Cards (Floating) --- */}
                <AnimatePresence>
                    {(phase === "analyze" || phase === "generate") && (
                        <>
                            {/* Card 1: Pores (Right Top) */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, y: 10 }}
                                animate={{ opacity: 1, x: isMobile ? 45 : 80, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.8 }}
                                className="absolute top-[48%] right-0 z-50 flex items-center gap-2 origin-left"
                                style={{ transform: "translateZ(100px)" }}
                            >
                                <div className="w-12 h-[1px] bg-[#374D62]"></div>
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-white/50">
                                    <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Analysis</p>
                                    <p className="text-xs font-bold text-[#0F172A]">Pores Detected</p>
                                </div>
                            </motion.div>

                            {/* Card 2: Texture (Right Bottom) */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, y: -10 }}
                                animate={{ opacity: 1, x: isMobile ? 55 : 90, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 1.0 }}
                                className="absolute top-[68%] right-0 z-50 flex items-center gap-2 origin-left"
                                style={{ transform: "translateZ(90px)" }}
                            >
                                <div className="w-8 h-[1px] bg-[#B57B66]"></div>
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-white/50">
                                    <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Concern</p>
                                    <p className="text-xs font-bold text-[#0F172A]">Uneven Texture</p>
                                </div>
                            </motion.div>

                            {/* Card 3: Redness (Left Bottom) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20, y: -10 }}
                                animate={{ opacity: 1, x: isMobile ? -45 : -80, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 1.2 }}
                                className="absolute top-[65%] left-0 z-50 flex flex-row-reverse items-center gap-2 origin-right"
                                style={{ transform: "translateZ(110px)" }}
                            >
                                <div className="w-8 h-[1px] bg-[#C48F7C]"></div>
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-white/50 text-right">
                                    <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Zone</p>
                                    <p className="text-xs font-bold text-[#0F172A]">Redness</p>
                                </div>
                            </motion.div>

                            {/* Card 4: Dehydration (Top Left) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20, y: 10 }}
                                animate={{ opacity: 1, x: isMobile ? -35 : -70, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 1.4 }}
                                className="absolute top-[45%] left-0 z-50 flex flex-row-reverse items-center gap-2 origin-right"
                                style={{ transform: "translateZ(95px)" }}
                            >
                                <div className="w-10 h-[1px] bg-[#94A3B8]"></div>
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-white/50 text-right">
                                    <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Skin Barrier</p>
                                    <p className="text-xs font-bold text-[#0F172A]">Dehydrated</p>
                                </div>
                            </motion.div>

                        </>
                    )}
                </AnimatePresence>

            </motion.div>

            {/* --- Loader (Separate Layer) --- */}
            <AnimatePresence>
                {phase === "generate" && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute bottom-10 z-50 bg-[#B57B66] text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-xl border border-white/10"
                    >
                        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                        <span className="font-medium text-sm tracking-wide">Building your routine...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Background Ambient (Static for stability) --- */}
            <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center items-center">
                <div className="w-[400px] h-[400px] bg-[#CBD5E1]/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            </div>

        </div>
    );
}
