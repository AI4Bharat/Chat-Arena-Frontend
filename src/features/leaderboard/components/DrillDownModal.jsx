import { useState, useEffect } from 'react';
import { X, Activity, BarChart2, AlertCircle } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { API_BASE_URL, fetchWithAuth } from '../../../shared/api/client';

export function DrillDownModal({ isOpen, onClose, model, leaderboardId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('domain');

  useEffect(() => {
    if (isOpen && model) {
      if (leaderboardId) {
        fetchDrillDownData();
      } else {
        setLoading(false);
        setData(null);
        setError("Leaderboard ID missing for this model.");
      }
    } else {
        setData(null);
        setError(null);
        setLoading(false);
    }
  }, [isOpen, model, leaderboardId]);

  const fetchDrillDownData = async () => {
    setLoading(true);
    setError(null);
    try {
        const encodedModelName = encodeURIComponent(model.model);
        const url = `${API_BASE_URL}/leaderboard/${leaderboardId}/drilldown/${encodedModelName}/`;
        
        const res = await fetchWithAuth(url);
        
        if (!res.ok) {
            if (res.status === 404) {
               throw new Error("Detailed analytics not found for this model.");
            }
            throw new Error(`Failed to fetch details: ${res.statusText}`);
        }

        const jsonData = await res.json();
        setData(jsonData);
    } catch (err) {
      console.error("Error fetching drilldown data:", err);
      setError(err.message || "Failed to load detailed analytics");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {model?.model} 
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium border border-orange-200">
                Analytics
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Detailed performance breakdown</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 min-h-[400px] ${(loading || error || !data) ? 'flex items-center justify-center' : ''}`}>
          {loading ? (
             <div className="flex flex-col items-center justify-center space-y-4 text-gray-500 animate-in fade-in duration-300">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                <p>Analyzing model performance...</p>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-red-500 space-y-4 animate-in fade-in duration-300">
               <AlertCircle size={48} className="opacity-20" />
               <p className="text-center font-medium">{error}</p>
               <button 
                 onClick={fetchDrillDownData}
                 className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
               >
                 Retry
               </button>
            </div>
          ) : data ? (
            <div className="space-y-6 w-full animate-in slide-in-from-bottom-2 duration-300">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('domain')}
                        className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'domain' 
                             ? 'border-orange-500 text-orange-600' 
                             : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Activity size={16} />
                        Domain Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('benchmark')}
                        className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'benchmark' 
                             ? 'border-orange-500 text-orange-600' 
                             : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <BarChart2 size={16} />
                        Benchmark Deep Dive
                    </button>
                </div>

                {/* Tab Content */}
                <div className="mt-4 h-[400px]">
                    {activeTab === 'domain' && (
                        data.domain_summary && data.domain_summary.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.domain_summary}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="domain" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Radar
                                        name={model?.model}
                                        dataKey="score"
                                        stroke="#f97316"
                                        fill="#fb923c"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="No domain data available for this model." />
                        )
                    )}

                    {activeTab === 'benchmark' && (
                        data.benchmark_breakdown && data.benchmark_breakdown.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={data.benchmark_breakdown}
                                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f0f0f0" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="benchmark" 
                                        width={120} 
                                        tick={{ fill: '#4b5563', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="score" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="No benchmark data available for this model." />
                        )
                    )}
                </div>
            </div>
          ) : (
             <EmptyState message="No details found." />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
          <p className="font-semibold text-gray-900 mb-1">{label || payload[0].payload.domain || payload[0].payload.benchmark}</p>
          <p className="text-orange-600 font-mono">
            Score: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
}

function EmptyState({ message }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Activity size={48} className="opacity-20 mb-3" />
            <p>{message}</p>
        </div>
    );
}
