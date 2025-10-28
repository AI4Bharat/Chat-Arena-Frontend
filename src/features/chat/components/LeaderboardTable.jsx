// LeaderboardTable.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';

export function LeaderboardTable({ 
  data = [], 
  categoryId, 
  showViewAll = false,
  compact = false,
  showOrganization = false,
  showLicense = false 
}) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate(`/leaderboard/${categoryId}`);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">
              Rank (UB) <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
            </th>
            <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">
              Model <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
            </th>
            <th className="px-4 py-3 text-right text-gray-700 text-sm font-semibold">
              Score <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
            </th>
            {!compact && (
              <th className="px-4 py-3 text-right text-gray-700 text-sm font-semibold">
                95% CI (±) <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
              </th>
            )}
            <th className="px-4 py-3 text-right text-gray-700 text-sm font-semibold">
              Votes <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
            </th>
            {showOrganization && (
              <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">
                Organization <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
              </th>
            )}
            {showLicense && (
              <th className="px-4 py-3 text-left text-gray-700 text-sm font-semibold">
                License <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.model}-${i}`}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 text-gray-900 text-sm font-medium">{row.rank}</td>
              <td className="px-4 py-3 text-gray-900 text-sm font-mono">
                <div className="flex items-center gap-2">
                  {/* Add model icon here if available */}
                  <span className="truncate max-w-md">{row.model}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-900 text-sm font-medium text-right">{row.score}</td>
              {!compact && (
                <td className="px-4 py-3 text-gray-700 text-sm text-right">±{row.ci || 4}</td>
              )}
              <td className="px-4 py-3 text-gray-700 text-sm text-right">{row.votes.toLocaleString()}</td>
              {showOrganization && (
                <td className="px-4 py-3 text-gray-700 text-sm">{row.organization}</td>
              )}
              {showLicense && (
                <td className="px-4 py-3 text-gray-600 text-sm">{row.license}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* View all button */}
      {showViewAll && (
        <div className="flex justify-center border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleViewAll}
            className="w-full py-3 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-b-lg"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
