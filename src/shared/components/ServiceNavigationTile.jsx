import { useNavigate, useParams } from 'react-router-dom';
import { Mic, ArrowRight, Volume2 } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

const TILE_CONTENT = {
    LLM: { name: 'Large Language Models', description: 'Try out our Indic LLM Arena', icon: Mic, url: '/chat', badge: null, image: '/LLM.png' },
    ASR: { name: 'Audio Transcription', description: 'Try out our Indic ASR Arena', icon: Mic, url: '/asr', badge: 'New', image: '/ASR.png' },
    TTS: { name: 'Text to Speech', description: 'Try out our Indic TTS Arena', icon: Volume2, url: '/tts', badge: 'New', image: '/TTS.png' },
};

export function ServiceNavigationTile({ isInputActive = false, session_mode = "LLM" }) {
    const navigate = useNavigate();
    const { tenant: urlTenant } = useParams();
    const { tenant: contextTenant } = useTenant();
    const currentTenant = urlTenant || contextTenant;

    if (isInputActive) return null;

    const getTargetServices = () => {
        const services = {
            LLM: [TILE_CONTENT.ASR, TILE_CONTENT.TTS],
            ASR: [TILE_CONTENT.LLM, TILE_CONTENT.TTS],
            TTS: [TILE_CONTENT.LLM, TILE_CONTENT.ASR],
        };
        return services[session_mode] || [];
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-2xl mx-auto px-4 py-4">
            {getTargetServices().map((service, index) => (
                <button
                    key={index}
                    onClick={() => navigate(currentTenant ? `/${currentTenant}${service.url}` : service.url)}
                    className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-200 rounded-xl p-3 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 flex flex-col items-start gap-4 text-left h-full"
                >
                    <div className="flex w-full justify-between items-start">
                        <div className="flex-grow w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
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

                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-orange-500 bg-slate-50 group-hover:bg-orange-100 transition-all duration-300">
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-45" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="w-full h-20 bg-slate-100 rounded-lg overflow-hidden relative mt-auto group-hover:bg-orange-50/50 transition-colors duration-300 border border-slate-100 group-hover:border-orange-100">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <img src={service.image} alt={service.name} className=' w-full h-full object-cover ' />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}