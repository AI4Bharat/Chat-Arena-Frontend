// TextLeaderboard.jsx
import { useState, useRef, useEffect } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';

export function TextLeaderboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('overall');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter options with icons
  const filterOptions = [
    { value: 'overall', label: 'Overall', icon: '🏆' },
    { value: 'math', label: 'Math', icon: '🧮' },
    { value: 'instruction', label: 'Instruction Following', icon: '📋' },
    { value: 'multi-turn', label: 'Multi-Turn', icon: '💬' },
    { value: 'creative', label: 'Creative Writing', icon: '✍️' },
    { value: 'coding', label: 'Coding', icon: '💻' },
    { value: 'hard-prompts', label: 'Hard Prompts', icon: '🌶️' },
    { value: 'hard-prompts-english', label: 'Hard Prompts (English)', icon: '🧠' },
    { value: 'longer-query', label: 'Longer Query', icon: '📊' },
    { value: 'english', label: 'English', icon: '🇬🇧' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterSelect = (value) => {
    setSelectedFilter(value);
    setIsDropdownOpen(false);
  };

  const selectedOption = filterOptions.find(opt => opt.value === selectedFilter);

  // Full text data
  const fullTextData = [
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

  // Calculate total votes
  const totalVotes = fullTextData.reduce((sum, row) => sum + row.votes, 0);

  // Filter data based on search query
  const filteredData = fullTextData.filter(row => 
    row.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* Title and Stats - Responsive Layout */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Text Arena
              </h1>
              <p className="text-gray-600 text-xs max-w-lg md:text-sm">
                View rankings across various LLMs on their versatility, linguistic precision, and cultural context across text.
              </p>
            </div>

            {/* Right: Stats */}
            <div className="flex flex-row md:flex-row gap-6 md:gap-8 text-sm md:text-base">
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Last Updated</div>
                <div className="text-gray-900 text-sm font-mono">Oct 16, 2025</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Votes</div>
                <div className="text-gray-900 text-sm font-mono">{totalVotes.toLocaleString()}</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Models</div>
                <div className="text-gray-900 text-sm font-mono">{fullTextData.length}</div>
              </div>
            </div>
          </div>

          {/* Filter and Search Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Custom Dropdown Filter */}
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              {/* Dropdown Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-64 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  {selectedOption?.icon && <span className="text-lg">{selectedOption.icon}</span>}
                  <span>{selectedOption?.label}</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="py-1 max-h-96 overflow-y-auto">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterSelect(option.value)}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          selectedFilter === option.value
                            ? 'bg-orange-50 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {option.icon && <span className="text-lg">{option.icon}</span>}
                        <span className="flex-1">{option.label}</span>
                        {selectedFilter === option.value && (
                          <svg 
                            className="w-5 h-5 text-orange-500" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M5 13l4 4L19 7" 
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by model name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 hover:bg-gray-50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <LeaderboardTable 
          data={filteredData}
          showViewAll={false}
          compact={false}
          showOrganization={true}
          showLicense={true}
        />

        {/* No results message */}
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No models found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
