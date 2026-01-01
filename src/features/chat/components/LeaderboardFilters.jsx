import { useNavigate, useLocation } from 'react-router-dom';
import { Grid3x3, FileText, Code, Eye, ImageIcon, Wand2, Globe, Video, Image as ImageIcon2, Terminal } from 'lucide-react';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';

export function LeaderboardFilters() {
  const navigate = useNavigate();
  const location = useLocation();

  const filters = [
    { name: 'Overview', path: '/leaderboard/chat/overview', icon: Grid3x3 },
    { name: 'Text', path: '/leaderboard/chat/text', icon: FileText },
    // { name: 'WebDev', path: '/leaderboard/webdev', icon: Code },
    // { name: 'Vision', path: '/leaderboard/vision', icon: Eye },
    // { name: 'Text-to-Image', path: '/leaderboard/text-to-image', icon: ImageIcon },
    // { name: 'Image Edit', path: '/leaderboard/image-edit', icon: Wand2 },
    // { name: 'Search', path: '/leaderboard/search', icon: Globe },
    // { name: 'Text-to-Video', path: '/leaderboard/text-to-video', icon: Video },
    // { name: 'Image-to-Video', path: '/leaderboard/image-to-video', icon: ImageIcon2 },
    // { name: 'Copilot', path: '/leaderboard/copilot', icon: Terminal },
  ];

  const currentPath = location.pathname;

  useDocumentTitle('Indic Arena - Leaderboard');

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide w-full">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = currentPath === filter.path;
        
        return (
          <button
            key={filter.path}
            onClick={() => navigate(filter.path)}
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
