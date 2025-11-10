// OverviewPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { FileText } from 'lucide-react';

export function OverviewPage() {
  const [textData, setTextData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch models for the Text category
  useEffect(() => {
    let alive = true;

    async function loadModels() {
      try {
        const res = await fetch('https://backend.arena.ai4bharat.org/models/', {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = (Array.isArray(data) ? data : [])
          .filter(m => m?.is_active === true)
          .map((m, idx) => ({
            rank: idx + 1, 
            model: m.model_code,
            score: 0,
            votes: 0,
            organization: (m.provider || '').charAt(0).toUpperCase() + (m.provider || '').slice(1),
            license: '—',
            id: m.id,
            display_name: m.display_name,
          }));

        if (alive) setTextData(mapped);
      } catch (e) {
        console.error('Failed to load models', e);
        if (alive) setTextData([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadModels();
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => ([
    {
      id: 'text',
      title: 'Text',
      icon: FileText,
      data: textData,
    },
  ]), [textData]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Notice Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-medium">
          We will update the leaderboard once a sufficient number of votes are received for each model.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={24} className="text-gray-700" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  {category.title} {loading && '(loading...)'}
                </h2>
              </div>
              <LeaderboardTable
                data={category.data}
                categoryId={category.id}
                showViewAll={true}
                compact={true}
              />
              {(!loading && category.data.length === 0) && (
                <div className="text-gray-500 text-sm">No models available.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
