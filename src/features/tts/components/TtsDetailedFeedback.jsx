import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Send, ChartColumn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const EVALUATION_PARAMETERS = [
  {
    key: 'intelligibility',
    label: 'Intelligibility (Pronunciation)',
    description: 'How clearly are words pronounced?'
  },
  {
    key: 'expressiveness',
    label: 'Expressiveness',
    description: 'Emotional range and variation'
  },
  {
    key: 'voice_quality',
    label: 'Voice Quality',
    description: 'Overall sound quality and naturalness'
  },
  {
    key: 'liveliness',
    label: 'Liveliness',
    description: 'Energy and engagement level'
  },
  {
    key: 'noise',
    label: 'Presence of Noise',
    description: 'Background noise or artifacts'
  },
  {
    key: 'hallucinations',
    label: 'Hallucinations',
    description: 'Accuracy to input text'
  }
];

const RatingSlider = ({ label, description, value, onChange, modelLabel = '' }) => {
  const [isHovering, setIsHovering] = useState(false);
  const sliderRef = useRef(null);

  // Get color based on rating value (red to green gradient)
  const getColorForRating = (rating) => {
    if (!rating) return '#e5e7eb';
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']; // red to green
    return colors[rating - 1];
  };

  // Handle click on slider track for direct rating selection
  const handleSliderClick = (e) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newValue = Math.max(1, Math.min(5, Math.round(percentage * 4) + 1));
    onChange(newValue);
  };

  const currentColor = getColorForRating(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">
            {label} {modelLabel && <span className="text-gray-500">({modelLabel})</span>}
          </label>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 sm:ml-4">
          <span className="text-xs font-medium text-gray-600 min-w-[60px] text-right">
            {value ? RATING_LABELS[value] : 'Not rated'}
          </span>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleSliderClick}
      >
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value || 3}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pointer-events-none"
          style={{
            background: value
              ? `linear-gradient(to right, ${currentColor} 0%, ${currentColor} ${((value - 1) / 4) * 100}%, #e5e7eb ${((value - 1) / 4) * 100}%, #e5e7eb 100%)`
              : '#e5e7eb'
          }}
        />
        <div className="flex justify-between mt-1 px-1">
          {[1, 2, 3, 4, 5].map((tick) => {
            const isActive = value === tick;
            return (
              <span
                key={tick}
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                {tick}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ComparisonButtons = ({ label, description, value, onChange, modelAName, modelBName }) => {
  const options = [
    { key: 'left_better', label: `${modelAName} is better`, ratingsA: 5, ratingsB: 1 },
    { key: 'both_good', label: 'Both good', ratingsA: 5, ratingsB: 5 },
    { key: 'both_bad', label: 'Both bad', ratingsA: 1, ratingsB: 1 },
    { key: 'right_better', label: `${modelBName} is better`, ratingsA: 1, ratingsB: 5 },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {options.map((option) => {
          const isSelected = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key, option.ratingsA, option.ratingsB)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                isSelected
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TtsDetailedFeedback = ({
  mode = 'direct', // 'direct' | 'compare' | 'random' | 'academic'
  onSubmit,
  isSubmitting = false,
  modelAName = 'Left Model',
  modelBName = 'Right Model'
}) => {
  const [isExpanded, setIsExpanded] = useState(mode === 'academic');

  // For direct mode: single set of ratings
  const [ratings, setRatings] = useState({});

  // For compare modes: comparison selections
  const [comparisonSelections, setComparisonSelections] = useState({});

  const [comment, setComment] = useState('');

  const isDirect = mode === 'direct';

  const handleComparisonChange = (paramKey, selectionKey, ratingA, ratingB) => {
    setComparisonSelections({
      ...comparisonSelections,
      [paramKey]: { selection: selectionKey, ratingA, ratingB }
    });
  };

  const handleSubmit = async () => {
    try {
      let feedbackData;

      if (isDirect) {
        feedbackData = {
          detailed_ratings: ratings,
          additional_comment: comment.trim()
        };
      } else {
        // Convert comparison selections to ratings format
        const ratingsA = {};
        const ratingsB = {};

        Object.keys(comparisonSelections).forEach((paramKey) => {
          const selection = comparisonSelections[paramKey];
          ratingsA[paramKey] = selection.ratingA;
          ratingsB[paramKey] = selection.ratingB;
        });

        feedbackData = {
          detailed_ratings_a: ratingsA,
          detailed_ratings_b: ratingsB,
          additional_comment: comment.trim()
        };
      }

      await onSubmit(feedbackData);
      // Only collapse after submission completes
      if (!isSubmitting) {
        setIsExpanded(false);
      }
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error submitting feedback:', error);
    }
  };

  // Check if all parameters have been rated
  const hasAllRatings = () => {
    if (isDirect) {
      return EVALUATION_PARAMETERS.every((param) => ratings[param.key] !== undefined);
    } else {
      return EVALUATION_PARAMETERS.every((param) => comparisonSelections[param.key] !== undefined);
    }
  };

  const canSubmit = hasAllRatings();

  return (
    <div className={"w-full"}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChartColumn size={16} className="text-orange-500" />
          Provide detailed feedback
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 px-3 py-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                {isDirect
                  ? 'Help us improve by rating the audio quality on these parameters:'
                  : 'Compare both models on these parameters by selecting which performs better:'}
              </p>

              {isDirect ? (
                // Direct mode: Single column of sliders
                <div className="space-y-4">
                  {EVALUATION_PARAMETERS.map((param) => (
                    <RatingSlider
                      key={param.key}
                      label={param.label}
                      description={param.description}
                      value={ratings[param.key]}
                      onChange={(value) => setRatings({ ...ratings, [param.key]: value })}
                    />
                  ))}
                </div>
              ) : (
                // Compare modes: Comparison buttons
                <div className="space-y-5">
                  {EVALUATION_PARAMETERS.map((param) => (
                    <ComparisonButtons
                      key={param.key}
                      label={param.label}
                      description={param.description}
                      value={comparisonSelections[param.key]?.selection}
                      onChange={(selectionKey, ratingA, ratingB) =>
                        handleComparisonChange(param.key, selectionKey, ratingA, ratingB)
                      }
                      modelAName={modelAName}
                      modelBName={modelBName}
                    />
                  ))}
                </div>
              )}

              {/* Additional comment field */}
              <div className="space-y-2 mt-6">
                <label className="text-sm font-medium text-gray-700">
                  Additional Comments (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share any additional thoughts about the audio quality..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Submit button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    canSubmit && !isSubmitting
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default TtsDetailedFeedback;
