import { useState } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import { apiClient, endpoints } from '../../../shared/api';
import { toast } from 'react-hot-toast';

export function FeedbackModal({ isOpen, onClose, sessionId, messageId, modelId }) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'accuracy',
    'helpfulness',
    'creativity',
    'speed',
    'coherence',
    'other'
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(endpoints.feedback.submit, {
        session_id: sessionId,
        message_id: messageId,
        model_id: modelId,
        type: 'rating',
        rating,
        category,
        comment,
      });
      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Rate this response
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
              >
                <Star
                  size={32}
                  className={value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>

          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (optional)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}              
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}