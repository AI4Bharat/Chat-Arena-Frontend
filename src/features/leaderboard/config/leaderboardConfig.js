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
  { value: 'mr', label: 'Marathi', icon: '🇮🇳' },
  { value: 'ne', label: 'Nepali', icon: '🇮🇳' },
  { value: 'kn', label: 'Kannada', icon: '🇮🇳' },
  { value: 'bn', label: 'Bengali', icon: '🇮🇳' },
  { value: 'gu', label: 'Gujarati', icon: '🇮🇳' },
  { value: 'ta', label: 'Tamil', icon: '🇮🇳' },
  { value: 'brx', label: 'Bodo', icon: '🇮🇳' },
  { value: 'mai', label: 'Maithili', icon: '🇮🇳' },
  { value: 'ks', label: 'Kashmiri', icon: '🇮🇳' },
  { value: 'hi', label: 'Hindi', icon: '🇮🇳' },
  { value: 'ml', label: 'Malayalam', icon: '🇮🇳' },
  { value: 'as', label: 'Assamese', icon: '🇮🇳' },
  { value: 'doi', label: 'Dogri', icon: '🇮🇳' },
  { value: 'gom', label: 'Konkani', icon: '🇮🇳' },
  { value: 'te', label: 'Telugu', icon: '🇮🇳' },
  { value: 'sa', label: 'Sanskrit', icon: '🇮🇳' },
  { value: 'mni', label: 'Manipuri', icon: '🇮🇳' },
  { value: 'ur', label: 'Urdu', icon: '🇮🇳' },
  { value: 'or', label: 'Odia', icon: '🇮🇳' },
  { value: 'sat', label: 'Santali', icon: '🇮🇳' },
  { value: 'pa', label: 'Punjabi', icon: '🇮🇳' },
  { value: 'sd', label: 'Sindhi', icon: '🇮🇳' },
  { value: 'my', label: 'Burmese', icon: '🇲🇲' },
  { value: 'si', label: 'Sinhala', icon: '🇱🇰' },
];

const globalLanguages = [
  { value: 'en', label: 'English', icon: '🇬🇧' },
  { value: 'th', label: 'Thai', icon: '🇹🇭' },
];

export const allLanguages = [...indianLanguages, ...globalLanguages];

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
    defaultLanguage: 'en',
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
    defaultLanguage: 'en',
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
    defaultLanguage: 'en',
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
