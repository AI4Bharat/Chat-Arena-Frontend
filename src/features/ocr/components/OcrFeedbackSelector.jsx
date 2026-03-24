import { ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, ariaLabel, className = '' }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`
      flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
      bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] rounded-full shadow-sm
      text-gray-700 dark:text-[#ececec]
      hover:bg-gray-100 dark:hover:bg-[#333333] hover:border-gray-400 dark:hover:border-[#555555] hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
      transition-all duration-200
      ${className}
    `}
  >
    {children}
  </button>
);

export function OcrFeedbackSelector({ onSelect, submitted, winner }) {
  if (submitted) {
    const label = winner === 'model_a'
      ? 'Left is Better'
      : winner === 'model_b'
        ? 'Right is Better'
        : winner === 'tie'
          ? 'Both are Good'
          : 'Both are Bad';

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-3"
      >
        <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-full px-4 py-1.5">
          Submitted: {label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex justify-center py-3"
    >
      <div className="flex items-center p-1 bg-white/90 dark:bg-[#2a2a2a] backdrop-blur border border-gray-200/80 dark:border-[#3a3a3a] rounded-full shadow-md gap-1">
        {/* Mobile: icon-only */}
        <div className="flex sm:hidden items-center gap-1">
          <Button onClick={() => onSelect('model_a')} ariaLabel="Left is better" className="w-10 h-10 p-0">
            <ArrowLeft size={16} />
          </Button>
          <Button onClick={() => onSelect('tie')} ariaLabel="Both good" className="w-10 h-10 p-0">
            <ThumbsUp size={16} />
          </Button>
          <Button onClick={() => onSelect('both_bad')} ariaLabel="Both bad" className="w-10 h-10 p-0">
            <ThumbsDown size={16} />
          </Button>
          <Button onClick={() => onSelect('model_b')} ariaLabel="Right is better" className="w-10 h-10 p-0">
            <ArrowRight size={16} />
          </Button>
        </div>

        {/* Desktop: text labels */}
        <div className="hidden sm:flex items-center gap-1">
          <Button onClick={() => onSelect('model_a')} ariaLabel="Left is better">
            <ArrowLeft size={15} /> Left is Better
          </Button>
          <Button onClick={() => onSelect('tie')} ariaLabel="Both are good">
            <ThumbsUp size={15} /> Both are Good
          </Button>
          <Button onClick={() => onSelect('both_bad')} ariaLabel="Both are bad">
            <ThumbsDown size={15} /> Both are Bad
          </Button>
          <Button onClick={() => onSelect('model_b')} ariaLabel="Right is better">
            Right is Better <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
