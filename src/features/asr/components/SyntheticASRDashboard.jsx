import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, ChevronDown, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getJobs } from '../../../services/syntheticAsrApi';

export function SyntheticASRDashboard({ onCreateNewClick }) {
  const auth = useSelector((state) => state.auth);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    language: 'all',
    sortBy: 'newest'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const demoJobs = [
    {
      jobId: 'demo-2026-01-30-001',
      language: 'Hindi',
      size: 2,
      status: 'COMPLETED',
      progress: 100,
      currentStage: 'Completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      jobId: 'demo-2026-01-30-002',
      language: 'Tamil',
      size: 1,
      status: 'AUDIO_VERIFIED',
      progress: 75,
      currentStage: 'Audio verification',
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
      completedAt: null,
    },
    {
      jobId: 'demo-2026-01-30-003',
      language: 'Telugu',
      size: 3,
      status: 'SENTENCE_GENERATED',
      progress: 35,
      currentStage: 'Sentence generation',
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      completedAt: null,
    },
    {
      jobId: 'demo-2026-01-30-004',
      language: 'Kannada',
      size: 1,
      status: 'FAILED',
      progress: 10,
      currentStage: 'Sentence generation',
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      completedAt: null,
      errorMessage: 'Demo failure: temporary service issue',
    },
  ];

  // Fetch jobs from backend API
  const fetchJobs = async () => {
    // Guard: only logged-in (non-anonymous) users
    if (!auth?.isAuthenticated || auth?.isAnonymous) {
      setError(null);
      setJobs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching jobs from API...');
      const data = await getJobs(1, 50, filters.status, filters.language);
      console.log('Jobs fetched successfully:', data);
      // Convert ISO strings to Date objects
      const jobsWithDates = data.items.map(job => ({
        ...job,
        createdAt: job.createdAt ? new Date(job.createdAt) : null,
        completedAt: job.completedAt ? new Date(job.completedAt) : null,
      }));
      setJobs(jobsWithDates);
    } catch (err) {
      console.error('Failed to fetch jobs error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [auth?.isAuthenticated, auth?.isAnonymous]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [filters]);

  const getRelativeTime = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status) => {
    // Backend returns uppercase statuses like COMPLETED, FAILED, SUBMITTED, etc.
    const upperStatus = status?.toUpperCase() || '';
    
    if (upperStatus === 'COMPLETED') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (['SUBMITTED', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(upperStatus)) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    } else if (upperStatus === 'FAILED') {
      return 'bg-red-50 text-red-700 border border-red-200';
    } else {
      return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    
    if (upperStatus === 'COMPLETED') {
      return '✓';
    } else if (['SUBMITTED', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(upperStatus)) {
      return '⏳';
    } else if (upperStatus === 'FAILED') {
      return '✕';
    } else {
      return '○';
    }
  };

  const getProgressBarColor = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    
    if (upperStatus === 'COMPLETED') {
      return 'bg-emerald-500';
    } else if (['SUBMITTED', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(upperStatus)) {
      return 'bg-blue-500';
    } else if (upperStatus === 'FAILED') {
      return 'bg-red-500';
    } else {
      return 'bg-gray-400';
    }
  };

  const baseJobs = error && jobs.length === 0 ? demoJobs : jobs;

  const filteredJobs = baseJobs.filter((job) => {
    // Status filter: if specific status selected, match backend status values
    let matchesStatus = true;
    if (filters.status !== 'all') {
      // Convert filter values like 'completed' to 'COMPLETED'
      const filterUpperStatus = filters.status.toUpperCase();
      const jobUpperStatus = job.status?.toUpperCase() || '';
      if (filterUpperStatus === 'COMPLETED') {
        matchesStatus = jobUpperStatus === 'COMPLETED';
      } else if (filterUpperStatus === 'PROCESSING') {
        matchesStatus = ['SUBMITTED', 'SENTENCE_GENERATED', 'AUDIO_GENERATED', 'AUDIO_VERIFIED'].includes(jobUpperStatus);
      } else if (filterUpperStatus === 'FAILED') {
        matchesStatus = jobUpperStatus === 'FAILED';
      }
    }
    
    const matchesLanguage = filters.language === 'all' || job.language === filters.language;
    const matchesSearch = searchTerm === '' || job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesLanguage && matchesSearch;
  });

  const uniqueLanguages = [...new Set(baseJobs.map(job => job.language))];

  const getStatusLabel = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    switch (upperStatus) {
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'SUBMITTED':
        return 'Processing';
      case 'SENTENCE_GENERATED':
        return 'Processing';
      case 'AUDIO_GENERATED':
        return 'Processing';
      case 'AUDIO_VERIFIED':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  // If not authenticated, show access gate
  if (!auth?.isAuthenticated || auth?.isAnonymous) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-sm text-gray-600 mb-4">Please sign in with Google to create and view your Synthetic ASR datasets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Synthetic ASR Dataset Creation
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and create your audio datasets
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCreateNewClick}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all shadow-md"
            >
              <Plus size={16} />
              Create New Dataset
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
          <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-10 text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="completed">✓ Completed</option>
                <option value="processing">⏳ Processing</option>
                <option value="failed">✕ Failed</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {/* Language Filter */}
            <div className="relative">
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-10 text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Languages</option>
                {uniqueLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Job ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 pl-10 text-gray-700 placeholder-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-10 text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="largest">Largest First</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-600">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            {loading && <span className="ml-2 text-blue-600">• Updating...</span>}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
          >
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </motion.div>
        )}


        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 text-center"
          >
            <div className="text-gray-400 mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600 mb-6">
              {jobs.length === 0
                ? 'Create your first synthetic ASR dataset to get started!'
                : 'Try adjusting your filters or search terms.'}
            </p>
            {jobs.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCreateNewClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all"
              >
                <Plus size={16} />
                Create Dataset
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {filteredJobs.map((job) => (
              <div key={job.jobId}>
                <JobRow 
                  job={job} 
                  getRelativeTime={getRelativeTime} 
                  getStatusColor={getStatusColor} 
                  getStatusIcon={getStatusIcon} 
                  getProgressBarColor={getProgressBarColor}
                  getStatusLabel={getStatusLabel}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({ job, getRelativeTime, getStatusColor, getStatusIcon, getProgressBarColor, getStatusLabel }) {
  const [showDetails, setShowDetails] = useState(false);
  const upperStatus = job.status?.toUpperCase() || '';

  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Main Row */}
      <div
        className="px-3 py-2 flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Job ID and Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 font-mono truncate">{job.jobId}</h3>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-700 font-medium">{job.language}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{job.size} hrs</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)} {getStatusLabel(job.status)}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              Created {getRelativeTime(job.createdAt)} • {job.currentStage}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="ml-4 flex items-center gap-4 min-w-0">
          <div className="text-right min-w-[120px]">
            <div className="text-xs text-gray-600">{job.progress}%</div>
            <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(job.status)} transition-all duration-300 rounded-full`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-100 bg-gradient-to-r from-orange-50 to-blue-50 px-4 py-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Job Information</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Job ID</dt>
                  <dd className="text-gray-900 font-mono">{job.jobId}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Language</dt>
                  <dd className="text-gray-900">{job.language}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Dataset Size</dt>
                  <dd className="text-gray-900">{job.size} hours</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Pipeline Progress</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Current Stage</dt>
                  <dd className="text-gray-900">{job.currentStage}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Progress</dt>
                  <dd className="text-gray-900">{job.progress}% Complete</dd>
                </div>
                {upperStatus === 'COMPLETED' && job.completedAt && (
                  <div>
                    <dt className="text-gray-600">Completed</dt>
                    <dd className="text-gray-900">{getRelativeTime(job.completedAt)}</dd>
                  </div>
                )}
                {upperStatus === 'FAILED' && job.errorMessage && (
                  <div>
                    <dt className="text-gray-600">Error</dt>
                    <dd className="text-red-600 font-medium">{job.errorMessage}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
