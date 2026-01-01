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
      const link = `${window.location.origin}/shared/${response.data.share_token}`;
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
        
        <div className="relative group">
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            title="Export conversation"
          >
            <Download size={20} />
          </button>
          
          {/* Export Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-2 hover:bg-gray-50"
            >
              Export as JSON
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="w-full text-left px-4 py-2 hover:bg-gray-50"
            >
              Export as Markdown
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="w-full text-left px-4 py-2 hover:bg-gray-50"
            >
              Export as Text
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsShareModalOpen(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Share Conversation
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Anyone with this link can view your conversation
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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