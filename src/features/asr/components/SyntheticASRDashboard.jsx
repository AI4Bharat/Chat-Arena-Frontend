import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, RefreshCw, CheckCircle2, Clock, Download, Hash, Globe, Timer, AlertTriangle, Calendar, Layers, Activity, RotateCcw, ChevronDown, Check, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs, getDownloadLink, resubmitJob, deleteDraftJob } from '../../../services/syntheticAsrApi';
import { AudioEmptyState } from './AudioEmptyState';
import { toast } from 'react-hot-toast';

export function SyntheticASRDashboard({ onCreateNewClick, onEditDraft }) {
    const navigate = useNavigate();
    const auth = useSelector((state) => state.auth);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        language: [],
        sortBy: 'newest'
    });

    const fetchJobs = async () => {
        if (!auth?.isAuthenticated || auth?.isAnonymous) {
            setError(null); setJobs([]); return;
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
    }, [auth?.isAuthenticated, auth?.isAnonymous, filters.status, filters.language.join(',')]);

    const baseJobs = jobs;
    const normalizedSearchTerm = (searchTerm || '').trim().toLowerCase();
    const normalizedSearchWithoutHash = normalizedSearchTerm.replace(/^#/, '');

    const filteredJobs = baseJobs.filter((job) => {
        let matchesStatus = true;
        if (filters.status !== 'all') {
            const filterUpperStatus = filters.status.toUpperCase();
            const jobUpperStatus = job.status?.toUpperCase() || '';
            if (filterUpperStatus === 'COMPLETED') matchesStatus = (jobUpperStatus === 'COMPLETED');
            else if (filterUpperStatus === 'PROCESSING') matchesStatus = ['SUBMITTED', 'PROCESSING', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(jobUpperStatus);
            else if (filterUpperStatus === 'FAILED') matchesStatus = (jobUpperStatus === 'FAILED');
            else if (filterUpperStatus === 'DRAFT') matchesStatus = (jobUpperStatus === 'DRAFT');
        }
        const matchesLanguage = filters.language.length === 0 || filters.language.includes(job.language);
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
    const isFiltered = searchTerm !== '' || filters.status !== 'all' || filters.language.length > 0;

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
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Datasets Dashboard</h1>
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

                    {/* Filter Row */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                        {/* Status Pills */}
                        <div
                            className="relative flex items-center bg-white border-0 rounded-2xl p-1 shrink-0 gap-0.5"
                            style={{ boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)' }}
                        >
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'completed', label: 'Ready' },
                                { value: 'processing', label: 'In Progress' },
                                { value: 'draft', label: 'Draft' },
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

                        {/* Language Dropdown — portal-based, always on top */}
                        {uniqueLanguages.length > 0 && (
                            <LanguageDropdown
                                languages={uniqueLanguages}
                                value={filters.language}
                                onChange={(langs) => setFilters({ ...filters, language: langs })}
                            />
                        )}

                        {/* Refresh */}
                        <button
                            onClick={fetchJobs}
                            disabled={loading}
                            className={`p-3 bg-white border-0 rounded-2xl text-gray-500 hover:text-orange-600 transition-all shrink-0 ${loading ? 'opacity-50' : ''}`}
                            style={{ boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)' }}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* List Header */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-5">Dataset Information</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Progress / Stage</div>
                    <div className="col-span-1 text-right">Size</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Job List */}
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
                                <JobRow key={job.jobId} job={job} navigate={navigate} onRefresh={fetchJobs} onEditDraft={onEditDraft} />
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

// ─────────────────────────────────────────────────────────────────────────────
// LanguageDropdown
// Uses createPortal to render the panel into document.body so it is NEVER
// clipped by overflow:hidden / overflow:auto on any ancestor element.
// ─────────────────────────────────────────────────────────────────────────────
function LanguageDropdown({ languages, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('scroll', close, true);
        return () => window.removeEventListener('scroll', close, true);
    }, [open]);

    const handleToggle = () => {
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
        }
        setOpen(v => !v);
    };

    const toggleLanguage = (lang) => {
        if (value.includes(lang)) {
            onChange(value.filter(l => l !== lang));
        } else {
            onChange([...value, lang]);
        }
    };

    const clearAll = (e) => { e.preventDefault(); e.stopPropagation(); onChange([]); };
    const isFiltered = value.length > 0;

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all border-0 whitespace-nowrap shrink-0 ${isFiltered ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                style={{
                    background: isFiltered ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : 'white',
                    boxShadow: isFiltered
                        ? 'inset 1px 1px 2px rgba(99,102,241,0.08), 4px 4px 14px rgba(99,102,241,0.12), -2px -2px 8px rgba(255,255,255,0.8)'
                        : 'inset 1px 1px 3px rgba(0,0,0,0.03), inset -1px -1px 3px rgba(255,255,255,0.85), 4px 4px 14px rgba(0,0,0,0.06), -2px -2px 8px rgba(255,255,255,0.8)',
                }}
            >
                <Globe size={13} className={isFiltered ? 'text-indigo-500' : 'text-gray-400'} />
                <span>{isFiltered ? `${value.length} language${value.length > 1 ? 's' : ''}` : 'Language'}</span>
                {isFiltered && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold leading-none">
                        {value.length}
                    </span>
                )}
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} className="text-gray-400" />
                </motion.div>
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        zIndex: 99999,
                        minWidth: 180,
                        background: 'white',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter by Language</span>
                        {isFiltered && (
                            <button onMouseDown={clearAll} className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    <div className="p-1.5 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                        {languages.map((lang) => {
                            const isActive = value.includes(lang);
                            const label = lang.charAt(0).toUpperCase() + lang.slice(1);
                            return (
                                <button
                                    key={lang}
                                    onMouseDown={(e) => { e.preventDefault(); toggleLanguage(lang); }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors duration-150 ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                                        }`}>
                                        {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                                    </span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>,
                document.body
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-language avatar palette
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// JobRow
// ─────────────────────────────────────────────────────────────────────────────
function JobRow({ job, navigate, onRefresh, onEditDraft }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [hasAnimatedCheck, setHasAnimatedCheck] = useState(false);

    const upperStatus = job.status?.toUpperCase() || '';
    const isReady = upperStatus === 'COMPLETED';
    const isFailed = upperStatus === 'FAILED';
    const isStuck = upperStatus === 'SUBMITTED' || upperStatus === 'SUBMITTING';
    const isDraft = upperStatus === 'DRAFT';
    const isProcessing = !isReady && !isFailed && !isDraft;

    const palette = LANG_PALETTE[(job.language || '').toLowerCase()] || DEFAULT_PALETTE;

    useEffect(() => {
        if (isExpanded && isReady && !hasAnimatedCheck) setHasAnimatedCheck(true);
    }, [isExpanded]);

    const statusConfig = {
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Dataset Ready' },
        FAILED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
        SUBMITTED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Queued' },
        SUBMITTING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Submitting' },
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
        DEFAULT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
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
                        <div
                            className={`w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 bg-gradient-to-br ${palette.from} ${palette.to} ${palette.text} transition-all duration-300 group-hover:scale-105`}
                            style={{ boxShadow: `0 0 0 1px ${palette.glow}, 0 4px 12px ${palette.glow}` }}
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
                    {/* Mobile actions */}
                    {isReady && (
                        <div className="lg:hidden flex gap-2">
                            <button
                                onClick={async (e) => { e.stopPropagation(); try { const r = await getDownloadLink(job.jobId); if (r.download_url) window.open(r.download_url, '_blank'); else toast.error('Not available'); } catch { toast.error('Failed'); } }}
                                className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full"
                            >
                                <Download size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/asr/synthetic/job/${job.jobId}`); }}
                                className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-500 rounded-full"
                            >
                                <Eye size={14} />
                            </button>
                        </div>
                    )}
                    {isDraft && (
                        <div className="lg:hidden flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onEditDraft && job.payload) { const p = job.payload; const fd = p._wizard_form_data || { job_id: p.job_id || job.jobId, language: p.language || '', category: (p.sentence || {}).category || '', duration: p.size || 1, sentenceStyles: (p.sentence || {}).style || [], description: (p.sentence || {}).description || '', entities: (p.sentence || {}).entities || '', audioConfig: p.audio ? { voices: (p.audio.gender || []).map(g => g.toLowerCase()), ageGroups: p.audio.age_group || [], accent: (p.audio.accent || 'normal').toLowerCase() } : { voices: [], ageGroups: [], accent: 'normal' } }; if (!fd.job_id) fd.job_id = job.jobId; onEditDraft({ formData: fd, currentStage: job.wizardStage || 1 }); } }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-500 rounded-full"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={async (e) => { e.stopPropagation(); if (window.confirm('Delete this draft?')) { try { await deleteDraftJob(job.jobId); toast.success('Draft deleted'); if (onRefresh) onRefresh(); } catch { toast.error('Failed to delete'); } } }}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Status */}
                <div className="hidden lg:flex w-full lg:col-span-2 items-center">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border ${sConfig.bg} ${sConfig.text} border-current/10`}>
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${sConfig.dot}`}
                                style={{ animationDuration: isProcessing ? '1.4s' : '0s', animationIterationCount: isProcessing ? 'infinite' : '0' }} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${sConfig.dot}`} />
                        </span>
                        {sConfig.label}
                    </div>
                </div>

                {/* 3. Progress (hidden for drafts) */}
                {!isDraft && <div className="w-full lg:col-span-4 mt-0.5 lg:mt-0">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate max-w-[130px]">
                            {job.currentStage || 'Pending'}
                        </span>
                        <span className="text-[11px] font-extrabold text-gray-600 tabular-nums">{Math.round(job.progress || 0)}%</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full overflow-hidden"
                        style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.08), inset -1px -1px 2px rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.05)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress || 0}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`absolute inset-y-0 left-0 rounded-full ${isReady ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                isFailed ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                    'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'
                                }`}
                        />
                        {isProcessing && (
                            <motion.div
                                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                                animate={{ left: ['-10%', '110%'] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                            />
                        )}
                    </div>
                </div>}
                {/* Draft: spacer so desktop actions stay right-aligned */}
                {isDraft && <div className="w-full lg:col-span-4" />}

                {/* 4. Desktop actions */}
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
                    {isDraft && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onEditDraft && job.payload) { const p = job.payload; const fd = p._wizard_form_data || { job_id: p.job_id || job.jobId, language: p.language || '', category: (p.sentence || {}).category || '', duration: p.size || 1, sentenceStyles: (p.sentence || {}).style || [], description: (p.sentence || {}).description || '', entities: (p.sentence || {}).entities || '', audioConfig: p.audio ? { voices: (p.audio.gender || []).map(g => g.toLowerCase()), ageGroups: p.audio.age_group || [], accent: (p.audio.accent || 'normal').toLowerCase() } : { voices: [], ageGroups: [], accent: 'normal' } }; if (!fd.job_id) fd.job_id = job.jobId; onEditDraft({ formData: fd, currentStage: job.wizardStage || 1 }); } }}
                                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-400/40 hover:bg-blue-50/50 hover:shadow-md rounded-xl transition-all duration-200"
                                title="Edit Draft"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={async (e) => { e.stopPropagation(); if (window.confirm('Delete this draft?')) { try { await deleteDraftJob(job.jobId); toast.success('Draft deleted'); if (onRefresh) onRefresh(); } catch { toast.error('Failed to delete'); } } }}
                                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-400/40 hover:bg-red-50/50 hover:shadow-md rounded-xl transition-all duration-200"
                                title="Delete Draft"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Expanded detail */}
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

                                {/* Session ID */}
                                <motion.div
                                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.05, duration: 0.35 }}
                                    className="rounded-[20px] p-5 bg-white/60 backdrop-blur-sm"
                                    style={{ boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.04), inset -2px -2px 5px rgba(255,255,255,0.95), 6px 6px 16px rgba(0,0,0,0.06), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.7)' }}
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

                                {/* Generation Stats */}
                                <motion.div
                                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.35 }}
                                    className="rounded-[20px] p-5 bg-white/60 backdrop-blur-sm"
                                    style={{ boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.04), inset -2px -2px 5px rgba(255,255,255,0.95), 6px 6px 16px rgba(0,0,0,0.06), -3px -3px 10px rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.7)' }}
                                >
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center"
                                            style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(59,130,246,0.1)' }}>
                                            <Activity size={14} className="text-blue-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">Generation Stats</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { icon: <Globe size={13} className="text-indigo-400" />, bg: 'bg-indigo-50/80', label: 'Language', value: job.language, capitalize: true },
                                            ...(!isDraft ? [{ icon: <Timer size={13} className="text-amber-500" />, bg: 'bg-amber-50/80', label: 'Estimated Finish Time', value: '1 day' }] : []),
                                        ].map(({ icon, bg, label, value, capitalize }) => (
                                            <div key={label} className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}
                                                    style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.04)' }}>
                                                    {icon}
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider block leading-none">{label}</span>
                                                    <p className={`text-sm font-semibold text-gray-700 leading-tight mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {job.createdAt && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50/80 flex items-center justify-center shrink-0"
                                                    style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.04)' }}>
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

                                {/* Progress / Failure (hidden for drafts) */}
                                {!isDraft && <motion.div
                                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
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
                                            <button onClick={handleResubmit} disabled={isResubmitting}
                                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.25), inset 0 1px 1px rgba(255,255,255,0.2)' }}
                                            >
                                                <RotateCcw size={14} className={isResubmitting ? 'animate-spin' : ''} />
                                                {isResubmitting ? 'Resubmitting...' : 'Retry — Resubmit Job'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center ${isReady ? 'from-emerald-100 to-emerald-50' : 'from-orange-100 to-orange-50'}`}
                                                    style={{ boxShadow: isReady ? 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(16,185,129,0.1)' : 'inset 1px 1px 2px rgba(0,0,0,0.06), 2px 2px 6px rgba(249,115,22,0.1)' }}>
                                                    <Layers size={14} className={isReady ? 'text-emerald-500' : 'text-orange-500'} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                                                    {isReady ? 'Completed' : 'Live Progress'}
                                                </span>
                                            </div>
                                            <div className="space-y-3.5">
                                                {isReady && <DrawCheckmark animate={hasAnimatedCheck} />}
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[9px] uppercase text-gray-400 font-semibold tracking-wider">{job.currentStage || 'Initializing...'}</span>
                                                        <span className="text-xs font-extrabold text-gray-600">{Math.round(job.progress || 0)}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-100/60 rounded-full overflow-hidden"
                                                        style={{ boxShadow: 'inset 1.5px 1.5px 4px rgba(0,0,0,0.07), inset -1px -1px 2px rgba(255,255,255,0.7)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${job.progress || 0}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                            className={`h-full rounded-full ${isReady ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'}`}
                                                            style={{ boxShadow: isReady ? '0 1px 4px rgba(16,185,129,0.3)' : '0 1px 4px rgba(59,130,246,0.3)' }}
                                                        />
                                                    </div>
                                                </div>
                                                {!isReady && job.createdAt && (
                                                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100/50">
                                                        <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.03)' }}>
                                                            <Clock size={11} className="text-orange-400" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-orange-600">Est. finish: 1 day</span>
                                                    </div>
                                                )}
                                                {isReady && job.completedAt && (
                                                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100/50">
                                                        <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center" style={{ boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.03)' }}>
                                                            <CheckCircle2 size={11} className="text-emerald-400" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-emerald-600">Completed on {formatDate(job.completedAt)}</span>
                                                    </div>
                                                )}
                                                {isStuck && (
                                                    <div className="pt-2 border-t border-gray-100/50 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle size={12} className="text-amber-500" />
                                                            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Job appears stuck in queue</span>
                                                        </div>
                                                        <button onClick={handleResubmit} disabled={isResubmitting}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.25), inset 0 1px 1px rgba(255,255,255,0.2)' }}
                                                        >
                                                            <RotateCcw size={14} className={isResubmitting ? 'animate-spin' : ''} />
                                                            {isResubmitting ? 'Resubmitting...' : 'Resubmit Job'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>}
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
            <motion.svg width="52" height="52" viewBox="0 0 52 52" fill="none"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={animate ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <motion.circle cx="26" cy="26" r="22" stroke="#10b981" strokeWidth="1.8" fill="rgba(16,185,129,0.06)"
                    initial={{ pathLength: 0 }}
                    animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                />
                <motion.path d="M 15 26 L 23 34 L 37 18" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl py-14 px-10 text-center border border-dashed border-gray-200"
        >
            <div className="flex items-end justify-center gap-[3px] mb-7" style={{ height: '48px' }}>
                {bars.map((h, i) => (
                    <motion.div key={i}
                        className="w-[5px] rounded-full bg-gradient-to-t from-orange-500 to-orange-300"
                        style={{ height: `${h * 48}px`, transformOrigin: 'bottom', opacity: 0.7 + h * 0.3 }}
                        animate={{ scaleY: [1, h < 0.5 ? 1.8 : 0.5, 1] }}
                        transition={{ duration: 1.6 + i * 0.06, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.07 }}
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
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCreateNewClick}
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

// Global animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      .animate-spin-slow { animation: spin 4s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}