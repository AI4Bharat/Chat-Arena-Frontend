import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ThumbsDown, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, onMouseEnter, className = '', ariaLabel }) => (
  <button
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    aria-label={ariaLabel}
    className={`
      flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium 
      bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm 
      text-gray-700 dark:text-gray-200 
      hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md 
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
      transition-all duration-200
      ${className}
    `}
  >
    {children}
  </button>
);

export function FeedbackSelector({ onSelect, onHover }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}

      className="absolute bottom-[104px] sm:bottom-[122px] left-0 right-0 z-30 flex justify-center"

      onMouseLeave={() => onHover(null)}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex items-center p-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200/80 dark:border-gray-700 rounded-full shadow-md"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex sm:hidden items-center gap-3">
          <Button
            onClick={() => onSelect('model_a')}
            onMouseEnter={() => onHover('model_a')}
            ariaLabel="Top is better"
            className="w-22 h-10 p-0 gap-3"
          >
            <ArrowUp size={16} />
            <ThumbsUp size={16} />
          </Button>
          <Button
            onClick={() => onSelect('tie')}
            onMouseEnter={() => onHover('tie')}
            ariaLabel="Both are good"
            className="w-22 h-10 p-0 gap-3"
          >
            <ThumbsUp size={16} />
            <ThumbsUp size={16} />
          </Button>
          <Button
            onClick={() => onSelect('both_bad')}
            onMouseEnter={() => onHover('both_bad')}
            ariaLabel="Both are bad"
            className="w-22 h-10 p-0 gap-3"
          >
            <ThumbsDown size={16} />
            <ThumbsDown size={16} />
          </Button>
          <Button
            onClick={() => onSelect('model_b')}
            onMouseEnter={() => onHover('model_b')}
            ariaLabel="Bottom is better"
            className="w-22 h-10 p-0 gap-3"
          >
            <ArrowDown size={16} />
            <ThumbsUp size={16} />
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <Button onClick={() => onSelect('model_a')} onMouseEnter={() => onHover('model_a')} ariaLabel="Left is better">
            <ArrowLeft size={16} /> Left is Better
          </Button>
          <Button onClick={() => onSelect('tie')} onMouseEnter={() => onHover('tie')} ariaLabel="Both are good">
            <ThumbsUp size={16} /> Both are good
          </Button>
          <Button onClick={() => onSelect('both_bad')} onMouseEnter={() => onHover('both_bad')} ariaLabel="Both are bad">
            <ThumbsDown size={16} /> Both are Bad
          </Button>
          <Button onClick={() => onSelect('model_b')} onMouseEnter={() => onHover('model_b')} ariaLabel="Right is better">
            <ArrowRight size={16} /> Right is Better
          </Button>
        </div>
      </div>
    </motion.div>
  );
}