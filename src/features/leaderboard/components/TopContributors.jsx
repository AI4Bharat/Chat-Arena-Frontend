
import { useState, useEffect, useMemo, useRef } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { RankCell } from './RankCell';

export function TopContributors({
  type,
  defaultLanguage = 'en',
  defaultOrganization = 'ai4b',
  languageOptions = [],
  organizationOptions = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [selectedOrg, setSelectedOrg] = useState(defaultOrganization);
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const languageDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultOrganization) {
      setSelectedOrg(defaultOrganization);
    }
  }, [defaultOrganization]);

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      try {
        const url = `${endpoints.models.contributors}?arena_type=${type}&language=${selectedLanguage}&tenant=${selectedOrg}`;
        const fullUrl = `${API_BASE_URL}${url}`;
        
        const res = await fetchWithAuth(fullUrl, {
          headers: { accept: 'application/json' },
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const jsonData = await res.json();
        
        const mapped = (Array.isArray(jsonData) ? jsonData : []).map((item, index) => ({
            id: item.email,
            rank: index + 1,
            user: item.display_name || item.email,
            email: item.email,
            chat_sessions: item.chat_sessions_count,
            total_votes: item.total_votes,
            votes_direct: item.votes_breakdown?.['Direct Chat'] || 0,
            votes_compare: item.votes_breakdown?.['Comparison'] || 0,
            votes_random: item.votes_breakdown?.['Random'] || 0,
            academic_contributions: item.votes_breakdown?.['Academic Benchmarking'] || 0,
        }));

        if (alive) {
            setData(mapped);
            setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load contributors', e);
        if (alive) {
            setData([]);
            setLoading(false);
        }
      }
    }

    fetchData();
    return () => { alive = false; };
  }, [type, selectedLanguage, selectedOrg]);

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.user?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [data, searchQuery]);

  const selectedLanguageOption = languageOptions.find(opt => opt.value === selectedLanguage);

  const columns = [
    { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <RankCell rank={val} /> },
    { key: 'user', label: 'User', sortable: true, render: (val, row) => (
        <div>
            <div className="font-medium text-gray-900">{val}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
        </div>
    )},
    { key: 'chat_sessions', label: 'Chat Sessions', sortable: true, align: 'right' },
    { key: 'total_votes', label: 'Total Votes', sortable: true, align: 'right' },
    { key: 'votes_direct', label: 'Direct Votes', sortable: true, align: 'right' },
    { key: 'votes_compare', label: 'Compare Votes', sortable: true, align: 'right' },
    { key: 'votes_random', label: 'Random Votes', sortable: true, align: 'right' },
  ];

  if (type === 'tts') {
    columns.push({ key: 'academic_contributions', label: 'Academic Benchmarking', sortable: true, align: 'right' });
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-[80vh] bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Top Contributors
              </h1>
              <p className="text-gray-600 text-xs max-w-lg md:text-sm">
                Recognizing our top contributors based on chat sessions and votes.
              </p>
            </div>

            <div className="flex flex-row md:flex-row gap-6 md:gap-8 text-sm md:text-base">
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Contributors</div>
                <div className="text-gray-900 text-sm font-mono">{filteredData.length}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 mb-4">
             {/* Language Dropdown */}
            {languageOptions.length > 0 && (
                <div className="relative w-full lg:w-auto" ref={languageDropdownRef}>
                <button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="w-full lg:w-64 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2">
                    {selectedLanguageOption?.icon && <span className="text-lg">{selectedLanguageOption.icon}</span>}
                    <span>{selectedLanguageOption?.label || selectedLanguage}</span>
                    </div>
                    <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
                    />
                </button>

                {isLanguageDropdownOpen && (
                    <div
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-dropdown-open-down"
                    >
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {languageOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setSelectedLanguage(option.value);
                                setIsLanguageDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                            selectedLanguage === option.value
                                ? 'bg-orange-50 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {option.icon && <span className="text-lg">{option.icon}</span>}
                            <span className="flex-1">{option.label}</span>
                            {selectedLanguage === option.value && (
                             <div className="w-5 h-5 text-orange-500">✓</div>
                            )}
                        </button>
                        ))}
                    </div>
                    </div>
                )}
                </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search contributors..."
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
          columns={columns}
          compact={false}
          loading={loading}
          emptyMessage={searchQuery ? "No contributors found matching your search" : "No contributors found"}
        />
      </div>
    </div>
  );
}
