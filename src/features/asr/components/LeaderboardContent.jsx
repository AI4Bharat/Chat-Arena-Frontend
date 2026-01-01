import { useParams } from 'react-router-dom';
import { LeaderboardTable } from './LeaderboardTable';
import { OverviewPage } from './OverviewPage';
import { AsrLeaderboard } from './AsrLeaderboard';

export function LeaderboardContent() {
  const { category } = useParams();

    const renderContent = () => {
    switch(category) {
      case 'overview':
        return <OverviewPage />;
      default:
        return <AsrLeaderboard />;
    }
  };

const leaderboardData = [
  { rank: 3, model: "qwen3-max-preview", score: 1434, votes: 18078 },
  { rank: 2, model: "chatgpt-4o-latest-20250326", score: 1440, votes: 40013 },
  { rank: 2, model: "o3-2025-04-16", score: 1440, votes: 51293 },
  { rank: 2, model: "claude-sonnet-4-5-20250929", score: 1438, votes: 6144 },
  { rank: 2, model: "gpt-5-high", score: 1437, votes: 23580 },
  { rank: 2, model: "claude-opus-4-1-20250805", score: 1437, votes: 33298 },
  { rank: 1, model: "gemini-2.5-pro", score: 1451, votes: 54087 },
  { rank: 1, model: "claude-opus-4-1-20250805-thi...", score: 1447, votes: 21306 },
  { rank: 1, model: "claude-sonnet-4-5-20250929-t...", score: 1445, votes: 6287 },
  { rank: 1, model: "gpt-4.5-preview-2025-02-27", score: 1441, votes: 14644 },
];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {category == "overview" && (
          <>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Leaderboard` : 'Leaderboard'}
        </h1>
        <p className="text-gray-600 mb-6">
          Compare models based on their performance metrics
        </p>
          </>
        )}
        
        {/* Add your leaderboard table/content here */}
        <div className="bg-white rounded-lg border border-gray-200 p-0 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
