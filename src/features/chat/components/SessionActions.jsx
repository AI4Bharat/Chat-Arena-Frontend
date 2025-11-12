import { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { toast } from 'react-hot-toast';

export function SessionActions({ sessionId }) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const response = await apiClient.post(endpoints.sessions.share(sessionId));
      const link = `${window.location.origin}/#/shared/${response.data.share_token}`;
      setShareLink(link);
      setIsShareModalOpen(true);
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleExport = async (format) => {
    try {
      const response = await apiClient.get(endpoints.sessions.export(sessionId), {
        params: { format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conversation-${sessionId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Conversation exported');
    } catch (error) {
      toast.error('Failed to export conversation');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          title="Share conversation"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-2 py-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsShareModalOpen(false)} 
            />
            {/* Card container: smaller, responsive */}
            <div className="relative bg-white rounded-2xl w-full max-w-xs sm:max-w-sm p-4 sm:p-6 shadow-xl transform transition-all">
              {/* Header with icon */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Share2 size={20} className="text-orange-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Share Conversation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                Anyone with this link can view your conversation. The link will remain active as long as sharing is enabled.
              </p>
              {/* Link input with copy button */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs sm:text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all transform hover:scale-105 ${
                    copied 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {/* Info box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-xs sm:text-sm text-orange-800">
                  Shared conversations are <strong>view-only</strong>. Others cannot edit or continue the conversation.
                </p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}