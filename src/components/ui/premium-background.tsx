'use client'

import { motion } from 'framer-motion'

export function PremiumBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fafbfc] via-white to-[#f8fafc]" />

            {/* Mesh gradient blobs */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(241,245,249,0.8) 0%, rgba(241,245,249,0.4) 50%, transparent 70%)' }}
                />
                <div
                    className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(226,232,240,0.6) 0%, rgba(241,245,249,0.3) 50%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(241,245,249,0.7) 0%, rgba(248,250,252,0.4) 50%, transparent 70%)' }}
                />
            </div>

            {/* Animated floating orbs */}
            <motion.div
                className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to bottom right, rgba(226,232,240,0.3), transparent)' }}
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to bottom left, rgba(226,232,240,0.25), transparent)' }}
                animate={{
                    x: [0, -25, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.08, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[20%] left-[30%] w-[350px] h-[350px] rounded-full blur-2xl"
                style={{ background: 'linear-gradient(to top right, rgba(226,232,240,0.2), transparent)' }}
                animate={{
                    x: [0, 20, 0],
                    y: [0, 15, 0],
                    scale: [1, 1.03, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage: `radial-gradient(circle at center, #94a3b8 0.5px, transparent 0.5px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Subtle grid lines */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Subtle vignette */}
            <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(248,250,252,0.4) 60%, rgba(241,245,249,0.7) 100%)' }}
            />
        </div>
    )
}
