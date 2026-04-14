import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanText, BookOpen, LogIn, Sparkles, FileText } from 'lucide-react';
import { AuthModal } from '../../auth/components/AuthModal';
import './EduVizAuthBarrier.css';

/**
 * EduVizAuthBarrier — Authentication wall for the EduViz workbench.
 * Blocks guests from accessing the annotation tool and redirects to sign-in.
 */
export function EduVizAuthBarrier() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center max-w-xl w-full"
      >
        {/* Animated Illustration */}
        <div className="relative h-64 mb-8 flex items-center justify-center">
          <div className="eduviz-auth-glow" />

          {/* Main Visual: Scanning a document */}
          <div className="relative w-40 h-52 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 overflow-hidden eduviz-floating-doc">
            <div className="eduviz-scan-line" />
            <div className="space-y-3">
              <div className="h-2 w-3/4 bg-gray-100 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded" />
              <div className="h-2 w-5/6 bg-gray-100 rounded" />
              <div className="h-10 w-full bg-orange-50 rounded-lg flex items-center justify-center">
                <ScanText size={20} className="text-orange-300" />
              </div>
              <div className="h-2 w-full bg-gray-100 rounded" />
              <div className="h-2 w-2/3 bg-gray-100 rounded" />
            </div>
          </div>

          {/* Floating icons */}
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-1/4 text-orange-400 opacity-60"
          >
            <BookOpen size={32} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 right-1/4 text-amber-400 opacity-60"
          >
            <FileText size={28} />
          </motion.div>

          {/* Sparkles */}
          <div className="eduviz-sparkle top-4 right-1/3 text-yellow-400" style={{ animationDelay: '0.5s' }}><Sparkles size={16} /></div>
          <div className="eduviz-sparkle bottom-20 left-1/3 text-orange-300" style={{ animationDelay: '1.2s' }}><Sparkles size={12} /></div>
        </div>

        {/* Text Content */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-orange-500/10 border border-white/50">
          <motion.h2 
            className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3 px-4"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 200%'
            }}
          >
            Sign in Required
          </motion.h2>
          
          <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8 px-4">
            Please sign in to access the EduViz Benchmark workspace. Join our community of experts evaluating Indian educational documents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-200"
            >
              <LogIn size={18} />
              Sign in to EduViz
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </motion.div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        session_type="EDUVIZ"
      />
    </div>
  );
}
