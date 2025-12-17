import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Mic, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ServiceNavigationTile({ isInputActive = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    // Determine which service we're on
    const isOnASR = location.pathname.startsWith('/asr');
    const isOnChat = location.pathname.startsWith('/chat') || location.pathname === '/';

    // Only show when input is not active (empty)
    useEffect(() => {
        setIsVisible(!isInputActive);
    }, [isInputActive]);

    // Don't show if we're not on chat or ASR
    if (!isOnChat && !isOnASR) {
        return null;
    }

    const targetService = isOnASR ? {
        name: 'Chat Arena',
        description: 'Compare AI models side-by-side',
        icon: MessageSquare,
        url: '/chat',
    } : {
        name: 'Voice Transcription',
        description: 'Try our ASR service',
        icon: Mic,
        url: '/asr',
    };

    const Icon = targetService.icon;

    const handleNavigate = () => {
        navigate(targetService.url);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full flex justify-center mb-6 px-4"
                >
                    <button
                        onClick={handleNavigate}
                        className="
              group relative overflow-hidden
              bg-gradient-to-r from-orange-50/50 to-orange-50/50
              hover:from-orange-100/60 hover:to-orange-100/60
              border border-orange-200/60 hover:border-orange-300
              rounded-2xl shadow-sm hover:shadow-md
              transition-all duration-300 ease-out
              max-w-md w-full
              px-6 py-4
            "
                    >
                        {/* Subtle shine effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                        <div className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Icon with gradient background */}
                                <div className="
                  flex-shrink-0 w-12 h-12 rounded-xl
                  bg-gradient-to-br from-orange-500 to-orange-600
                  flex items-center justify-center
                  shadow-sm group-hover:shadow-md
                  transition-all duration-300
                  group-hover:scale-110
                ">
                                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                                </div>

                                {/* Text content */}
                                <div className="flex flex-col items-start text-left">
                                    <span className="
                    text-sm font-semibold
                    text-orange-600
                  ">
                                        {targetService.name}
                                    </span>
                                    <span className="text-xs text-slate-600">
                                        {targetService.description}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow icon */}
                            <ArrowRight className="
                w-5 h-5 text-slate-400 group-hover:text-orange-500
                transition-all duration-300
                group-hover:translate-x-1
              " />
                        </div>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
