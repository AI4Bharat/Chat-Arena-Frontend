import { useEffect, useState } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { API_BASE_URL } from '../../../shared/api/client';

export function LeaderboardOverview({ sections = [] }) {
  const [dataMap, setDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    let alive = true;

    sections.forEach(section => {
      if (!section.fetchEndpoint) return;

      const fetchData = async () => {
        setLoadingMap(prev => ({ ...prev, [section.id]: true }));
        try {
          const url = typeof section.fetchEndpoint === 'function' ? section.fetchEndpoint() : section.fetchEndpoint;
          const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
          
          const res = await fetch(fullUrl, {
            headers: { accept: 'application/json' },
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const jsonData = await res.json();
          
          let mapped;
          try {
            if (section.dataMapper) {
                mapped = section.dataMapper(jsonData);
            } else {
                 mapped = (Array.isArray(jsonData) ? jsonData : [])
                  .map((item, idx) => ({
                    ...item,
                    rank: idx + 1, 
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
  }, [sections]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Notice Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-medium">
            We will update the leaderboard once a sufficient number of votes are received for each model.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon;
          const data = dataMap[section.id] || [];
          const isLoading = loadingMap[section.id];

          return (
            <div key={section.id}>
              <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon size={24} className="text-gray-700" />}
                <h2 className="text-2xl font-semibold text-gray-900">
                  {section.title} {isLoading && '(loading...)'}
                </h2>
              </div>
              <LeaderboardTable
                data={data}
                categoryId={section.id}
                showViewAll={true}
                compact={true}
                viewAllLink={section.viewAllLink}
                columns={section.columns}
              />
              {(!isLoading && data.length === 0) && (
                <div className="text-gray-500 text-sm">No models available.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
