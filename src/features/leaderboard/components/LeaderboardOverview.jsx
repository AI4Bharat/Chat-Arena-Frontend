import { useEffect, useState, useRef, useMemo } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../../../shared/api/client';

export function LeaderboardOverview({ sections = [], languageOptions = [], defaultLanguage = 'en' }) {
  const [dataMap, setDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

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

  const [dynamicLanguages, setDynamicLanguages] = useState([]);

  useEffect(() => {
    let alive = true;

    async function fetchAllLanguages() {
      const endpoints = sections.map((s) => s.languagesEndpoint).filter(Boolean);
      if (endpoints.length === 0) return;

      try {
        const promises = endpoints.map(async (endpoint) => {
          const url = typeof endpoint === 'function' ? endpoint() : endpoint;
          const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
          const res = await fetchWithAuth(fullUrl, { headers: { accept: 'application/json' } });
          if (!res.ok) return [];
          return res.json();
        });

        const results = await Promise.all(promises);

        if (alive) {
          const uniqueLanguages = new Set();
          results.forEach((data) => {
            if (Array.isArray(data)) {
              data.forEach((lang) => {
                const val = typeof lang === 'object' && lang !== null ? lang.value || lang.name : lang;
                if (val && val !== 'Overall') {
                  uniqueLanguages.add(val);
                }
              });
            }
          });

          const formatted = Array.from(uniqueLanguages).map((lang) => ({ label: lang, value: lang }));
          formatted.unshift({ label: 'Overall', value: 'Overall' });
          setDynamicLanguages(formatted);
        }
      } catch (e) {
        console.error('Failed to fetch languages for overview', e);
      }
    }

    fetchAllLanguages();
    return () => {
      alive = false;
    };
  }, [sections]);

  useEffect(() => {
    let alive = true;

    sections.forEach((section) => {
      if (!section.fetchEndpoint) return;

      const fetchData = async () => {
        setLoadingMap((prev) => ({ ...prev, [section.id]: true }));
        try {
          const url = typeof section.fetchEndpoint === 'function' ? section.fetchEndpoint({ language: selectedLanguage }) : section.fetchEndpoint;

          const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

          const res = await fetchWithAuth(fullUrl, {
            headers: { accept: 'application/json' },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const jsonData = await res.json();

          let mapped;
          try {
            if (section.dataMapper) {
              mapped = section.dataMapper(jsonData);
            } else {
              let rawData = jsonData;

              if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                rawData = jsonData.data;
              } else if (!Array.isArray(jsonData) && typeof jsonData === 'object' && jsonData !== null) {
                // Handle object response keyed by language (if applicable)
                if (jsonData[selectedLanguage]) {
                  rawData = jsonData[selectedLanguage];
                } else if (jsonData['Overall']) {
                  rawData = jsonData['Overall'];
                } else {
                  // Fallback to first key
                  const firstKey = Object.keys(jsonData)[0];
                  if (firstKey) rawData = jsonData[firstKey];
                }

                if (rawData && rawData.data && Array.isArray(rawData.data)) {
                  rawData = rawData.data;
                }
              }

              rawData = Array.isArray(rawData) ? rawData : [];

              mapped = rawData.map((item, idx) => ({
                ...item,
                rank: item.rank || idx + 1,
                id: item.model || item.id,
                display_name: item.display_name || item.model_code || item.model,
                model: item.model_code || item.model,
                organization: item.organization || 'Unknown',
                license: item.license || '—',
                score: item.score || 0,
                votes: item.votes || 0,
              }));
            }
          } catch (mapError) {
            console.error(`Mapping error for section ${section.id}`, mapError);
            mapped = [];
          }

          if (alive) {
            setDataMap((prev) => ({ ...prev, [section.id]: mapped || [] }));
          }
        } catch (e) {
          console.error(`Failed to load data for section ${section.id}`, e);
          if (alive) {
            setDataMap((prev) => ({ ...prev, [section.id]: [] }));
          }
        } finally {
          if (alive) {
            setLoadingMap((prev) => ({ ...prev, [section.id]: false }));
          }
        }
      };

      fetchData();
    });

    return () => {
      alive = false;
    };
  }, [sections, selectedLanguage]);

  const activeLanguageOptions = dynamicLanguages.length > 0 ? dynamicLanguages : languageOptions;

  const selectedLanguageOption = activeLanguageOptions.find((opt) => opt.value === selectedLanguage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        {/* Language Dropdown */}
        {activeLanguageOptions.length > 0 && (
          <div className="relative w-full lg:w-auto" ref={languageDropdownRef}>
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="w-full lg:w-64 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span>{selectedLanguageOption?.label || selectedLanguage}</span>
              </div>
              <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-dropdown-open-down">
                <div className="py-1 max-h-96 overflow-y-auto">
                  {activeLanguageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedLanguage(option.value);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                        selectedLanguage === option.value ? 'bg-orange-50 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-1">{option.label}</span>
                      {selectedLanguage === option.value && <div className="w-5 h-5 text-orange-500">✓</div>}
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
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${sections.length === 1 ? '' : 'lg:grid-cols-2'} gap-8`}>
        {sections.map((section) => {
          const Icon = section.icon;
          const data = dataMap[section.id] || [];
          const isLoading = loadingMap[section.id];

          // Filter data
          let filteredData = data;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filteredData = filteredData.filter((row) => row.model?.toLowerCase().includes(q) || row.organization?.toLowerCase().includes(q));
          }

          const maxEntries = 5;
          const displayData = filteredData.slice(0, maxEntries);

          return (
            <div key={section.id}>
              <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon size={24} className="text-gray-700" />}
                <h2 className="text-2xl font-semibold text-gray-900">
                  {section.title} {isLoading && '(loading...)'}
                </h2>
              </div>
              <LeaderboardTable
                data={displayData}
                categoryId={section.id}
                showViewAll={true}
                compact={true}
                viewAllLink={section.viewAllLink}
                columns={section.columns}
                loading={isLoading}
                emptyMessage={searchQuery ? 'No models found matching your search' : section.id === 'asr-arena' || section.id === 'tts-arena' ? 'Coming soon' : 'No models available'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
