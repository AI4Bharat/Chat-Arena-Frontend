import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mic, ArrowRight } from 'lucide-react';

export function ServiceNavigationTile({ isInputActive = false, session_mode = "LLM" }) {
    const navigate = useNavigate();
    
    if (isInputActive) return null;

    const targetService = session_mode === "ASR" ? {
        name: 'LLM Arena',
        description: 'Try out our Indic LLM Arena',
        icon: MessageSquare,
        url: '/chat',
    } : {
        name: 'Audio Transcription (NEW)',
        description: 'Try out our Indic ASR Arena',
        icon: Mic,
        url: '/asr',
    };

    const Icon = targetService.icon;

    const handleNavigate = () => {
        navigate(targetService.url);
    };

    return (
        <div className="w-full flex justify-center px-4">
            <button
                onClick={handleNavigate}
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
                                {targetService.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                                {targetService.description}
                            </span>
                        </div>
                    </div>

                    {/* Arrow icon */}
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                </div>
            </button>
        </div>
    );
}