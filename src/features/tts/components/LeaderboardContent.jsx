import { useParams } from 'react-router-dom';
import { LeaderboardContainer } from '../../leaderboard/components/LeaderboardContainer';
import { LeaderboardOverview } from '../../leaderboard/components/LeaderboardOverview';
import { LeaderboardFilters } from '../../leaderboard/components/LeaderboardFilters';
import { API_BASE_URL } from '../../../shared/api/client';
import { Grid3x3, FileText, Mic, MessageSquare } from 'lucide-react'; 

export function LeaderboardContent() {
  const { category } = useParams();

  const ttsColumns = [
    { key: 'rank', label: 'Rank (UB)', sortable: true, width: '10%' },
    { key: 'model', label: 'Model', sortable: true, className: 'font-mono' },
    { key: 'score', label: 'Score', sortable: true, align: 'right' },
    { key: 'ci', label: '95% CI (±)', sortable: true, align: 'right' },
    { key: 'votes', label: 'Votes', sortable: true, align: 'right' },
    { key: 'organization', label: 'Organization', sortable: true },
    { key: 'license', label: 'License', sortable: true },
  ];

  const ttsLanguages = [
    { value: 'english', label: 'English', icon: '🇬🇧' },
    { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
    { value: 'marathi', label: 'Marathi', icon: '🇮🇳' },
    { value: 'nepali', label: 'Nepali', icon: '🇮🇳' },
    { value: 'kannada', label: 'Kannada', icon: '🇮🇳' },
    { value: 'bengali', label: 'Bengali', icon: '🇮🇳' },
    { value: 'gujarati', label: 'Gujarati', icon: '🇮🇳' },
    { value: 'tamil', label: 'Tamil', icon: '🇮🇳' },
    { value: 'bodo', label: 'Bodo', icon: '🇮🇳' },
    { value: 'maithili', label: 'Maithili', icon: '🇮🇳' },
    { value: 'kashmiri', label: 'Kashmiri', icon: '🇮🇳' },
    { value: 'malayalam', label: 'Malayalam', icon: '🇮🇳' },
    { value: 'assamese', label: 'Assamese', icon: '🇮🇳' },
    { value: 'dogri', label: 'Dogri', icon: '🇮🇳' },
    { value: 'konkani', label: 'Konkani', icon: '🇮🇳' },
    { value: 'telugu', label: 'Telugu', icon: '🇮🇳' },
    { value: 'sanskrit', label: 'Sanskrit', icon: '🇮🇳' },
    { value: 'manipuri', label: 'Manipuri', icon: '🇮🇳' },
    { value: 'urdu', label: 'Urdu', icon: '🇮🇳' },
    { value: 'odia', label: 'Odia', icon: '🇮🇳' },
    { value: 'santali', label: 'Santali', icon: '🇮🇳' },
    { value: 'punjabi', label: 'Punjabi', icon: '🇮🇳' },
    { value: 'sindhi', label: 'Sindhi', icon: '🇮🇳' },
    { value: 'thai', label: 'Thai', icon: '🇹🇭' },
  ];
  
  const filters = [
      { name: 'Overview', suffix: 'overview', icon: Grid3x3 },
      { name: 'Text', suffix: 'text', icon: FileText },
  ];

  const ttsDataMapper = (data) => {
      return (Array.isArray(data) ? data : [])
          .filter(m => m?.is_active === true)
          .map(m => ({
            rank: 0,
            model: m.display_name,
            score: 0,
            ci: 0,
            votes: 0,
            organization: (m.provider || '').charAt(0).toUpperCase() + (m.provider || '').slice(1),
            language: 'english',
            id: m.id,
            display_name: m.display_name,
            license: 'Unknown',
          }));
  };

  const ttsOverviewSections = [
    {
      id: 'tts', 
      title: 'TTS', 
      icon: FileText,
      fetchEndpoint: '/models/',
      viewAllLink: '/leaderboard/tts/tts',
      columns: ttsColumns,
      dataMapper: ttsDataMapper,
    }
  ];

  const orgOptions = [
    { value: 'ai4bharat', label: 'AI4Bharat' },
    { value: 'aquarium', label: 'Aquarium' },
    { value: 'ai4x', label: 'AI4X' },
  ];

  const renderContent = () => {
    switch(category) {
      case 'tts':
        return (
            <LeaderboardContainer 
                title="TTS Arena"
                description="View rankings across various TTS models."
                fetchEndpoint="/models/"
                type="tts"
                languageOptions={ttsLanguages}
                organizationOptions={orgOptions}
                columns={ttsColumns}
                defaultLanguage="english"
                defaultOrganization="ai4bharat"
                dataMapper={ttsDataMapper}
            />
        );
      case 'overview':
      default:
        return <LeaderboardOverview sections={ttsOverviewSections} />;
    }
  };

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
