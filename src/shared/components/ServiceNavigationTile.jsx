import { useNavigate, useParams } from 'react-router-dom';
import { Mic, ArrowRight, Volume2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenant } from '../context/TenantContext';

const TILE_CONTENT = {
    LLM: { name: 'Large Language Models', description: 'Try out our Indic LLM Arena', icon: Mic, url: '/chat', badge: null, image: '/LLM.png' },
    ASR: { name: 'Audio Transcription', description: 'Try out our Indic ASR Arena', icon: Mic, url: '/asr', badge: 'New', image: '/ASR.png' },
    TTS: { name: 'Text to Speech', description: 'Try out our Indic TTS Arena', icon: Volume2, url: '/tts', badge: 'New', image: '/TTS.png' },
    OCR: { name: 'OCR', description: 'Try out our Indic OCR Arena', icon: FileText, url: '/ocr', badge: 'New', image: '/OCR.png' },
};

export function ServiceNavigationTile({ isInputActive = false, session_mode = "LLM" }) {
    const navigate = useNavigate();
    const { tenant: urlTenant } = useParams();
    const { tenant: contextTenant } = useTenant();
    const currentTenant = urlTenant || contextTenant;

    if (isInputActive) return null;

    const getTargetServices = () => {
        const services = {
            LLM: [TILE_CONTENT.ASR, TILE_CONTENT.TTS, TILE_CONTENT.OCR],
            ASR: [TILE_CONTENT.LLM, TILE_CONTENT.TTS, TILE_CONTENT.OCR],
            TTS: [TILE_CONTENT.LLM, TILE_CONTENT.ASR, TILE_CONTENT.OCR],
            OCR: [TILE_CONTENT.LLM, TILE_CONTENT.ASR, TILE_CONTENT.TTS],
        };
        return services[session_mode] || [];
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        },
        hover: {
            scale: 1.02,
            y: -5,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.98
        }
    };

    const arrowVariants = {
        hover: { 
            rotate: -45,
            transition: { duration: 0.3 }
        }
    };

    const imageVariants = {
        hover: {
            scale: 1.05,
            transition: { duration: 0.3 }
        }
    };

    return (
        <motion.div 
            className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto px-4 py-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {getTargetServices().map((service) => (
                <motion.button
                    key={service.name}
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => navigate(currentTenant ? `/${currentTenant}${service.url}` : service.url)}
                    className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-200 rounded-xl p-3 transition-colors duration-300 ease-out shadow-sm hover:shadow-lg flex flex-col items-start gap-4 text-left h-full"
                >
                    <div className="flex w-full justify-between items-start">
                        <div className="flex-grow w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                                    {service.name}
                                </span>
                                {service.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 rounded-full border border-orange-200">
                                        {service.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-600">
                                {service.description}
                            </p>
                        </div>

                        <motion.div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-orange-500 bg-slate-50 group-hover:bg-orange-100 transition-colors duration-300"
                            variants={arrowVariants}
                        >
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </motion.div>
                    </div>

                    {/* Image Section */}
                    <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden relative mt-auto group-hover:bg-orange-50/50 transition-colors duration-300 border border-slate-100 group-hover:border-orange-100">
                        <motion.div 
                            className="absolute inset-0 flex items-center justify-center text-slate-300"
                            variants={imageVariants}
                        >
                            <img src={service.image} alt={service.name} className='w-full h-full object-cover' />
                        </motion.div>
                    </div>
                </motion.button>
            ))}
        </motion.div>
    );
}