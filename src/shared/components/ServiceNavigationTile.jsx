import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Mic, ArrowRight, Volume2 } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

export function ServiceNavigationTile({ isInputActive = false, session_mode = "LLM" }) {
    const navigate = useNavigate();
    const { tenant: urlTenant } = useParams();
    const { tenant: contextTenant } = useTenant();
    const currentTenant = urlTenant || contextTenant;

    if (isInputActive) return null;

    const tileContent = {
        "LLM": {
            name: 'LLM Arena',
            description: 'Try out our Indic LLM Arena',
            icon: MessageSquare,
            url: '/chat',
        },
        "ASR": {
            name: 'Audio Transcription (NEW)',
            description: 'Try out our Indic ASR Arena',
            icon: Mic,
            url: '/asr',
        },
        "TTS": {
            name: 'Text to Speech (NEW)',
            description: 'Try out our Indic TTS Arena',
            icon: Volume2,
            url: '/tts',
        },
    }

    const getTargetServices = () => {
        switch (session_mode) {
            case "LLM":
                return [tileContent.ASR, tileContent.TTS];
            case "ASR":
                return [tileContent.LLM, tileContent.TTS];
            case "TTS":
                return [tileContent.LLM, tileContent.ASR];
        }
    };

    const targetServices = getTargetServices();

    return (
        <div className="w-full flex flex-col md:flex-row justify-center items-center px-4 gap-4 md:gap-8">
            {targetServices.map((service, index) => {
                const Icon = service.icon;
                return (
                    <button
                        key={index}
                        onClick={() => {
                            if (currentTenant) {
                                navigate(`/${currentTenant}${service.url}`);
                            } else {
                                navigate(service.url);
                            }
                        }}
                        className="
                            group relative overflow-hidden
                            bg-orange-50/50
                            hover:bg-orange-100/60
                            border border-orange-200/60 hover:border-orange-300
                            rounded-xl shadow-sm
                            max-w-xs w-full
                            px-4 py-3
                        "
                    >
                        <div className="relative flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {/* Icon Container */}
                                <div className="
                                    flex-shrink-0 w-10 h-10 rounded-lg
                                    bg-gradient-to-br from-orange-500 to-orange-600
                                    flex items-center justify-center
                                    shadow-sm
                                ">
                                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>

                                {/* Text content */}
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-semibold text-orange-600">
                                        {service.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {service.description}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow icon */}
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}