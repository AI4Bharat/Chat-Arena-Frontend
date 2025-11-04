// LeaderboardTable.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '../../../shared/context/ThemeContext';

export function LeaderboardTable({ 
  data = [], 
  categoryId, 
  showViewAll = false,
  compact = false,
  showOrganization = false,
  showLicense = false 
}) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({
    key: 'rank',
    direction: 'asc' // default sort by rank ascending
  });

  // Sorting function
  const sortData = (data, sortKey, sortDirection) => {
    const sortedData = [...data].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // Handle numeric values
      if (sortKey === 'rank' || sortKey === 'score' || sortKey === 'votes' || sortKey === 'ci') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      // Handle string values (case-insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  };

  // Handle column header click
  const handleSort = (key) => {
    let direction = 'asc';
    
    // If clicking the same column, toggle direction
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    setSortConfig({ key, direction });
  };

  // Get the appropriate arrow icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} strokeWidth={2.5} className="inline ml-1 text-black-600" />
      : <ArrowDown size={12} strokeWidth={2.5} className="inline ml-1 text-black-600" />;
  };

  const handleViewAll = () => {
    navigate(`/leaderboard/${categoryId}`);
  };

  // Sort the data based on current sort config
  const sortedData = sortData(data, sortConfig.key, sortConfig.direction);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <th 
              onClick={() => handleSort('rank')}
              className="px-4 py-3 text-left text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
            >
              Rank (UB) {getSortIcon('rank')}
            </th>
            <th 
              onClick={() => handleSort('model')}
              className="px-4 py-3 text-left text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
            >
              Model {getSortIcon('model')}
            </th>
            <th 
              onClick={() => handleSort('score')}
              className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
            >
              Score {getSortIcon('score')}
            </th>
            {!compact && (
              <th 
                onClick={() => handleSort('ci')}
                className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              >
                95% CI (±) {getSortIcon('ci')}
              </th>
            )}
            <th 
              onClick={() => handleSort('votes')}
              className="px-4 py-3 text-right text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
            >
              Votes {getSortIcon('votes')}
            </th>
            {showOrganization && (
              <th 
                onClick={() => handleSort('organization')}
                className="px-4 py-3 text-left text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              >
                Organization {getSortIcon('organization')}
              </th>
            )}
            {showLicense && (
              <th 
                onClick={() => handleSort('license')}
                className="px-4 py-3 text-left text-gray-700 dark:text-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              >
                License {getSortIcon('license')}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="dark:bg-gray-800">
          {sortedData.map((row, i) => {
            const isEvenRow = i % 2 === 0;
            const rowBgClass = isEvenRow 
              ? 'bg-white dark:bg-gray-800' 
              : 'bg-gray-50 dark:bg-gray-850';
            const textPrimaryClass = isEvenRow 
              ? 'text-black dark:text-gray-100' 
              : 'text-black dark:text-gray-100';
            const textSecondaryClass = isEvenRow 
              ? 'text-black dark:text-gray-300' 
              : 'text-black dark:text-gray-300';
            const textTertiaryClass = isEvenRow 
              ? 'text-black dark:text-gray-400' 
              : 'text-black dark:text-gray-400';
            
            return (
              <tr
                key={`${row.model}-${i}`}
                className={`border-b border-gray-100 dark:border-gray-700 ${rowBgClass}`}
                style={{ 
                  backgroundColor: isDark 
                    ? (isEvenRow ? '#1f2937' : '#1a202c') 
                    : undefined 
                }}
              >
                <td className={`px-4 py-3 ${textPrimaryClass} text-sm font-medium`}>{row.rank}</td>
                <td className={`px-4 py-3 ${textPrimaryClass} text-sm font-mono`}>
                  <div className="flex items-center gap-2">
                    {/* Add model icon here if available */}
                    <span className="truncate max-w-md">{row.model}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 ${textPrimaryClass} text-sm font-medium text-right`}>{row.score}</td>
                {!compact && (
                  <td className={`px-4 py-3 ${textSecondaryClass} text-sm text-right`}>±{row.ci || 4}</td>
                )}
                <td className={`px-4 py-3 ${textSecondaryClass} text-sm text-right`}>{row.votes.toLocaleString()}</td>
                {showOrganization && (
                  <td className={`px-4 py-3 ${textSecondaryClass} text-sm`}>{row.organization}</td>
                )}
                {showLicense && (
                  <td className={`px-4 py-3 ${textTertiaryClass} text-sm`}>{row.license}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* View all button */}
      {showViewAll && (
        <div className="flex justify-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={handleViewAll}
            className="w-full py-3 text-center text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors rounded-b-lg"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
