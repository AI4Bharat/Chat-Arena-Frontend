import { useState, useRef, useEffect, useMemo } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../../../shared/api/client';

export function LeaderboardContainer({
  title,
  description,
  fetchEndpoint,
  type = 'default',
  languageOptions = [],
  organizationOptions = [],
  defaultLanguage = 'en',
  defaultOrganization = 'ai4b',
  columns = [],
  dataMapper = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [selectedOrg, setSelectedOrg] = useState(defaultOrganization);
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const languageDropdownRef = useRef(null);
  const orgDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
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
        const url = typeof fetchEndpoint === 'function' 
            ? fetchEndpoint({ language: selectedLanguage, organization: selectedOrg }) 
            : fetchEndpoint;
        if (!url) {
             setLoading(false);
             return;
        }

        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        const res = await fetch(fullUrl, {
          headers: { accept: 'application/json' },
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const jsonData = await res.json();
        
        let mapped;
        if (dataMapper) {
             mapped = dataMapper(jsonData);
        } else {
            mapped = (Array.isArray(jsonData) ? jsonData : [])
            .map(item => ({
                ...item,
                id: item.model || Math.random().toString(36).substr(2, 9),
                display_name: item.model,
                organization: item.organization || 'Unknown',
                language: item.language || 'en',
            }));
        }

        if (alive) {
            setData(mapped);
            setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load leaderboard', e);
        if (alive) {
            setData([]);
            setLoading(false);
        }
      }
    }

    fetchData();
    return () => { alive = false; };
  }, [fetchEndpoint, selectedLanguage, selectedOrg]);

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.model?.toLowerCase().includes(q) ||
        row.organization?.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [data, searchQuery]);

  const selectedLanguageOption = languageOptions.find(opt => opt.value === selectedLanguage);
  const selectedOrgOption = organizationOptions.find(opt => opt.value === selectedOrg);

  return (
    <div className="flex-1 overflow-y-auto min-h-[80vh] bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              <p className="text-gray-600 text-xs max-w-lg md:text-sm">
                {description}
              </p>
            </div>

            <div className="flex flex-row md:flex-row gap-6 md:gap-8 text-sm md:text-base">
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Last Updated</div>
                <div className="text-gray-900 text-sm font-mono text-center">-</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Votes</div>
                <div className="text-gray-900 text-sm font-mono text-center">
                    {data.reduce((sum, row) => sum + (Number(row.votes) || 0), 0)}
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 mb-1">Total Models</div>
                <div className="text-gray-900 text-sm font-mono">{filteredData.length}</div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              We will update the leaderboard once a sufficient number of votes are received for each model.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 mb-4">
             {/* Organization Dropdown Removed */}
             {/* {organizationOptions.length > 0 && (
                <div className="relative w-full lg:w-auto" ref={orgDropdownRef}>
                  // ... dropdown code removed ...
                </div>
             )} */}

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
          columns={columns}
          compact={false}
          loading={loading}
          emptyMessage={searchQuery ? "No models found matching your search" : "No models available"}
        />
      </div>
    </div>
  );
}
