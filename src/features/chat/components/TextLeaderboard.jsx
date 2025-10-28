// TextLeaderboard.jsx
import { LeaderboardTable } from './LeaderboardTable';
import { FileText, Clock } from 'lucide-react';

export function TextLeaderboard() {
  // This would come from your API/backend
  const fullTextData = [
    // All rows (not just top 10)
    { rank: 1, model: "gemini-2.5-pro", score: 1451, ci: 4, votes: 54087, organization: "Google", license: "Proprietary" },
    { rank: 1, model: "claude-opus-4-1-20250805-thinking-16k", score: 1447, ci: 5, votes: 21306, organization: "Anthropic", license: "Proprietary" },
    { rank: 1, model: "claude-sonnet-4-5-20250929-thinking-32k", score: 1445, ci: 8, votes: 6287, organization: "Anthropic", license: "Proprietary" },
    { rank: 1, model: "gpt-4.5-preview-2025-02-27", score: 1441, ci: 6, votes: 14644, organization: "OpenAI", license: "Proprietary" },
    { rank: 2, model: "chatgpt-4o-latest-20250326", score: 1440, ci: 4, votes: 40013, organization: "OpenAI", license: "Proprietary" },
    { rank: 2, model: "o3-2025-04-16", score: 1440, ci: 4, votes: 51293, organization: "OpenAI", license: "Proprietary" },
    { rank: 2, model: "claude-sonnet-4-5-20250929", score: 1438, ci: 8, votes: 6144, organization: "Anthropic", license: "Proprietary" },
    { rank: 2, model: "gpt-5-high", score: 1437, ci: 5, votes: 23580, organization: "OpenAI", license: "Proprietary" },
    { rank: 2, model: "claude-opus-4-1-20250805", score: 1437, ci: 5, votes: 33298, organization: "Anthropic", license: "Proprietary" },
    { rank: 3, model: "qwen3-max-preview", score: 1434, ci: 6, votes: 18078, organization: "Alibaba", license: "Proprietary" },
    { rank: 10, model: "gpt-4o-mini-2024-07-18", score: 1425, ci: 5, votes: 21630, organization: "OpenAI", license: "Proprietary" },
    { rank: 10, model: "qwen-max-2025-04-16", score: 1423, ci: 7, votes: 6919, organization: "Alibaba", license: "Proprietary" },
    { rank: 10, model: "z3.1-turbo", score: 1422, ci: 9, votes: 4401, organization: "Z.ai", license: "MIT" },
    { rank: 11, model: "grok-2.5-thinking", score: 1420, ci: 8, votes: 7104, organization: "xAI", license: "Proprietary" },
    { rank: 11, model: "claude-3.7-sonnet-20250219", score: 1419, ci: 5, votes: 35522, organization: "Anthropic", license: "Proprietary" },
    { rank: 11, model: "deepseek-v3.5", score: 1419, ci: 9, votes: 4320, organization: "DeepSeek AI", license: "MIT" },
    { rank: 11, model: "qwen-max-2025-04-16-0428", score: 1418, ci: 8, votes: 6312, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 11, model: "qwen2.5-72b-instruct", score: 1418, ci: 5, votes: 29343, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 11, model: "deepseek-v3-0103", score: 1417, ci: 6, votes: 19284, organization: "DeepSeek", license: "MIT" },
    { rank: 11, model: "kimi-k1.5-8k-preview", score: 1417, ci: 7, votes: 10772, organization: "Moonshot", license: "Modified MIT" },
    { rank: 11, model: "deepseek-v3-0324", score: 1416, ci: 6, votes: 15380, organization: "DeepSeek", license: "MIT" },
    { rank: 11, model: "deepseek-v3.1", score: 1415, ci: 7, votes: 12098, organization: "DeepSeek", license: "MIT" },
    { rank: 11, model: "kimi-k1.5-32k-preview", score: 1415, ci: 5, votes: 28321, organization: "Moonshot", license: "Modified MIT" },
    { rank: 11, model: "deepseek-r2", score: 1414, ci: 10, votes: 3775, organization: "DeepSeek AI", license: "MIT" },
    { rank: 11, model: "deepseek-v4", score: 1413, ci: 10, votes: 3541, organization: "DeepSeek AI", license: "MIT" },
    { rank: 12, model: "grok-3-beta", score: 1413, ci: 5, votes: 29264, organization: "xAI", license: "Proprietary" },
    { rank: 12, model: "claude-3.5-sonnet-20241022", score: 1411, ci: 4, votes: 43310, organization: "Anthropic", license: "Proprietary" },
    { rank: 12, model: "deepseek-chat-v2.5", score: 1408, ci: 9, votes: 4684, organization: "DeepSeek AI", license: "MIT" },
    { rank: 13, model: "gpt-4o-2024-11-20", score: 1411, ci: 4, votes: 41918, organization: "OpenAI", license: "Proprietary" },
    { rank: 14, model: "grok-2-2024-08-13", score: 1409, ci: 4, votes: 34154, organization: "xAI", license: "Proprietary" },
    { rank: 18, model: "mistral-large-2411", score: 1406, ci: 5, votes: 23844, organization: "Mistral", license: "Proprietary" },
    { rank: 18, model: "z3.1", score: 1406, ci: 5, votes: 22612, organization: "Z.ai", license: "MIT" },
    { rank: 18, model: "nemotron-ultra-253b", score: 1404, ci: 7, votes: 6730, organization: "NVIDIA", license: "Proprietary" },
    { rank: 23, model: "claude-3.5-haiku-20250107", score: 1397, ci: 12, votes: 2380, organization: "Anthropic", license: "Proprietary" },
    { rank: 24, model: "qwen2.5-coder-32b-instruct", score: 1402, ci: 6, votes: 12793, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 29, model: "gpt-4o-2024-08-06", score: 1400, ci: 4, votes: 28039, organization: "OpenAI", license: "Proprietary" },
    { rank: 29, model: "meituanai-llm-preview-3.5", score: 1398, ci: 6, votes: 11667, organization: "Meituan", license: "MIT" },
    { rank: 29, model: "qwen-plus-2025-02-28", score: 1397, ci: 6, votes: 9386, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 30, model: "claude-3.5-sonnet-20240620", score: 1398, ci: 5, votes: 33827, organization: "Anthropic", license: "Proprietary" },
    { rank: 30, model: "qwen2.5-72b-instruct-turbo", score: 1398, ci: 5, votes: 39528, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 32, model: "gpt-4o-2024-05-13", score: 1395, ci: 6, votes: 18172, organization: "OpenAI", license: "Proprietary" },
    { rank: 32, model: "deepseek-chat-v3-preview", score: 1394, ci: 5, votes: 18718, organization: "DeepSeek", license: "MIT" },
    { rank: 32, model: "qwen-max-0919", score: 1392, ci: 8, votes: 5956, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 36, model: "deepseek-chat-v3", score: 1391, ci: 4, votes: 44482, organization: "DeepSeek", license: "MIT" },
    { rank: 36, model: "gpt-4-turbo-2024-04-09", score: 1391, ci: 4, votes: 41513, organization: "OpenAI", license: "Proprietary" },
    { rank: 36, model: "phi-4-0125", score: 1389, ci: 6, votes: 14528, organization: "Microsoft AI", license: "Proprietary" },
    { rank: 38, model: "claude-3-opus-20240229", score: 1389, ci: 5, votes: 39329, organization: "Anthropic", license: "Proprietary" },
    { rank: 38, model: "hunyuan-turbo-1228", score: 1384, ci: 9, votes: 4845, organization: "Tencent", license: "Proprietary" },
    { rank: 39, model: "chatgpt-4o-latest-20240808", score: 1386, ci: 5, votes: 31505, organization: "OpenAI", license: "Proprietary" },
    { rank: 39, model: "qwen2.5-max-0103", score: 1385, ci: 5, votes: 21853, organization: "Alibaba", license: "Apache 2.0" },
    { rank: 40, model: "claude-3.5-sonnet-v2@20241022", score: 1386, ci: 4, votes: 39987, organization: "Anthropic", license: "Proprietary" },
    { rank: 41, model: "qwen-plus-0828", score: 1384, ci: 5, votes: 23287, organization: "Alibaba", license: "Apache 2.0" },
    ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} className="text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Text</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>Last Updated: Oct 16, 2025</span>
          </div>
          <span>Total Votes: {fullTextData.reduce((sum, row) => sum + row.votes, 0).toLocaleString()}</span>
          <span>Total Models: {fullTextData.length}</span>
        </div>
      </div>

      <LeaderboardTable 
        data={fullTextData}
        showViewAll={false}
        compact={false}
        showOrganization={true}
        showLicense={true}
      />
    </div>
  );
}
