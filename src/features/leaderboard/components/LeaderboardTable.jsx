import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function LeaderboardTable({ 
  data = [], 
  columns = [],
  onRowClick,
  rowKey = 'id',
  compact = false,
  viewAllLink = null
}) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({
    key: 'rank',
    direction: 'asc'
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      const isNumeric = !isNaN(parseFloat(aValue)) && isFinite(aValue) && !isNaN(parseFloat(bValue)) && isFinite(bValue);
      
      if (isNumeric) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
      } else {
         aValue = String(aValue || '').toLowerCase();
         bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} className="inline ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} strokeWidth={2.5} className="inline ml-1 text-black-600" />
      : <ArrowDown size={12} strokeWidth={2.5} className="inline ml-1 text-black-600" />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-gray-700 text-sm font-semibold 
                    ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''} 
                    transition-colors select-none ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.label} {col.sortable !== false && getSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={row[rowKey] || i}
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                 {columns.map((col) => (
                    <td 
                      key={`${row[rowKey] || i}-${col.key}`} 
                      className={`px-4 py-3 text-gray-900 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                 ))}
              </tr>
            ))}
             {sortedData.length === 0 && (
                 <tr>
                     <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                         No data available
                     </td>
                 </tr>
             )}
          </tbody>
        </table>
      </div>

      {viewAllLink && (
        <button
          onClick={() => navigate(viewAllLink)}
          className="block w-full py-3 text-center text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors border-t border-gray-200"
        >
          View all
        </button>
      )}
    </div>
  );
}
