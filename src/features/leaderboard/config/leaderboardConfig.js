import { Grid3x3, FileText, Mic, ArrowUpRight } from 'lucide-react';
import { endpoints } from '../../../shared/api/endpoints';
import { RankCell } from '../components/RankCell';

import { ModelIcon } from '../components/ModelIcon';

// Column Definitions
export const commonColumns = {
  rank: { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <RankCell rank={val} /> },
  model: { 
    key: 'model', 
    label: 'Model', 
    sortable: true, 
    className: 'font-mono',
    render: (val, row) => (
      <a 
        href={row.license_url || row.url || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        className="group flex items-center gap-2 w-fit hover:cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <ModelIcon organization={row.organization || row.provider} />
        <span className="transition-colors  duration-50 group-hover:text-orange-600">
          {val}
        </span>
        <ArrowUpRight 
          size={14} 
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-0 text-gray-400 group-hover:text-orange-600" 
        />
      </a>
    )
  },
  modelNoLink: { 
    key: 'model', 
    label: 'Model', 
    sortable: true, 
    className: 'font-mono',
    render: (val, row) => (
      <div className="group flex items-center gap-2 w-fit">
        <ModelIcon organization={row.organization || row.provider} />
        <span>
          {val}
        </span>
      </div>
    )
  },
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

export const leaderboardColumnsNoLink = [
  commonColumns.rank,
  commonColumns.modelNoLink,
  commonColumns.score,
  commonColumns.ci,
  commonColumns.votes,
  commonColumns.organization,
  commonColumns.license,
];

export const ttsColumns = [
  commonColumns.rank,
  commonColumns.modelNoLink,
  { key: 'score', label: 'Score', sortable: true, align: 'right' },
  { key: '95_ci_pm', label: '95% CI', sortable: true, align: 'right' },
  { key: 'lower_ci', label: 'Lower CI', sortable: true, align: 'right' },
  { key: 'upper_ci', label: 'Upper CI', sortable: true, align: 'right' },
  { key: 'num_battles', label: 'Number of Battles', sortable: true, align: 'right' },
];

export const asrColumns = [
  { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <RankCell rank={val} /> },
  commonColumns.modelNoLink,
  { key: 'wer (%)', label: 'WER (%)', sortable: true, align: 'right' },
];

// Language Definitions
const indianLanguages = [
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Nepali', label: 'Nepali' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Bodo', label: 'Bodo' },
  { value: 'Maithili', label: 'Maithili' },
  { value: 'Kashmiri', label: 'Kashmiri' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Assamese', label: 'Assamese' },
  { value: 'Dogri', label: 'Dogri' },
  { value: 'Konkani', label: 'Konkani' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'Manipuri', label: 'Manipuri' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Santali', label: 'Santali' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Sindhi', label: 'Sindhi' },
  { value: 'Burmese', label: 'Burmese' },
  { value: 'Sinhala', label: 'Sinhala' },
  { value: 'Bhojpuri', label: 'Bhojpuri' },
  { value: 'Chhattisgarhi', label: 'Chhattisgarhi' },
];

const ttsLanguages = [
  { value: 'Overall', label: 'Overall' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Hindi', label: 'Hindi' },
  { value: "Bhojpuri", label: "Bhojpuri" },
  { value: "Chhattisgarhi", label: "Chhattisgarhi" },
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
    organizations: organizationOptions,
    columns: asrColumns,
    fetchEndpoint: (params) => endpoints.models.leaderboard('asr', params?.organization, params?.language),
    getOverviewSections: (tenant) => [
      {
        id: 'asr',
        title: 'ASR',
        icon: Mic,
        fetchEndpoint: endpoints.models.leaderboard('asr'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/asr` : '/leaderboard/asr',
        columns: asrColumns,
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
    fetchEndpoint: (params) => endpoints.models.leaderboard('llm', params?.organization, params?.language),
    getOverviewSections: (tenant) => [
      {
        id: 'text',
        title: 'Text',
        icon: FileText,
        fetchEndpoint: (params) => endpoints.models.leaderboard('llm', params?.organization || tenant || 'ai4b', params?.language),
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
    languages: ttsLanguages, // Or specific TTS languages if different
    organizations: organizationOptions,
    columns: ttsColumns,
    fetchEndpoint: (params) => endpoints.models.leaderboard('tts', params?.organization, params?.language),
    getOverviewSections: (tenant) => [
      {
        id: 'tts',
        title: 'TTS',
        icon: FileText,
        fetchEndpoint: (params) => endpoints.models.leaderboard('tts', params?.organization || tenant || 'ai4b', params?.language),
        viewAllLink: tenant ? `/${tenant}/leaderboard/tts/tts` : '/leaderboard/tts/tts',
        columns: ttsColumns,
      }
    ]
  }
};
