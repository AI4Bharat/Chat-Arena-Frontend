import { User, Bot, Copy, RefreshCw, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from "react-markdown";
import {Typography} from '@mui/material';

export function MessageItem({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrompt = (prompt) => {
    const lines = prompt.split('\n');
    const markdownString = lines.join('  \n');
    return markdownString;
  }

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-orange-600' : 'bg-gray-600'
      }`}>
        {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
      </div>
      
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`max-w-xl rounded-lg px-4 py-2 ${
          isUser ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          <Typography className="prose prose-sm max-w-none">
            <ReactMarkdown>{formatPrompt(message.content)}</ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            )}
          </Typography>
          
          {!isUser && !message.isStreaming && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <GitBranch size={14} />
                Branch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}