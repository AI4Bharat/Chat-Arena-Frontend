import { Bot } from 'lucide-react';
import OpenAiIcon from '../../../shared/icons/OpenAiIcon';
import ClaudeIcon from '../../../shared/icons/ClaudeIcon';
import DeepseekIcon from '../../../shared/icons/DeepseekIcon';
import GeminiIcon from '../../../shared/icons/GeminiIcon';
import LlamaIcon from '../../../shared/icons/LlamaIcon';
import QwenIcon from '../../../shared/icons/QwenIcon';
import IbmIcon from '../../../shared/icons/IbmIcon';
import SarvamIcon from '../../../shared/icons/SarvamIcon';
import AI4Bicon from '../../../shared/icons/AI4Bicon';

const ProviderIcon = ({ icon: Icon, className = 'h-6 w-6' }) => (
  <div className={`flex items-center justify-center text-orange-500/80 ${className}`}>
    <Icon className="h-full w-full" strokeWidth={1.5} />
  </div>
);

export function NewChatLanding({ isInputActive = false }) {
  return (
    <div className="flex flex-col items-center text-center p-4 mb-8" data-tour="hero">
      <div className="flex items-center space-x-4 mb-6">
        <ProviderIcon icon={OpenAiIcon} />
        {/* <ProviderIcon icon={ClaudeIcon} /> */}
        <ProviderIcon icon={QwenIcon} />
        <ProviderIcon icon={AI4Bicon} className='h-7 w-7' />
        {/* <ProviderIcon icon={DeepseekIcon} /> */}
        <ProviderIcon icon={GeminiIcon} />
        <ProviderIcon icon={LlamaIcon} className='h-7 w-7' />
        <ProviderIcon icon={IbmIcon} className='h-11 w-11' />
        <ProviderIcon icon={SarvamIcon} className='h-6 w-6' />
      </div>

      <h1 className="text-3xl md:text-5xl font-bold text-slate-800 tracking-tight">
        Find the{' '}
        <span className="bg-gradient-to-r from-orange-500 via-slate-300 to-green-600 bg-clip-text text-transparent">
          best AI for India
        </span>
        {/* {' '}🇮🇳 */}
      </h1>

      <p className="mt-4 max-w-2xl text-md md:text-lg text-slate-600">
        Compare answers across top AI models in Indian languages and contexts.
      </p>
      <p className="max-w-2xl text-md md:text-lg text-slate-600">
        Explore how well they understand our culture, diversity, and everyday life - and help shape the leaderboard for India’s AI.
      </p>
    </div>
  );
}