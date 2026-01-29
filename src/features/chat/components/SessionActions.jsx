import { useState } from 'react';
import { Download } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { toast } from 'react-hot-toast';

export function SessionActions({ sessionId }) {
  // share button removed from navbar per design


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
        {/* share button intentionally removed from navbar */}
      </div>

      {/* Share Modal */}
      {/* share modal removed from navbar */}
    </>
  );
}