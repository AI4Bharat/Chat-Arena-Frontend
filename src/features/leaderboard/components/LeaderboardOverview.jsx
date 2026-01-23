import { useEffect, useState, useRef, useMemo } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { Search, ChevronDown } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../../../shared/api/client';

export function LeaderboardOverview({ 
  sections = [], 
  languageOptions = [], 
  defaultLanguage = 'en' 
}) {
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

  useEffect(() => {
    let alive = true;

    sections.forEach(section => {
      if (!section.fetchEndpoint) return;

      const fetchData = async () => {
        setLoadingMap(prev => ({ ...prev, [section.id]: true }));
        try {
          const url = typeof section.fetchEndpoint === 'function' 
            ? section.fetchEndpoint({ language: selectedLanguage }) 
            : section.fetchEndpoint;
            
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
                 
                 // Handle object response keyed by language (if applicable)
                 if (!Array.isArray(jsonData) && typeof jsonData === 'object' && jsonData !== null) {
                     if (jsonData[selectedLanguage]) {
                         rawData = jsonData[selectedLanguage];
                     } else if (jsonData['Overall']) {
                         rawData = jsonData['Overall'];
                     } else {
                         // Fallback to first key
                         const firstKey = Object.keys(jsonData)[0];
                         if (firstKey) rawData = jsonData[firstKey];
                     }
                 }
                 
                 rawData = Array.isArray(rawData) ? rawData : [];

                 mapped = rawData.map((item, idx) => ({
                    ...item,
                    rank: item.rank || idx + 1, 
                    id: item.model || item.id,
                    display_name: item.model || item.display_name,
                    model: item.model || item.display_name,
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
            setDataMap(prev => ({ ...prev, [section.id]: mapped || [] }));
          }
        } catch (e) {
          console.error(`Failed to load data for section ${section.id}`, e);
          if (alive) {
            setDataMap(prev => ({ ...prev, [section.id]: [] }));
          }
        } finally {
          if (alive) {
            setLoadingMap(prev => ({ ...prev, [section.id]: false }));
          }
        }
      };

      fetchData();
    });

    return () => { alive = false; };
  }, [sections, selectedLanguage]);

  const selectedLanguageOption = languageOptions.find(opt => opt.value === selectedLanguage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 mb-8">
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-dropdown-open-down">
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

      {selectedLanguage === 'Overall' ? (
        <div className="space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const data = dataMap[section.id] || [];
            const isLoading = loadingMap[section.id];

            // Filter data
            let filteredData = data;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              filteredData = filteredData.filter(row =>
                row.model?.toLowerCase().includes(q) ||
                row.organization?.toLowerCase().includes(q)
              );
            }

            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-4">
                  {Icon && <Icon size={24} className="text-gray-700" />}
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {section.title} {isLoading && '(loading...)'}
                  </h2>
                </div>
                <LeaderboardTable
                  data={filteredData}
                  categoryId={section.id}
                  showViewAll={true}
                  compact={true}
                  viewAllLink={section.viewAllLink}
                  columns={section.columns}
                  loading={isLoading}
                  emptyMessage={searchQuery ? "No models found matching your search" : "No models available"}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Leaderboard will be updated soon
          </h3>
          <p className="text-gray-500">
            We are working on bringing you the rankings for {selectedLanguageOption?.label || selectedLanguage}.
          </p>
        </div>
      )}
    </div>
  );
}
