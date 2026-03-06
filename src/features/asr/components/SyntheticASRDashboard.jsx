import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, RefreshCw, CheckCircle2, Clock, XCircle, Download, Hash, Globe, Timer, AlertTriangle, Calendar, Layers, Activity, RotateCcw, Mail, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs, getDownloadLink, resubmitJob, reportFailedJob } from '../../../services/syntheticAsrApi';
import { AudioEmptyState } from './AudioEmptyState';
import { toast } from 'react-hot-toast';

export function SyntheticASRDashboard({ onCreateNewClick }) {
    const navigate = useNavigate();
    const auth = useSelector((state) => state.auth);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        language: 'all',
        sortBy: 'newest'
    });

    const fetchJobs = async (silent = false) => {
        if (!auth?.isAuthenticated || auth?.isAnonymous) {
            setError(null);
            setJobs([]);
            return;
        }
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await getJobs(1, 50, filters.status, filters.language);
            const jobsWithDates = data.items.map(job => ({
                ...job,
                createdAt: job.createdAt ? new Date(job.createdAt) : null,
                completedAt: job.completedAt ? new Date(job.completedAt) : null,
            }));
            setJobs(jobsWithDates);
        } catch (err) {
            if (!silent) setError(err.message || 'Failed to fetch jobs');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [auth?.isAuthenticated, auth?.isAnonymous, filters.status, filters.language]);

    const baseJobs = jobs;
    const normalizedSearchTerm = (searchTerm || '').trim().toLowerCase();
    const normalizedSearchWithoutHash = normalizedSearchTerm.replace(/^#/, '');

    const filteredJobs = baseJobs.filter((job) => {
        let matchesStatus = true;
        if (filters.status !== 'all') {
            const filterUpperStatus = filters.status.toUpperCase();
            const jobUpperStatus = job.status?.toUpperCase() || '';
            if (filterUpperStatus === 'COMPLETED') matchesStatus = ['COMPLETED', 'DATASET_GENERATED', 'DATASET_UPLOADED'].includes(jobUpperStatus);
            else if (filterUpperStatus === 'PROCESSING') matchesStatus = ['SUBMITTED', 'SUBMITTING', 'ACCEPTED', 'PROCESSING', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(jobUpperStatus);
            else if (filterUpperStatus === 'FAILED') matchesStatus = (jobUpperStatus === 'FAILED');
        }
        const matchesLanguage = filters.language === 'all' || job.language === filters.language;

        const jobId = String(job.jobId || '').toLowerCase();
        const language = String(job.language || '').toLowerCase();
        const category = String(job.category || '').toLowerCase();

        const matchesSearch = normalizedSearchTerm === ''
            || jobId.includes(normalizedSearchTerm)
            || jobId.replace(/^#/, '').includes(normalizedSearchWithoutHash)
            || language.includes(normalizedSearchTerm)
            || category.includes(normalizedSearchTerm);
        return matchesStatus && matchesLanguage && matchesSearch;
    });

    const uniqueLanguages = [...new Set(baseJobs.map(job => job.language))];
    const isFiltered = searchTerm !== '' || filters.status !== 'all' || filters.language !== 'all';

    if (!auth?.isAuthenticated || auth?.isAnonymous) {
        return (
            <AudioEmptyState
                title="Sign in Required"
                message="Please sign in to manage your synthetic audio generation jobs."
                variant="signin"
            />
        );
    }


    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Datasets Dashboard</h1>
                        </div>
                        {/* Mobile New Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onCreateNewClick}
                            className="md:hidden flex items-center justify-center text-white w-9 h-9 rounded-full border-0"
                            style={{
                                background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
                                boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.28), inset -1px -1px 2px rgba(0,0,0,0.1), 5px 5px 14px rgba(249,115,22,0.24), -2px -2px 8px rgba(255,255,255,0.85)'
                            }}
                        >
                            <Plus size={18} />
                        </motion.button>
                    </div>

                    {/* Desktop New Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCreateNewClick}
                        className="hidden md:flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-0"
                        style={{
                            background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
                            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.28), inset -1px -1px 2px rgba(0,0,0,0.1), 6px 6px 16px rgba(249,115,22,0.25), -3px -3px 10px rgba(255,255,255,0.86)'
                        }}
                    >
                        <Plus size={18} />
                        New Dataset
                    </motion.button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Job ID, language, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-0 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-700 focus:outline-none transition-all"
                            style={{
                                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
                            }}
                        />
                    </div>

                    {/* Pill Filter Toggles */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">

                        {/* Status Pills */}
                        <div className="relative flex items-center bg-white border-0 rounded-2xl p-1 shrink-0 gap-0.5"
                            style={{
                                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
                            }}
                        >
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'completed', label: 'Ready' },
                                { value: 'processing', label: 'In Progress' },
                                { value: 'failed', label: 'Failed' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilters({ ...filters, status: opt.value })}
                                    className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 whitespace-nowrap ${filters.status === opt.value ? 'text-orange-700' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {filters.status === opt.value && (
                                        <motion.div
                                            layoutId="statusPill"
                                            className="absolute inset-0 bg-orange-50 border border-orange-200/60 rounded-xl shadow-sm"
                                            transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                                        />
                                    )}
                                    <span className="relative z-10">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Language Pills */}
                        {uniqueLanguages.length > 0 && (
                            <div className="relative flex items-center bg-white border-0 rounded-2xl p-1 shrink-0 gap-0.5"
                                style={{
                                    boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
                                }}
                            >
                                {[
                                    { value: 'all', label: 'All' },
                                    ...uniqueLanguages.map(lang => ({ value: lang, label: lang.charAt(0).toUpperCase() + lang.slice(1) }))
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilters({ ...filters, language: opt.value })}
                                        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 whitespace-nowrap ${filters.language === opt.value ? 'text-indigo-700' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {filters.language === opt.value && (
                                            <motion.div
                                                layoutId="languagePill"
                                                className="absolute inset-0 bg-indigo-50 border border-indigo-200/60 rounded-xl shadow-sm"
                                                transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                                            />
                                        )}
                                        <span className="relative z-10">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={fetchJobs}
                            className={`p-3 bg-white border-0 rounded-2xl text-gray-500 hover:text-orange-600 transition-all shrink-0 ${loading ? 'opacity-50' : ''}`}
                            disabled={loading}
                            style={{
                                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)'
                            }}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* List Header (Hidden on small screens) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-8 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4">
                    <div className="col-span-5">Dataset Information</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Progress / Stage</div>
                    <div className="col-span-1 text-right">Size</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Floating List Container */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {loading && filteredJobs.length === 0 ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white/50 rounded-3xl border border-gray-100 animate-pulse" />
                            ))
                        ) : filteredJobs.length === 0 ? (
                            <WaveformEmptyState isFiltered={isFiltered} onCreateNewClick={onCreateNewClick} />
                        ) : (
                            filteredJobs.map((job) => (
                                <JobRow key={job.jobId} job={job} navigate={navigate} onRefresh={fetchJobs} />
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                    Showing {filteredJobs.length} dataset generation jobs
                </p>
            </main>
        </div>
    );
}

// Per-language avatar palette — distinct identity per language
const LANG_PALETTE = {
    hindi: { from: 'from-[#FF8C42]/20', to: 'to-[#FF6B00]/10', text: 'text-[#c04f00]', glow: 'rgba(255,107,0,0.18)' },
    telugu: { from: 'from-[#6C63FF]/20', to: 'to-[#3B28CC]/10', text: 'text-[#3B28CC]', glow: 'rgba(59,40,204,0.15)' },
    tamil: { from: 'from-[#00B4D8]/20', to: 'to-[#0077B6]/10', text: 'text-[#0077B6]', glow: 'rgba(0,119,182,0.15)' },
    kannada: { from: 'from-[#E63946]/20', to: 'to-[#9D0208]/10', text: 'text-[#9D0208]', glow: 'rgba(157,2,8,0.15)' },
    malayalam: { from: 'from-[#2DC653]/20', to: 'to-[#007F5F]/10', text: 'text-[#007F5F]', glow: 'rgba(0,127,95,0.15)' },
    bengali: { from: 'from-[#7B2FBE]/20', to: 'to-[#4A0E8F]/10', text: 'text-[#4A0E8F]', glow: 'rgba(74,14,143,0.15)' },
    marathi: { from: 'from-[#FF595E]/20', to: 'to-[#C1121F]/10', text: 'text-[#C1121F]', glow: 'rgba(193,18,31,0.15)' },
    gujarati: { from: 'from-[#F4A261]/20', to: 'to-[#E76F51]/10', text: 'text-[#E76F51]', glow: 'rgba(231,111,81,0.15)' },
    punjabi: { from: 'from-[#FFB700]/20', to: 'to-[#D97706]/10', text: 'text-[#b45309]', glow: 'rgba(180,83,9,0.15)' },
    odia: { from: 'from-[#06D6A0]/20', to: 'to-[#028A6E]/10', text: 'text-[#028A6E]', glow: 'rgba(2,138,110,0.15)' },
};
const DEFAULT_PALETTE = { from: 'from-blue-500/15', to: 'to-blue-500/5', text: 'text-blue-700', glow: 'rgba(59,130,246,0.15)' };

function relativeTime(date) {
    if (!date) return null;
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function JobRow({ job, navigate, onRefresh }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [hasReported, setHasReported] = useState(false);
    const [hasAnimatedCheck, setHasAnimatedCheck] = useState(false);
    const upperStatus = job.status?.toUpperCase() || '';
    const isReady = upperStatus === 'COMPLETED';
    const isFailed = upperStatus === 'FAILED';
    const isStuck = upperStatus === 'SUBMITTED' || upperStatus === 'SUBMITTING';
    const isProcessing = !isReady && !isFailed;
    const canResubmit = isFailed;

    const langKey = (job.language || '').toLowerCase();
    const palette = LANG_PALETTE[langKey] || DEFAULT_PALETTE;

    useEffect(() => {
        if (isExpanded && isReady && !hasAnimatedCheck) {
            setHasAnimatedCheck(true);
        }
    }, [isExpanded]);

    // Status color mapping
    const statusConfig = {
        SUBMITTED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'SUBMITTED' },
        SUBMITTING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'SUBMITTING' },
        ACCEPTED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'ACCEPTED' },
        PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'PROCESSING' },
        SENTENCE_GENERATED: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'SENTENCE GENERATED' },
        AUDIO_GENERATED: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', label: 'AUDIO GENERATED' },
        AUDIO_VERIFIED: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'AUDIO VERIFIED' },
        DATASET_GENERATED: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', label: 'DATASET GENERATED' },
        DATASET_UPLOADED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'DATASET UPLOADED' },
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'COMPLETED' },
        FAILED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'FAILED' },
        DEFAULT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'PROCESSING' },
    };

    const sConfig = statusConfig[upperStatus] || statusConfig.DEFAULT;

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleResubmit = async (e) => {
        if (e) e.stopPropagation();
        setIsResubmitting(true);
        try {
            await resubmitJob(job.jobId);
            toast.success('Job resubmitted successfully!');
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.message || 'Failed to resubmit job');
        } finally {
            setIsResubmitting(false);
        }
    };

    const handleReport = async (e) => {
        if (e) e.stopPropagation();
        setIsReporting(true);
        try {
            await reportFailedJob(job.jobId, 'User reported failure from dashboard');
            toast.success('Report submitted — team has been notified!');
            setHasReported(true);
        } catch (err) {
            toast.error(err.message || 'Failed to submit report');
        } finally {
            setIsReporting(false);
        }
    };

    const clayBase = isExpanded
        ? 'inset 2px 2px 6px rgba(0,0,0,0.05), inset -2px -2px 6px rgba(255,255,255,0.9), 8px 8px 24px rgba(0,0,0,0.08), -4px -4px 14px rgba(255,255,255,0.9)'
        : 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-3xl overflow-hidden transition-all duration-300"
            style={{
                background: isExpanded ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
                boxShadow: clayBase,
                border: isExpanded ? '1px solid rgba(249,115,22,0.18)' : '1px solid rgba(255,255,255,0.7)',
            }}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-5 py-4 lg:px-7 flex flex-col lg:grid lg:grid-cols-12 items-start lg:items-center gap-3 lg:gap-4 cursor-pointer"
            >
                {/* 1. Identity */}
                <div className="w-full lg:col-span-5 flex items-center justify-between lg:justify-start lg:gap-4">
                    <div className="flex items-center gap-3.5">
                        {/* Language avatar — per-language gradient + glow on hover */}
                        <div
                            className={`w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 bg-gradient-to-br ${palette.from} ${palette.to} ${palette.text} transition-all duration-300 group-hover:scale-105`}
                            style={{
                                boxShadow: `0 0 0 1px ${palette.glow}, 0 4px 12px ${palette.glow}`,
                            }}
                        >
                            <span className="text-[13px] tracking-tighter leading-none">{job.language.substring(0, 2).toUpperCase()}</span>
                            <span className="text-[7px] font-semibold opacity-50 tracking-widest uppercase leading-none mt-0.5">lang</span>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[15px] font-bold text-gray-900 leading-tight capitalize">{job.language} Dataset</h3>
                                {job.category && (
                                    <span className="hidden sm:inline-block text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full capitalize">
                                        {job.category}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400 font-medium">
                                <span className="font-mono opacity-50 truncate max-w-[100px]">#{job.jobId.slice(-8)}</span>
                                <span className="opacity-30">·</span>
                                <span>{relativeTime(job.createdAt)}</span>
                                <span className="opacity-30">·</span>
                                <span className="font-semibold text-gray-500">{job.size}h</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile ready actions */}
                    {isReady && (
                        <div className="lg:hidden flex gap-2">
                            <button onClick={async (e) => { e.stopPropagation(); try { const r = await getDownloadLink(job.jobId); if (r.download_url) window.open(r.download_url, '_blank'); else toast.error('Not available'); } catch { toast.error('Failed'); } }}
                                className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full">
                                <Download size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/asr/synthetic/job/${job.jobId}`); }}
                                className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-500 rounded-full">
                                <Eye size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Status badge with live dot */}
                <div className="hidden lg:flex w-full lg:col-span-2 items-center">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border ${sConfig.bg} ${sConfig.text} border-current/10`}>
                        {/* Pulsing live dot */}
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${sConfig.dot}`} style={{ animationDuration: isProcessing ? '1.4s' : '0s', animationIterationCount: isProcessing ? 'infinite' : '0' }} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${sConfig.dot}`} />
                        </span>
                        {sConfig.label}
                    </div>
                </div>

                {/* 3. Progress bar */}
                <div className="w-full lg:col-span-4 mt-0.5 lg:mt-0">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate max-w-[130px]">
                            {job.currentStage || 'Pending'}
                        </span>
                        <span className="text-[11px] font-extrabold text-gray-600 tabular-nums">{Math.round(job.progress)}%</span>
                    </div>
                    {/* Track */}
                    <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.08), inset -1px -1px 2px rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.05)' }}>
                        {/* Fill */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`absolute inset-y-0 left-0 rounded-full ${isReady ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                isFailed ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                    'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'
                                }`}
                        />
                        {/* Shimmer sweep — only for in-progress */}
                        {isProcessing && (
                            <motion.div
                                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                                animate={{ left: ['-10%', '110%'] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                            />
                        )}
                    </div>
                </div>

                {/* 4. Actions (Desktop) */}
                <div className="hidden lg:flex w-full lg:col-span-1 justify-end gap-2">
                    {isReady && (
                        <>
                            <button
                                onClick={async (e) => { e.stopPropagation(); try { const r = await getDownloadLink(job.jobId); if (r.download_url) window.open(r.download_url, '_blank'); else toast.error('Not available'); } catch { toast.error('Failed'); } }}
                                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-400/40 hover:bg-emerald-50/50 hover:shadow-md rounded-xl transition-all duration-200"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/asr/synthetic/job/${job.jobId}`); }}
                                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-400/40 hover:bg-orange-50/50 hover:shadow-md rounded-xl transition-all duration-200"
                            >
                                <Eye size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Expansion Content — Claymorphism Design */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 py-6 md:px-8 md:py-8 bg-gradient-to-br from-orange-50/30 via-white to-blue-50/20">
                            <div className="grid md:grid-cols-3 gap-5">

                                {/* Session ID Card */}
                                <motion.div
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.05, duration: 0.35 }}
                                    className="rounded-[20px] p-5 bg-white/60 backdrop-blur-sm"
                                    style={{
                                        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.04), inset -2px -2px 5px rgba(255,255,255,0.95), 6px 6px 16px rgba(0,0,0,0.06), -3px -3px 10px rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(255,255,255,0.7)',
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center"
                                            style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(0,0,0,0.05)' }}>
                                            <Hash size={14} className="text-gray-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">Session ID</span>
                                    </div>
                                    <div className="p-3 bg-gray-50/70 rounded-2xl text-xs font-mono text-gray-500 break-all select-all leading-relaxed"
                                        style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.05), inset -1px -1px 2px rgba(255,255,255,0.7)' }}>
                                        {job.jobId}
                                    </div>
                                </motion.div>

                                {/* Generation Stats Card */}
                                <motion.div
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.35 }}
                                    className="rounded-[20px] p-5 bg-white/60 backdrop-blur-sm"
                                    style={{
                                        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.04), inset -2px -2px 5px rgba(255,255,255,0.95), 6px 6px 16px rgba(0,0,0,0.06), -3px -3px 10px rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(255,255,255,0.7)',
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center"
                                            style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(59,130,246,0.1)' }}>
                                            <Activity size={14} className="text-blue-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">Generation Stats</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-50/80 flex items-center justify-center shrink-0"
                                                style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.04), 1px 1px 3px rgba(99,102,241,0.06)' }}>
                                                <Globe size={13} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider block leading-none">Language</span>
                                                <p className="text-sm font-semibold text-gray-700 capitalize leading-tight mt-0.5">{job.language}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-amber-50/80 flex items-center justify-center shrink-0"
                                                style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.04), 1px 1px 3px rgba(245,158,11,0.06)' }}>
                                                <Timer size={13} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider block leading-none">Estimated Finish Time</span>
                                                <p className="text-sm font-semibold text-gray-700 leading-tight mt-0.5">1 day</p>
                                            </div>
                                        </div>
                                        {job.createdAt && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50/80 flex items-center justify-center shrink-0"
                                                    style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.04), 1px 1px 3px rgba(16,185,129,0.06)' }}>
                                                    <Calendar size={13} className="text-emerald-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider block leading-none">Created</span>
                                                    <p className="text-sm font-semibold text-gray-700 leading-tight mt-0.5">{formatDate(job.createdAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Progress / ETA / Failure Card */}
                                <motion.div
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15, duration: 0.35 }}
                                    className={`rounded-[20px] p-5 backdrop-blur-sm ${isFailed ? 'bg-red-50/40' : 'bg-white/60'}`}
                                    style={{
                                        boxShadow: isFailed
                                            ? 'inset 2px 2px 5px rgba(239,68,68,0.06), inset -2px -2px 5px rgba(255,255,255,0.9), 6px 6px 16px rgba(239,68,68,0.08), -3px -3px 10px rgba(255,255,255,0.85)'
                                            : 'inset 2px 2px 5px rgba(0,0,0,0.04), inset -2px -2px 5px rgba(255,255,255,0.95), 6px 6px 16px rgba(0,0,0,0.06), -3px -3px 10px rgba(255,255,255,0.85)',
                                        border: isFailed ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.7)',
                                    }}
                                >
                                    {isFailed ? (
                                        <>
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center"
                                                    style={{ boxShadow: 'inset 1px 1px 2px rgba(239,68,68,0.1), 2px 2px 6px rgba(239,68,68,0.1)' }}>
                                                    <AlertTriangle size={14} className="text-red-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.12em]">Failure Log</span>
                                            </div>
                                            <div className="p-3 bg-red-50/60 text-red-700 rounded-2xl text-xs font-medium leading-relaxed"
                                                style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(239,68,68,0.07), inset -1px -1px 2px rgba(255,255,255,0.6)' }}>
                                                {job.errorMessage || 'Unknown system error occurred during synthesis.'}
                                            </div>
                                            <button
                                                onClick={handleResubmit}
                                                disabled={isResubmitting}
                                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{
                                                    boxShadow: '0 4px 12px rgba(249,115,22,0.25), inset 0 1px 1px rgba(255,255,255,0.2)',
                                                }}
                                            >
                                                <RotateCcw size={14} className={isResubmitting ? 'animate-spin' : ''} />
                                                {isResubmitting ? 'Resubmitting...' : 'Retry — Resubmit Job'}
                                            </button>
                                            <button
                                                onClick={handleReport}
                                                disabled={isReporting || hasReported}
                                                className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                                    ${hasReported ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'}`}
                                            >
                                                {hasReported ? (
                                                    <><CheckCircle2 size={14} /> Reported</>
                                                ) : isReporting ? (
                                                    <><Send size={14} className="animate-pulse" /> Sending...</>
                                                ) : (
                                                    <><Mail size={14} /> Report Issue</>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center ${isReady ? 'from-emerald-100 to-emerald-50' : 'from-orange-100 to-orange-50'}`}
                                                    style={{
                                                        boxShadow: isReady
                                                            ? 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(16,185,129,0.1)'
                                                            : 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(249,115,22,0.1)'
                                                    }}>
                                                    <Layers size={14} className={isReady ? 'text-emerald-500' : 'text-orange-500'} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                                                    {isReady ? 'Completed' : 'Live Progress'}
                                                </span>
                                            </div>
                                            <div className="space-y-3.5">
                                                {isReady && (
                                                    <DrawCheckmark animate={hasAnimatedCheck} />
                                                )}
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">{job.currentStage || 'Initializing...'}</span>
                                                        <span className="text-xs font-extrabold text-gray-600">{Math.round(job.progress)}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-100/60 rounded-full overflow-hidden"
                                                        style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.07), inset -1px -1px 2px rgba(255,255,255,0.7)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${job.progress}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                            className={`h-full rounded-full ${isReady
                                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                                : 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'}`}
                                                            style={{ boxShadow: isReady ? '0 1px 4px rgba(16,185,129,0.3)' : '0 1px 4px rgba(59,130,246,0.3)' }}
                                                        />
                                                    </div>
                                                </div>
                                                {!isReady && job.createdAt && (
                                                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100/50">
                                                        <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center"
                                                            style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.03)' }}>
                                                            <Clock size={11} className="text-orange-400" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-orange-600">
                                                            Est. finish: 1 day
                                                        </span>
                                                    </div>
                                                )}
                                                {isReady && job.completedAt && (
                                                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100/50">
                                                        <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center"
                                                            style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.03)' }}>
                                                            <CheckCircle2 size={11} className="text-emerald-400" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-emerald-600">
                                                            Completed on {formatDate(job.completedAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function DrawCheckmark({ animate }) {
    return (
        <div className="flex justify-center py-2">
            <motion.svg
                width="52" height="52" viewBox="0 0 52 52"
                fill="none"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={animate ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {/* Circle */}
                <motion.circle
                    cx="26" cy="26" r="22"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    fill="rgba(16,185,129,0.06)"
                    initial={{ pathLength: 0 }}
                    animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                />
                {/* Checkmark tick */}
                <motion.path
                    d="M 15 26 L 23 34 L 37 18"
                    stroke="#10b981"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.35 }}
                />
            </motion.svg>
        </div>
    );
}

function WaveformEmptyState({ isFiltered, onCreateNewClick }) {
    const bars = [0.28, 0.6, 0.45, 0.85, 0.55, 1.0, 0.38, 0.75, 0.5, 0.9, 0.3, 0.65, 0.8, 0.42, 0.7];
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl py-14 px-10 text-center border border-dashed border-gray-200"
        >
            {/* Animated waveform */}
            <div className="flex items-end justify-center gap-[3px] mb-7" style={{ height: '48px' }}>
                {bars.map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-[5px] rounded-full bg-gradient-to-t from-orange-500 to-orange-300"
                        style={{ height: `${h * 48}px`, transformOrigin: 'bottom', opacity: 0.7 + h * 0.3 }}
                        animate={{ scaleY: [1, h < 0.5 ? 1.8 : 0.5, 1] }}
                        transition={{
                            duration: 1.6 + i * 0.06,
                            repeat: Infinity,
                            repeatType: 'mirror',
                            ease: 'easeInOut',
                            delay: i * 0.07,
                        }}
                    />
                ))}
            </div>

            {isFiltered ? (
                <>
                    <h3 className="text-base font-bold text-gray-700 mb-1.5">No datasets match your filters</h3>
                    <p className="text-sm text-gray-400">Try adjusting the search or filters above</p>
                </>
            ) : (
                <>
                    <h3 className="text-base font-bold text-gray-700 mb-1.5">No datasets yet</h3>
                    <p className="text-sm text-gray-400 mb-6">Generate your first synthetic ASR dataset to get started</p>
                    {onCreateNewClick && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onCreateNewClick}
                            className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                        >
                            <Plus size={16} />
                            Create First Dataset
                        </motion.button>
                    )}
                </>
            )}
        </motion.div>
    );
}

// Global Custom Animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      .animate-spin-slow { animation: spin 4s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}