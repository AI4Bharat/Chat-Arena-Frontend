import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Play, Pause, FileAudio, RefreshCw, Music, Zap, MessageSquare, Clock } from 'lucide-react';
import { getJobAudios, getAudioUrl, authHeaders } from '../../../services/syntheticAsrApi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

// 1. Dataset Metrics Cards Component
const DatasetMetrics = ({ totalAudio, vocabularySize, totalTokens, totalDuration, loading }) => {
    const metrics = [
        {
            label: 'Generated Audio',
            value: totalAudio ?? '-',
            icon: Music,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Vocabulary Size',
            value: vocabularySize ?? '-',
            icon: MessageSquare,
            color: 'bg-purple-50 text-purple-600'
        },
        {
            label: 'Total Tokens',
            value: totalTokens ?? '-',
            icon: Zap,
            color: 'bg-amber-50 text-amber-600'
        },
        {
            label: 'Duration',
            value: totalDuration ? `${totalDuration}h` : '-',
            icon: Clock,
            color: 'bg-green-50 text-green-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    {metric.label}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? (
                                        <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse" />
                                    ) : (
                                        metric.value
                                    )}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${metric.color}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// 2. Dynamic Waveform Visualizer
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

// 3. Main Page Component
export function AudioVisualization() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [audioList, setAudioList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    
    // Metrics state (ready for API integration)
    const [metrics, setMetrics] = useState({
        totalAudio: null,
        vocabularySize: null,
        totalTokens: null,
        totalDuration: null
    });

    // Demo Data Logic
    useEffect(() => {
        fetchAudioData();
    }, [jobId]);

    const fetchAudioData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Always fetch from real API (Eldho's ngrok endpoint)
            const response = await getJobAudios(jobId);
            const list = Array.isArray(response) ? response : (response.results || response.items || response.data || []);
            setAudioList(list);
        } catch (err) {
            console.error('Error fetching audio data:', err);
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
                    <div className="space-y-6">
                        {/* Dataset Metrics */}
                        <DatasetMetrics
                            totalAudio={metrics.totalAudio || audioList.length}
                            vocabularySize={metrics.vocabularySize}
                            totalTokens={metrics.totalTokens}
                            totalDuration={metrics.totalDuration}
                            loading={loading}
                        />

                        {/* Audio List Header Row */}
                        <div className="hidden md:flex px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <div className="w-12">Play</div>
                            <div className="flex-1">Sentence</div>
                            <div className="w-48">Waveform</div>
                            <div className="w-24 text-center">Quality</div>
                            <div className="w-24 text-right">Duration</div>
                            <div className="w-12"></div>
                        </div>

                        {/* Audio List */}
                        <div className="space-y-3">
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
                    </div>
                )}
            </main>
        </div>
    );
}

// 4. Row Component
// Sleek list item design
function AudioRow({ audio, index, isPlaying, onPlay, onStop, jobId }) {
    const [element, setElement] = useState(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState(null);
    const [audioLoading, setAudioLoading] = useState(false);

    // Helpers
    const formatDuration = (s) => `${s.toFixed(1)}s`;
    const formatMetric = (m) => m.toFixed(4);

    const qualityColor = audio.metric < 0.03
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : audio.metric < 0.05
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-red-100 text-red-700 border-red-200';

    // Fetch audio as blob with proper headers
    const fetchAudioBlob = async () => {
        if (audioBlobUrl) return audioBlobUrl; // Already fetched

        setAudioLoading(true);
        try {
            const audioUrl = getAudioUrl(audio.id);
            const response = await fetch(audioUrl, {
                headers: authHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load audio');
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setAudioBlobUrl(blobUrl);
            return blobUrl;
        } catch (err) {
            console.error('Error loading audio:', err);
            return null;
        } finally {
            setAudioLoading(false);
        }
    };

    const togglePlay = async () => {
        if (!element) return;

        if (isPlaying) {
            element.pause();
            onStop();
        } else {
            // Fetch audio blob if not already loaded
            const blobUrl = await fetchAudioBlob();
            if (blobUrl && element) {
                element.src = blobUrl;
                element.currentTime = 0;
                element.play();
                onPlay(audio.id);
            }
        }
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        const blobUrl = await fetchAudioBlob();
        if (blobUrl) {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `generated_audio_${audio.id}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (audioBlobUrl) {
                URL.revokeObjectURL(audioBlobUrl);
            }
        };
    }, [audioBlobUrl]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group relative bg-white rounded-xl border transition-all duration-200 
                ${isPlaying ? 'border-orange-500 shadow-md ring-1 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
            `}
        >
            <div className="flex items-center p-3 sm:p-4 gap-3 sm:gap-4">

                {/* 1. Play Button (Compact on Mobile) */}
                <button
                    onClick={togglePlay}
                    className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
                        ${isPlaying ? 'bg-orange-500 text-white scale-105' : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'}
                    `}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-1" fill="currentColor" />}
                </button>

                {/* 2. Content (Flexible Width) */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        {/* Sentence */}
                        <p className={`text-sm font-medium leading-relaxed truncate md:line-clamp-2 md:whitespace-normal ${isPlaying ? 'text-gray-900' : 'text-gray-600'} flex-1`}>
                            {audio.sentence}
                        </p>

                        {/* Mobile Metadata Row */}
                        <div className="flex items-center gap-2 md:hidden">
                            <span className="text-[10px] font-bold text-gray-400">#{audio.id}</span>
                            <span className="text-gray-300 text-[10px]">•</span>
                            <span className="text-[10px] font-mono text-gray-500">{formatDuration(audio.duration)}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ml-2 border ${qualityColor}`}>
                                {audio.metric.toFixed(3)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Desktop Columns (Waveform, Quality, Duration) */}
                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    <div className="w-32 lg:w-48">
                        <Waveform isPlaying={isPlaying} seed={audio.id} />
                    </div>
                    <div className="w-24 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${qualityColor}`}>
                            {formatMetric(audio.metric)}
                        </span>
                    </div>
                    <div className="w-16 text-right text-xs font-mono text-gray-500">
                        {formatDuration(audio.duration)}
                    </div>
                </div>

                {/* 4. Download Action */}
                <button
                    onClick={handleDownload}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Download size={18} />
                </button>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={setElement}
                onEnded={onStop}
                onPause={onStop}
            />
        </motion.div>
    );
}
