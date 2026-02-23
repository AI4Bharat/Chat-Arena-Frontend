import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Search, Eye, RefreshCw, CheckCircle2, Clock, XCircle, Download, Hash, Globe, Timer, AlertTriangle, Calendar, Layers, Activity, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs, getDownloadLink, resubmitJob } from '../../../services/syntheticAsrApi';
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

    const fetchJobs = async () => {
        if (!auth?.isAuthenticated || auth?.isAnonymous) {
            setError(null);
            setJobs([]);
            return;
        }
        setLoading(true);
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
            setError(err.message || 'Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [auth?.isAuthenticated, auth?.isAnonymous]);

    const baseJobs = jobs;

    const filteredJobs = baseJobs.filter((job) => {
        let matchesStatus = true;
        if (filters.status !== 'all') {
            const filterUpperStatus = filters.status.toUpperCase();
            const jobUpperStatus = job.status?.toUpperCase() || '';
            if (filterUpperStatus === 'COMPLETED') matchesStatus = (jobUpperStatus === 'COMPLETED');
            else if (filterUpperStatus === 'PROCESSING') matchesStatus = ['SUBMITTED', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(jobUpperStatus);
            else if (filterUpperStatus === 'FAILED') matchesStatus = (jobUpperStatus === 'FAILED');
        }
        const matchesLanguage = filters.language === 'all' || job.language === filters.language;
        const matchesSearch = searchTerm === '' || job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesLanguage && matchesSearch;
    });

    const uniqueLanguages = [...new Set(baseJobs.map(job => job.language))];

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
                            className="md:hidden flex items-center justify-center bg-orange-600 text-white w-8 h-8 rounded-full shadow-lg"
                        >
                            <Plus size={18} />
                        </motion.button>
                    </div>

                    {/* Desktop New Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCreateNewClick}
                        className="hidden md:flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
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
                            placeholder="Enter Job ID to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
                        />
                    </div>

                    {/* Horizontal Scroll for Filters on Mobile */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                        <div className="relative">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="appearance-none bg-white border border-gray-200 rounded-2xl pl-4 pr-10 py-3 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-orange-500/50 cursor-pointer min-w-[150px]"
                            >
                                <option value="all">Every Status</option>
                                <option value="completed">Ready</option>
                                <option value="processing">In Progress</option>
                                <option value="failed">Failed</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={filters.language}
                                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                                className="appearance-none bg-white border border-gray-200 rounded-2xl pl-4 pr-10 py-3 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-orange-500/50 cursor-pointer min-w-[150px]"
                            >
                                <option value="all">All Languages</option>
                                {uniqueLanguages.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <button
                            onClick={fetchJobs}
                            className={`p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm ${loading ? 'opacity-50' : ''}`}
                            disabled={loading}
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
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-3xl p-10 md:p-20 text-center border border-dashed border-gray-200"
                            >
                                <p className="text-gray-400 font-medium italic">No datasets match your criteria.</p>
                            </motion.div>
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

function JobRow({ job, navigate, onRefresh }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const upperStatus = job.status?.toUpperCase() || '';
    const isReady = upperStatus === 'COMPLETED';
    const isFailed = upperStatus === 'FAILED';
    const isStuck = upperStatus === 'SUBMITTED' || upperStatus === 'SUBMITTING';
    const canResubmit = isFailed || isStuck;

    // Status color mapping
    const statusConfig = {
        COMPLETED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Dataset Ready' },
        FAILED: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
        SUBMITTED: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Queued' },
        SUBMITTING: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Submitting' },
        DEFAULT: { icon: Clock, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' }
    };

    const config = statusConfig[upperStatus] || statusConfig.DEFAULT;
    const StatusIcon = config.icon;

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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group bg-white rounded-3xl border transition-all duration-300 ${isExpanded ? 'border-orange-200 shadow-xl shadow-orange-900/5' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-5 py-5 lg:px-8 flex flex-col lg:grid lg:grid-cols-12 items-start lg:items-center gap-4 lg:gap-4 cursor-pointer relative overflow-hidden"
            >
                {/* 1. Mobile Header Row: Identity + Status + Action */}
                <div className="w-full lg:col-span-5 flex items-start justify-between lg:justify-start lg:gap-5">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center font-bold text-sm bg-gradient-to-br transition-all duration-300 shrink-0 ${isReady ? 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 ring-1 ring-emerald-500/20' :
                            isFailed ? 'from-red-500/10 to-red-500/5 text-red-600 ring-1 ring-red-500/20' :
                                'from-blue-500/10 to-blue-500/5 text-blue-600 ring-1 ring-blue-500/20'
                            }`}>
                            {job.language.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{job.language} Dataset</h3>
                            <div className="flex items-center gap-2 mt-1 lg:hidden">
                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight border ${config.bg} ${config.text} border-current/10`}>
                                    <StatusIcon size={10} strokeWidth={3} />
                                    {config.label}
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
                                <span className="truncate opacity-60">#{job.jobId}</span>
                                <span>•</span>
                                <span>{formatDate(job.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Visualization & Download Buttons (Top Right) */}
                    {isReady && (
                        <div className="lg:hidden flex gap-2">
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        const result = await getDownloadLink(job.jobId);
                                        if (result.download_url) {
                                            window.open(result.download_url, '_blank');
                                        } else {
                                            toast.error('Download link not available');
                                        }
                                    } catch (err) {
                                        toast.error('Failed to get download link');
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full active:bg-green-50 active:text-green-600 transition-colors"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/asr/synthetic/job/${job.jobId}`);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full active:bg-orange-50 active:text-orange-600 transition-colors"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Status Badge (Desktop) */}
                <div className="hidden lg:block w-full lg:col-span-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[11px] font-bold tracking-tight border shadow-sm ${config.bg} ${config.text} border-current/10`}>
                        <StatusIcon size={12} strokeWidth={3} className={!isReady && !isFailed ? "animate-spin-slow" : ""} />
                        {config.label}
                    </div>
                </div>

                {/* 3. Progress (Responsive Layout) */}
                <div className="w-full lg:col-span-3 mt-1 lg:mt-0">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[120px]">{job.currentStage}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="lg:hidden text-[10px] text-gray-400 font-medium">{job.size}h</span>
                            <span className="text-[11px] font-extrabold text-gray-600">{Math.round(job.progress)}%</span>
                        </div>
                    </div>
                    <div className="h-1.5 lg:h-2 w-full bg-gray-50 rounded-full border border-gray-100 p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            className={`h-full rounded-full ${isReady ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-blue-500'}`}
                        />
                    </div>
                </div>

                {/* 4. Meta Actions (Desktop) */}
                <div className="hidden lg:block w-full lg:col-span-1 text-right">
                    <span className="text-sm font-bold text-gray-400 pr-2">{job.size}h</span>
                </div>

                <div className="hidden lg:flex w-full lg:col-span-1 justify-end gap-2">
                    {isReady && (
                        <>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        const result = await getDownloadLink(job.jobId);
                                        if (result.download_url) {
                                            window.open(result.download_url, '_blank');
                                        } else {
                                            toast.error('Download link not available');
                                        }
                                    } catch (err) {
                                        toast.error('Failed to get download link');
                                    }
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-500/30 hover:shadow-lg rounded-2xl transition-all duration-300"
                            >
                                <Download size={20} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/asr/synthetic/job/${job.jobId}`);
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-500/30 hover:shadow-lg rounded-2xl transition-all duration-300"
                            >
                                <Eye size={20} />
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
                                                <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider block leading-none">Est. Duration</span>
                                                <p className="text-sm font-semibold text-gray-700 leading-tight mt-0.5">{job.size} hours</p>
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
                                                            Est. finish: {new Date(new Date(job.createdAt).getTime() + (job.size * 60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                                {isStuck && (
                                                    <div className="pt-2 border-t border-gray-100/50 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle size={12} className="text-amber-500" />
                                                            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Job appears stuck in queue</span>
                                                        </div>
                                                        <button
                                                            onClick={handleResubmit}
                                                            disabled={isResubmitting}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            style={{
                                                                boxShadow: '0 4px 12px rgba(249,115,22,0.25), inset 0 1px 1px rgba(255,255,255,0.2)',
                                                            }}
                                                        >
                                                            <RotateCcw size={14} className={isResubmitting ? 'animate-spin' : ''} />
                                                            {isResubmitting ? 'Resubmitting...' : 'Resubmit Job'}
                                                        </button>
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

// Global Custom Animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      .animate-spin-slow { animation: spin 4s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}