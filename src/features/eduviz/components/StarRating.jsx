import { Star } from 'lucide-react';

export function StarRating({ label, score, maxScore = 5, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxScore }, (_, i) => {
            const filled = i < score;
            return (
              <button
                key={i}
                onClick={() => onChange(i + 1 === score ? 0 : i + 1)}
                className="p-0.5 transition-transform hover:scale-110"
                title={`${i + 1}/${maxScore}`}
              >
                <Star
                  className={`${filled ? 'text-amber-400' : 'text-gray-300'} w-4 h-4 sm:w-5 sm:h-5`}
                  fill={filled ? '#fbbf24' : 'none'}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>
        <span className="text-xs text-gray-400 tabular-nums ml-1 w-8 text-right">
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}
