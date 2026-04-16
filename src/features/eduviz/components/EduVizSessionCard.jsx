import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Eye,
  Trash2,
  Pencil,
  MoreVertical,
  GraduationCap,
  Book,
  Clock,
  Pin,
  PinOff,
  ChevronRight,
  Hash,
  Globe,
  Settings,
  Activity,
  Type
} from 'lucide-react';

export function EduVizSessionCard({
  session,
  onView,
  onDelete,
  onRename,
  onTogglePin
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const metadata = session.metadata || {};
  const assessment = {
    ...metadata,
    ...(metadata.eduviz_assessment?.metadata || {})
  };

  const createdAtFormatted = session.created_at ? new Date(session.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Unknown';

  const getTaskColor = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('math') || t.includes('formulae')) return 'from-orange-500 to-red-600';
    if (t.includes('writing') || t.includes('essay')) return 'from-blue-500 to-indigo-600';
    if (t.includes('practise') || t.includes('drawing')) return 'from-emerald-500 to-teal-600';
    if (t.includes('assessment')) return 'from-purple-500 to-fuchsia-600';
    return 'from-slate-400 to-slate-500';
  };

  const getSessionTitle = () => {
    if (session.title && !session.title.startsWith('Session ')) {
      return session.title;
    }
    const components = [];
    if (assessment.subject) components.push(assessment.subject);
    if (assessment.grade) components.push(`Grade ${assessment.grade}`);
    if (assessment.taskType) components.push(assessment.taskType.replace('_', ' '));

    if (components.length > 0) {
      return components.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' · ');
    }

    return session.title || `Session ${session.id.slice(0, 8)}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`group relative bg-white/70 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 transition-all duration-300 ${(isExpanded || showMenu) ? 'z-30 shadow-2xl ring-1 ring-orange-100 ring-offset-2' : 'hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5'}`}
    >
      {/* Clickable Header Area */}
      <div
        className="px-4 py-4 md:px-6 md:py-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon / Avatar */}
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getTaskColor(assessment.taskType)} flex items-center justify-center text-white shadow-lg shadow-current/10 shrink-0 group-hover:scale-105 transition-transform duration-300`}
        >
          <FileText size={22} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="text-sm md:text-base font-bold text-gray-900 truncate hover:text-orange-600 hover:underline transition-all cursor-pointer"
              title="Click to enter workspace"
            >
              {getSessionTitle()}
            </h3>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-400">
                <Hash size={12} className="opacity-50" />
                {session.id.slice(0, 8)}
              </span>
              {assessment.taskType && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-tight">
                    {assessment.taskType.replace('_', ' ')}
                  </span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                <Calendar size={12} className="opacity-50" />
                {createdAtFormatted.split(',')[0]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Expansion Indicator */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-gray-300 group-hover:text-orange-400 transition-colors hidden sm:block"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={onView}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                title="Open Benchmark"
              >
                <Eye size={20} strokeWidth={2.5} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-xl transition-all ${showMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  <MoreVertical size={20} />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10, x: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10, x: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20"
                      >
                        <button
                          onClick={() => { onTogglePin(); setShowMenu(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          {session.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                          {session.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => { onRename(); setShowMenu(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Pencil size={16} />
                          Rename
                        </button>
                        <div className="h-px bg-gray-50 my-1 mx-2" />
                        <button
                          onClick={() => { onDelete(); setShowMenu(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Detail Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-5 py-6 md:px-8 bg-gradient-to-br from-orange-50/20 via-white to-blue-50/10 border-t border-gray-50 rounded-b-[1.5rem] md:rounded-b-[2rem]">
              <div className="grid grid-cols-1 gap-4">

                {/* Educational Metadata Grid */}
                <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm md:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                      <GraduationCap size={14} className="text-orange-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Educational Statistics</span>
                  </div>

                  <div className="flex flex-wrap gap-4 md:gap-5">
                    {[
                      { show: true, icon: <Globe size={13} />, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Language', value: assessment.language || 'N/A' },
                      { show: true, icon: <Book size={13} />, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Subject', value: assessment.subject || 'N/A' },
                      { show: true, icon: <GraduationCap size={13} />, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Grade', value: assessment.grade || 'N/A' },
                      { show: !!assessment.script, icon: <Type size={13} />, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Script', value: assessment.script },
                      { show: !!assessment.writing, icon: <Pencil size={13} />, color: 'text-teal-500', bg: 'bg-teal-50', label: 'Style', value: assessment.writing },
                    ].filter(s => s.show).map((stat, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white/80 border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-colors">
                        <div className={`w-6 h-6 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                          {stat.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] uppercase text-gray-400 font-bold leading-none">{stat.label}</span>
                          <span className="text-xs font-black text-gray-800 mt-0.5 capitalize truncate">{stat.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {session.is_pinned && (
        <div className="absolute top-0 right-10 -translate-y-1/2 p-1.5 bg-orange-500 text-white rounded-full shadow-lg border-2 border-white">
          <Pin size={10} fill="currentColor" />
        </div>
      )}
    </motion.div>
  );
}
