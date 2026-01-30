import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Play, Pause, FileAudio, RefreshCw } from 'lucide-react';
import { getJobAudios, getAudioUrl } from '../../../services/syntheticAsrApi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

// 1. Dynamic Waveform Visualizer
// Simulates a waveform using CSS bars. Animates when playing.
const Waveform = ({ isPlaying, seed }) => {
    // Generate static bars based on a "seed" (id) so they look consistent but unique per file
    const bars = useMemo(() => {
        return Array.from({ length: 24 }).map((_, i) => {
            // Pseudo-random height between 30% and 100%
            const height = 30 + (Math.sin(i * 0.5 + seed) * 0.5 + 0.5) * 70;
            return height;
        });
    }, [seed]);

    return (
        <div className="flex items-center gap-[2px] h-8 w-32 md:w-48 opacity-80">
            {bars.map((h, i) => (
                <motion.div
                    key={i}
                    className={`w-1 md:w-1.5 rounded-full ${isPlaying ? 'bg-orange-500' : 'bg-gray-300'}`}
                    initial={{ height: `${h}%` }}
                    animate={isPlaying ? {
                        height: [
                            `${h}%`,
                            `${h * 0.5 + 20}%`,
                            `${h}%`
                        ],
                        transition: {
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: i * 0.05
                        }
                    } : { height: `${h}%` }}
                />
            ))}
        </div>
    );
};

