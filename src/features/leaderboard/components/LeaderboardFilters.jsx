import { useNavigate, useLocation } from 'react-router-dom';
import { Grid3x3, FileText, Code, Eye, ImageIcon, Wand2, Globe, Video, Image as ImageIcon2, Terminal } from 'lucide-react';
import { useMemo } from 'react';

export function LeaderboardFilters({ 
  basePath, 
  availableFilters = [
    { name: 'Overview', suffix: 'overview', icon: Grid3x3 },
    { name: 'Text', suffix: 'text', icon: FileText },
    { name: 'ASR', suffix: 'asr', icon: FileText },
  ] 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide w-full">
      {availableFilters.map((filter) => {
        const Icon = filter.icon || FileText;
        const fullPath = filter.path || (basePath ? `${basePath}/${filter.suffix}` : filter.suffix);
        const isActive = currentPath === fullPath || currentPath.startsWith(fullPath + '/');
        
        return (
          <button
            key={filter.name}
            onClick={() => navigate(fullPath)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
              transition-colors text-sm font-medium 
              ${isActive 
                ? 'border-2 border-orange-400 text-gray-600 hover:bg-orange-50' 
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <Icon size={16} />
            <span>{filter.name}</span>
          </button>
        );
      })}
    </div>
  );
}
