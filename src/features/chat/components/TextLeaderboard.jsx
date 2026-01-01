// TextLeaderboard.jsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../../../shared/api/client';

import { endpoints } from '../../../shared/api/endpoints';

export function TextLeaderboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('english');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fullTextData, setFullTextData] = useState([]);
  const dropdownRef = useRef(null);

  // Filter options - ONLY LANGUAGES
  const filterOptions = [
    { value: 'marathi', label: 'Marathi', icon: '🇮🇳' },
    { value: 'nepali', label: 'Nepali', icon: '🇮🇳' },
    { value: 'kannada', label: 'Kannada', icon: '🇮🇳' },
    { value: 'bengali', label: 'Bengali', icon: '🇮🇳' },
    { value: 'gujarati', label: 'Gujarati', icon: '🇮🇳' },
    { value: 'tamil', label: 'Tamil', icon: '🇮🇳' },
    { value: 'bodo', label: 'Bodo', icon: '🇮🇳' },
    { value: 'maithili', label: 'Maithili', icon: '🇮🇳' },
    { value: 'kashmiri', label: 'Kashmiri', icon: '🇮🇳' },
    { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
    { value: 'malayalam', label: 'Malayalam', icon: '🇮🇳' },
    { value: 'assamese', label: 'Assamese', icon: '🇮🇳' },
    { value: 'dogri', label: 'Dogri', icon: '🇮🇳' },
    { value: 'konkani', label: 'Konkani', icon: '🇮🇳' },
    { value: 'telugu', label: 'Telugu', icon: '🇮🇳' },
    { value: 'sanskrit', label: 'Sanskrit', icon: '🇮🇳' },
    { value: 'manipuri', label: 'Manipuri', icon: '🇮🇳' },
    { value: 'urdu', label: 'Urdu', icon: '🇮🇳' },
    { value: 'odia', label: 'Odia', icon: '🇮🇳' },
    { value: 'santali', label: 'Santali', icon: '🇮🇳' },
    { value: 'punjabi', label: 'Punjabi', icon: '🇮🇳' },
    { value: 'sindhi', label: 'Sindhi', icon: '🇮🇳' },
    { value: 'english', label: 'English', icon: '🇬🇧' },
    { value: 'thai', label: 'Thai', icon: '🇹🇭' },
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

  useEffect(() => {
    let alive = true;

    async function loadModels() {
      try {
        const res = await fetch(`${API_BASE_URL}${endpoints.models.leaderboard('llm')}`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        const mapped = (Array.isArray(data) ? data : [])
          .map(item => ({
            ...item,
            id: item.model,
            display_name: item.model,
            organization: item.organization || 'Unknown',
            language: item.language || 'english', // Assuming backend doesn't change language per row, but we set default
          }));

        if (alive) setFullTextData(mapped);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
        if (alive) setFullTextData([]);
      }
    }

    loadModels();
    return () => { alive = false; };
  }, []);

  // Calculate total votes
  const totalVotes = fullTextData.reduce((sum, row) => sum + (row.votes || 0), 0);

  // Filter data based on selected language and search query
  const filteredData = useMemo(() => {
    let filtered = fullTextData;

    // Apply language filter
    // filtered = filtered.filter(row => row.language === selectedFilter);

    // Apply search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.model?.toLowerCase().includes(q) ||
        row.organization?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [selectedFilter, searchQuery, fullTextData]);

  return (
    <div className="flex-1 overflow-y-auto min-h-[80vh] bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* Title and Stats - Responsive Layout */}
          <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4 mb-6">
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
                <div className="text-gray-900 text-sm font-mono text-center">-</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Votes</div>
                <div className="text-gray-900 text-sm font-mono text-center">-</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Models</div>
                <div className="text-gray-900 text-sm font-mono">{filteredData.length}</div>
              </div>
            </div>
          </div>

          {/* Notice Banner */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              We will update the leaderboard once a sufficient number of votes are received for each model.
            </p>
          </div>

          {/* Filter and Search Row */}
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            {/* Custom Dropdown Filter - LANGUAGES ONLY */}
            <div className="relative w-full lg:w-auto" ref={dropdownRef}>
              {/* Dropdown Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full lg:w-64 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors flex items-center justify-between gap-3"
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
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-dropdown-open-down"
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
            No models found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
