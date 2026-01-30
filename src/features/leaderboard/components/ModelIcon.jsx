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

export function ModelIcon({ organization, className = 'h-5 w-5' }) {
  if (!organization) return <Bot className={className} />;

  const orgLower = organization.toLowerCase();
  
  let Icon = Bot;

  if (orgLower.includes('openai')) Icon = OpenAiIcon;
  else if (orgLower.includes('anthropic') || orgLower.includes('claude')) Icon = ClaudeIcon;
  else if (orgLower.includes('deepseek')) Icon = DeepseekIcon;
  else if (orgLower.includes('google') || orgLower.includes('gemini')) Icon = GeminiIcon;
  else if (orgLower.includes('meta') || orgLower.includes('llama')) Icon = LlamaIcon;
  else if (orgLower.includes('qwen') || orgLower.includes('alibaba')) Icon = QwenIcon;
  else if (orgLower.includes('ibm') || orgLower.includes('watson')) Icon = IbmIcon;
  else if (orgLower.includes('sarvam')) Icon = SarvamIcon;
  else if (orgLower.includes('ai4b') || orgLower.includes('ai4bharat')) Icon = AI4Bicon;

  return (
    <div className={`flex items-center justify-center text-gray-500 ${className}`}>
        <Icon className="h-full w-full" strokeWidth={1.5} />
    </div>
  );
}