// 2. Main Page Component
export function AudioVisualization() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [audioList, setAudioList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [audioElement, setAudioElement] = useState(null); // Single audio element for the page (or per row context)

    // Demo Data Logic
    useEffect(() => {
        fetchAudioData();
    }, [jobId]);

    const fetchAudioData = async () => {
        setLoading(true);
        setError(null);
        try {
            // DEMO MODE
            if (jobId === 'demo-2026-01-30-001') {
                const mockAudioData = [
                    { id: 1, sentence: "कृप्या, इस स्थिति की गंभीरता को समझें; हमारा यह प्रस्ताव सिर्फ हमारी लाभप्रदता के लिए नहीं है।", metric: 0.0281, duration: 12.5 },
                    { id: 2, sentence: "वैसे, ये जो वैश्विक ब्याज दरें बढ़ रही हैं, इनसे मार्केट में लिक्विडिटी कम होती है।", metric: 0.0343, duration: 15.2 },
                    { id: 3, sentence: "आज की बैठक में हमें कंपनी की तिमाही रिपोर्ट पर चर्चा करनी है।", metric: 0.0195, duration: 9.8 },
                    { id: 4, sentence: "मुझे लगता है कि हमें इस प्रोजेक्ट के लिए अधिक संसाधन आवंटित करने चाहिए।", metric: 0.0412, duration: 11.3 },
                    { id: 5, sentence: "क्या आप मुझे बता सकते हैं कि यह दस्तावेज़ कहाँ सहेजा गया है?", metric: 0.0267, duration: 8.7 },
                    { id: 6, sentence: "हमारी टीम ने पिछले महीने बहुत अच्छा प्रदर्शन किया है।", metric: 0.0156, duration: 7.9 },
                    { id: 7, sentence: "कृपया सुनिश्चित करें कि सभी रिपोर्ट समय पर जमा की जाएं।", metric: 0.0389, duration: 10.4 },
                    { id: 8, sentence: "इस तकनीकी समस्या को हल करने के लिए हमें विशेषज्ञों की आवश्यकता है।", metric: 0.0298, duration: 13.1 },
                    { id: 9, sentence: "आगामी सम्मेलन में भाग लेने के लिए मैं बहुत उत्साहित हूँ।", metric: 0.0223, duration: 9.2 },
                    { id: 10, sentence: "हमें अपने ग्राहकों की प्रतिक्रिया को गंभीरता से लेना चाहिए।", metric: 0.0334, duration: 10.8 }
                ];
                await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay
                setAudioList(mockAudioData);
            } else {
                // REAL API
                const response = await getJobAudios(jobId);
                const list = Array.isArray(response) ? response : (response.results || []);
                setAudioList(list);
            }
        } catch (err) {
            setError(err.message || 'Failed to load audio files');
        } finally {
            setLoading(false);
        }
    };

    // Global Play Handler
    const handleGlobalPlay = (id) => {
        setPlayingId(id);
    };

    const handleGlobalPause = () => {
        setPlayingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* --- Sticky Header --- */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/asr')}
                            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Audio Visualization</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded">ID: {jobId}</span>
                                <span>•</span>
                                <span>{audioList.length} items</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={fetchAudioData}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Content Area --- */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-red-100 shadow-sm">
                        <div className="inline-flex p-3 bg-red-50 text-red-500 rounded-full mb-4">
                            <FileAudio size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Failed to load audio</h3>
                        <p className="text-gray-500 mt-1 mb-6">{error}</p>
                        <button onClick={fetchAudioData} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Header Row */}
                        <div className="hidden md:flex px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <div className="w-12">Play</div>
                            <div className="flex-1">Sentence</div>
                            <div className="w-48">Waveform</div>
                            <div className="w-24 text-center">Quality</div>
                            <div className="w-24 text-right">Duration</div>
                            <div className="w-12"></div>
                        </div>

                        {/* Audio List */}
                        <AnimatePresence>
                            {audioList.map((audio, index) => (
                                <AudioRow
                                    key={audio.id}
                                    audio={audio}
                                    index={index}
                                    isPlaying={playingId === audio.id}
                                    onPlay={handleGlobalPlay}
                                    onStop={handleGlobalPause}
                                    jobId={jobId}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}

// 3. Row Component
// Sleek list item design
function AudioRow({ audio, index, isPlaying, onPlay, onStop, jobId }) {
    const [element, setElement] = useState(null);

    // Helpers
    const formatDuration = (s) => `${s.toFixed(1)}s`;
    const formatMetric = (m) => m.toFixed(4);

    const qualityColor = audio.metric < 0.03
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : audio.metric < 0.05
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-red-100 text-red-700 border-red-200';

    // Demo Audio
    const demoAudioUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const audioSrc = jobId === 'demo-2026-01-30-001' ? demoAudioUrl : getAudioUrl(audio.id);

    const togglePlay = () => {
        if (!element) return;
        if (isPlaying) {
            element.pause();
            onStop();
        } else {
            // Stop others handled by parent state, but need to actually pause them? 
            // In a real app we'd use a global audio context. For now, this is okay.
            element.currentTime = 0;
            element.play();
            onPlay(audio.id);
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        // Mock download logic
        const link = document.createElement('a');
        link.href = audioSrc; // In real app, this works
        link.download = `generated_audio_${audio.id}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group relative bg-white rounded-xl border transition-all duration-200 
                ${isPlaying ? 'border-orange-500 shadow-md ring-1 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
            `}
        >
            <div className="flex flex-col md:flex-row items-center p-3 sm:p-4 gap-4">

                {/* 1. Play Button */}
                <button
                    onClick={togglePlay}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                        ${isPlaying ? 'bg-orange-500 text-white scale-105' : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'}
                    `}
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
                </button>

                {/* 2. Content */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{audio.id}</span>
                        {/* Mobile Quality Badge */}
                        <span className={`md:hidden text-[10px] px-2 rounded-full font-medium border ${qualityColor}`}>
                            {audio.metric.toFixed(3)}
                        </span>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed line-clamp-2 ${isPlaying ? 'text-gray-900' : 'text-gray-600'}`}>
                        {audio.sentence}
                    </p>
                </div>

                {/* 3. Waveform (Hidden on small mobile) */}
                <div className="hidden sm:block flex-shrink-0">
                    <Waveform isPlaying={isPlaying} seed={audio.id} />
                </div>

                {/* 4. Metadata & Actions */}
                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-1 md:mt-0">

                    {/* Quality Desktop */}
                    <div className="hidden md:block text-center w-24">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${qualityColor}`}>
                            {formatMetric(audio.metric)}
                        </span>
                    </div>

                    {/* Duration */}
                    <div className="text-xs font-mono text-gray-500 w-16 text-right">
                        {formatDuration(audio.duration)}
                    </div>

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={setElement}
                src={audioSrc}
                onEnded={onStop}
                onPause={onStop}
            />
        </motion.div>
    );
}
