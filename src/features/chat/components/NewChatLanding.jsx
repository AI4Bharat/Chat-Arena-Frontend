import { Bot } from 'lucide-react';
import OpenAiIcon from './icons/OpenAiIcon';
import ClaudeIcon from './icons/ClaudeIcon';
import DeepseekIcon from './icons/DeepseekIcon';
import GeminiIcon from './icons/GeminiIcon';
import LlamaIcon from './icons/LlamaIcon';
import QwenIcon from './icons/QwenIcon';

const ProviderIcon = ({ icon: Icon }) => (
  <div className="h-6 w-6 flex items-center justify-center text-orange-500/80">
    <Icon className="h-full w-full" strokeWidth={1.5} />
  </div>
);

export function NewChatLanding() {
  return (
    <div className="flex flex-col items-center text-center p-4 mb-8">
      <div className="flex items-center space-x-4 mb-6">
        <ProviderIcon icon={OpenAiIcon} />
        {/* <ProviderIcon icon={ClaudeIcon} /> */}
        <ProviderIcon icon={QwenIcon} />
        <ProviderIcon icon={Bot} />
        {/* <ProviderIcon icon={DeepseekIcon} /> */}
        <ProviderIcon icon={GeminiIcon} />
        <ProviderIcon icon={LlamaIcon} />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
        Find the{' '}
        <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          best AI for you
        </span>
      </h1>

      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Compare answers across top AI models, share your feedback and power our public leaderboard.
      </p>
    </div>
  );
}