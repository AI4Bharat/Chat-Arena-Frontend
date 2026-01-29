import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code className="bg-gray-100 text-gray-800 font-mono text-[0.85em] px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  }

  return (
    <div className="not-prose bg-gray-50 rounded-lg border border-gray-200 my-4 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-1 bg-gray-100 border-b border-gray-200">
        <span className="text-gray-600 text-xs font-sans font-medium capitalize">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"
          title="Copy code"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneLight}
        showLineNumbers={false}
        customStyle={{
          margin: 0,
          padding: '1rem',
          backgroundColor: '#f9fafb',
          fontSize: '0.875rem',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}