import { motion } from 'framer-motion';
import { Music2, Waves, Mic, Sparkles } from 'lucide-react';
import './AudioEmptyState.css';

/**
 * Delightful empty state component for audio-themed screens
 * Features:
 * - Animated microphone character with sound waves
 * - Pulsing audio visualizer
 * - Reduced motion support
 * - Fully responsive
 */
export function AudioEmptyState({
    title = "Sign in Required",
    message = "Please sign in to manage your synthetic audio generation jobs.",
    actionButton = null,
    variant = "signin" // "signin" | "wizard"
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-purple-50/20 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center max-w-lg w-full"
            >
                {/* Animated Illustration Container */}
                <div className="relative mb-12">
                    {/* Background Glow */}
                    <div className="audio-empty-glow" />

                    {/* Floating Sound Waves (Background) */}
                    <div className="audio-waves-container">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={`wave-${i}`}
                                className="audio-wave"
                                style={{
                                    left: `${20 + i * 15}%`,
                                    animationDelay: `${i * 0.2}s`
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.15, 0.4, 0.15] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                            >
                                <Waves className="text-orange-300/50" size={32 + i * 6} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Large Audio Visualizer Bars - Main Focus */}
                    <div className="audio-visualizer-large">
                        {[...Array(15)].map((_, i) => {
                            const height = 40 + Math.random() * 80;
                            const delay = i * 0.08;
                            return (
                                <motion.div
                                    key={`bar-${i}`}
                                    className="audio-bar-large"
                                    animate={{
                                        scaleY: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 1 + Math.random() * 0.5,
                                        repeat: Infinity,
                                        delay: delay,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        height: `${height}px`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-gray-100/50"
                >
                    <motion.h2
                        className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-3"
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            backgroundSize: '200% 200%'
                        }}
                    >
                        {title}
                    </motion.h2>

                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                        {message}
                    </p>

                    {/* Action Button (if provided) */}
                    {actionButton}

                </motion.div>

                <div className="sr-only" role="status" aria-live="polite">
                    {title}. {message}
                </div>
            </motion.div>
        </div>
    );
}
