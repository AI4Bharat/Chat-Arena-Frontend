import { Grid3x3, FileText, Mic } from 'lucide-react';
import { endpoints } from '../../../shared/api/endpoints';
import { RankCell } from '../components/RankCell';

// Column Definitions
export const commonColumns = {
  rank: { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <RankCell rank={val} /> },
  model: { key: 'model', label: 'Model', sortable: true, className: 'font-mono' },
  score: { key: 'score', label: 'Score', sortable: true, align: 'right' },
  ci: { key: 'ci', label: '95% CI (±)', sortable: true, align: 'right' },
  votes: { key: 'votes', label: 'Votes', sortable: true, align: 'right' },
  organization: { key: 'organization', label: 'Organization', sortable: true },
  license: { key: 'license', label: 'License', sortable: true },
};

export const leaderboardColumns = [
  commonColumns.rank,
  commonColumns.model,
  commonColumns.score,
  commonColumns.ci,
  commonColumns.votes,
  commonColumns.organization,
  commonColumns.license,
];

// Language Definitions
const indianLanguages = [
  { value: 'mr', label: 'Marathi' },
  { value: 'ne', label: 'Nepali' },
  { value: 'kn', label: 'Kannada' },
  { value: 'bn', label: 'Bengali' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' },
  { value: 'brx', label: 'Bodo' },
  { value: 'mai', label: 'Maithili' },
  { value: 'ks', label: 'Kashmiri' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'as', label: 'Assamese' },
  { value: 'doi', label: 'Dogri' },
  { value: 'gom', label: 'Konkani' },
  { value: 'te', label: 'Telugu' },
  { value: 'sa', label: 'Sanskrit' },
  { value: 'mni', label: 'Manipuri' },
  { value: 'ur', label: 'Urdu' },
  { value: 'or', label: 'Odia' },
  { value: 'sat', label: 'Santali' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'sd', label: 'Sindhi' },
  { value: 'my', label: 'Burmese' },
  { value: 'si', label: 'Sinhala' },
];

const globalLanguages = [
  { value: 'en', label: 'English' },
  { value: 'th', label: 'Thai' },
];

export const allLanguages = [{ value: 'Overall', label: 'Overall' }, ...indianLanguages, ...globalLanguages];

// Organization Options
export const organizationOptions = [
  { value: 'ai4b', label: 'AI4Bharat' },
  { value: 'aquarium', label: 'Aquarium' },
  { value: 'ai4x', label: 'AI4X' },
];

// TTS Data Mapper
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
      language: 'en',
      id: m.id,
      display_name: m.display_name,
      license: 'Unknown',
    }));
};

// Feature Configurations
export const leaderboardConfig = {
  asr: {
    title: 'ASR Arena',
    description: 'View rankings across various ASR models on their versatility, linguistic precision, and cultural context.',
    type: 'asr',
    defaultLanguage: 'Overall',
    defaultOrganization: 'ai4b',
    languages: allLanguages,
    organizations: organizationOptions,
    columns: leaderboardColumns,
    fetchEndpoint: (params) => endpoints.models.leaderboard('asr', params?.organization),
    getOverviewSections: (tenant) => [
      {
        id: 'asr',
        title: 'ASR',
        icon: Mic,
        fetchEndpoint: endpoints.models.leaderboard('asr'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/asr` : '/leaderboard/asr',
        columns: leaderboardColumns,
      }
    ]
  },
  llm: { // Chat
    title: 'Text Arena',
    description: 'View rankings across various LLMs on their versatility, linguistic precision, and cultural context across text.',
    type: 'llm',
    defaultLanguage: 'Overall',
    defaultOrganization: 'ai4b',
    languages: allLanguages,
    organizations: organizationOptions,
    columns: leaderboardColumns,
    fetchEndpoint: (params) => endpoints.models.leaderboard('llm', params?.organization),
    getOverviewSections: (tenant) => [
      {
        id: 'text',
        title: 'Text',
        icon: FileText,
        fetchEndpoint: (params) => endpoints.models.leaderboard('llm', params?.organization || tenant || 'ai4b'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/chat/text` : '/leaderboard/chat/text',
        columns: leaderboardColumns,
      }
    ]
  },
  tts: {
    title: 'TTS Arena',
    description: 'View rankings across various TTS models.',
    type: 'tts',
    defaultLanguage: 'Overall',
    defaultOrganization: 'ai4b',
    languages: allLanguages, // Or specific TTS languages if different
    organizations: organizationOptions,
    columns: leaderboardColumns,
    fetchEndpoint: '/models/',
    dataMapper: ttsDataMapper,
    getOverviewSections: (tenant) => [
      {
        id: 'tts',
        title: 'TTS',
        icon: FileText,
        fetchEndpoint: '/models/',
        viewAllLink: tenant ? `/${tenant}/leaderboard/tts/tts` : '/leaderboard/tts/tts',
        columns: leaderboardColumns,
        dataMapper: ttsDataMapper,
      }
    ]
  }
};
