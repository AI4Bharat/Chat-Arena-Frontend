import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  List, 
  Filter,
  ArrowUpDown,
  LoaderCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchEduvizSessions, 
  deleteEduvizSession, 
  renameEduvizSession, 
  togglePinEduvizSession 
} from '../store/eduvizSlice';
import { EduVizSessionCard } from './EduVizSessionCard';
import { RenameSessionModal } from '../../chat/components/RenameSessionModal';
import { toast } from 'react-hot-toast';

export function EduVizDashboard({ onStartNew }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessions, loading } = useSelector(s => s.eduviz);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'
  
  // Rename modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);

  useEffect(() => {
    dispatch(fetchEduvizSessions());
  }, [dispatch]);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(s => {
        const assessment = s.metadata?.eduviz_assessment?.metadata || {};
        return s.title?.toLowerCase().includes(lowSearch) || 
          s.id.toLowerCase().includes(lowSearch) ||
          assessment.taskType?.toLowerCase().includes(lowSearch) ||
          assessment.subject?.toLowerCase().includes(lowSearch) ||
          assessment.grade?.toString().includes(lowSearch) ||
          assessment.language?.toLowerCase().includes(lowSearch);
      });
    }

    // Sort
    result.sort((a, b) => {
      // Pinned sessions always come first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    return result;
  }, [sessions, searchTerm, sortBy]);

  const handleDelete = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await dispatch(deleteEduvizSession(sessionId)).unwrap();
        toast.success('Session deleted successfully', {
          icon: '🗑️',
          style: { borderRadius: '12px', fontWeight: 'bold' }
        });
      } catch (err) {
        toast.error('Failed to delete session');
      }
    }
  };

  const handleRenameConfirm = async (newTitle) => {
    if (!sessionToRename) return;
    try {
      await dispatch(renameEduvizSession({ 
        sessionId: sessionToRename.id, 
        title: newTitle 
      })).unwrap();
      toast.success('Session renamed successfully', {
        icon: '✏️',
        style: { borderRadius: '12px', fontWeight: 'bold' }
      });
    } catch (err) {
      toast.error('Failed to rename session');
    }
  };

  const openRenameModal = (session) => {
    setSessionToRename(session);
    setIsRenameModalOpen(true);
  };

  const handleTogglePin = async (session) => {
    try {
      await dispatch(togglePinEduvizSession({ sessionId: session.id, isPinned: !session.is_pinned })).unwrap();
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FDFCFB]">
      {/* Dashboard Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">EduViz Benchmark</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onStartNew()}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-bold shadow-lg shadow-orange-100 transition-all group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              New Annotation
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
          <div className="space-y-8">
          
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search sessions, tasks, or IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${sortBy === 'newest' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Newest
                </button>
                <button 
                  onClick={() => setSortBy('title')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${sortBy === 'title' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Title
                </button>
              </div>

              <button 
                onClick={() => dispatch(fetchEduvizSessions())}
                className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 transition-all shadow-sm"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {loading && sessions.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-100/50 rounded-2xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-200">
                <List size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">No sessions found</h3>
                <p className="text-gray-400 max-w-xs mx-auto text-sm">
                  {searchTerm ? "Try adjusting your search or filters." : "Start your first educational document annotation session."}
                </p>
              </div>
              {!searchTerm && (
                <button
                  onClick={onStartNew}
                  className="px-8 py-3 bg-white text-orange-600 border-2 border-orange-100 rounded-2xl font-bold hover:bg-orange-50 transition-all font-sans shadow-sm"
                >
                  Create First Session
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Session Rows */}
              <AnimatePresence mode="popLayout">
                {filteredSessions.map((session) => (
                  <EduVizSessionCard
                    key={session.id}
                    session={session}
                    onView={() => navigate(`/eduviz/${session.id}`)}
                    onDelete={() => handleDelete(session.id)}
                    onRename={() => openRenameModal(session)}
                    onTogglePin={() => handleTogglePin(session)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>

      {/* Modals */}
      <RenameSessionModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRenameConfirm}
        currentTitle={sessionToRename?.title || ''}
      />
    </div>
  );
}
