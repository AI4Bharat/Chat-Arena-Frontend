import { useParams } from 'react-router-dom';
import { LeaderboardContainer } from '../../leaderboard/components/LeaderboardContainer';
import { LeaderboardOverview } from '../../leaderboard/components/LeaderboardOverview';
import { LeaderboardFilters } from '../../leaderboard/components/LeaderboardFilters';
import { endpoints } from '../../../shared/api/endpoints';
import { Grid3x3, FileText, Mic, MessageSquare } from 'lucide-react'; // Assuming Mic for ASR

export function LeaderboardContent() {
  const { category } = useParams();

  const asrColumns = [
    { key: 'rank', label: 'Rank (UB)', sortable: true, width: '10%' },
    { key: 'model', label: 'Model', sortable: true, className: 'font-mono' },
    { key: 'score', label: 'Score', sortable: true, align: 'right' },
    { key: 'ci', label: '95% CI (±)', sortable: true, align: 'right' },
    { key: 'votes', label: 'Votes', sortable: true, align: 'right' },
    { key: 'organization', label: 'Organization', sortable: true },
    { key: 'license', label: 'License', sortable: true },
  ];

  const asrLanguages = [
    { value: 'marathi', label: 'Marathi', icon: '🇮🇳' },
    { value: 'nepali', label: 'Nepali', icon: '🇮🇳' },
    { value: 'kannada', label: 'Kannada', icon: '🇮🇳' },
    { value: 'bengali', label: 'Bengali', icon: '🇮🇳' },
    { value: 'gujarati', label: 'Gujarati', icon: '🇮🇳' },
    { value: 'tamil', label: 'Tamil', icon: '🇮🇳' },
    { value: 'bodo', label: 'Bodo', icon: '🇮🇳' },
    { value: 'maithili', label: 'Maithili', icon: '🇮🇳' },
    { value: 'kashmiri', label: 'Kashmiri', icon: '🇮🇳' },
    { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
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
    { value: 'english', label: 'English', icon: '🇬🇧' },
    { value: 'thai', label: 'Thai', icon: '🇹🇭' },
  ];

  const orgOptions = [
    { value: 'ai4bharat', label: 'AI4Bharat' },
    { value: 'aquarium', label: 'Aquarium' },
    { value: 'ai4x', label: 'AI4X' },
  ];
  
  const filters = [
      { name: 'Overview', suffix: 'overview', icon: Grid3x3 },
      { name: 'ASR', suffix: 'asr', icon: Mic },
  ];

  const asrOverviewSections = [
    {
      id: 'asr',
      title: 'ASR',
      icon: Mic, // Using Mic for ASR icon in overview
      fetchEndpoint: endpoints.models.leaderboard('asr'),
      viewAllLink: '/leaderboard/asr',
      columns: asrColumns, // Use same columns or simplified
    }
  ];

  const renderContent = () => {
    switch(category) {
      case 'overview':
        return <LeaderboardOverview sections={asrOverviewSections} />;
      default:
        return (
            <LeaderboardContainer 
                title="ASR Arena"
                description="View rankings across various ASR models on their versatility, linguistic precision, and cultural context."
                fetchEndpoint={({ organization }) => endpoints.models.leaderboard('asr', organization)}
                type="asr"
                languageOptions={asrLanguages}
                organizationOptions={orgOptions}
                columns={asrColumns}
                defaultLanguage="english"
                defaultOrganization="ai4bharat"
            />
        );
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
