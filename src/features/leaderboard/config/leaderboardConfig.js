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
    className: 'font-mono whitespace-nowrap min-w-[200px]',
    render: (val, row) => (
      <a href={row.license_url || row.url || '#'} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 w-fit hover:cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <ModelIcon organization={row.organization || row.provider} />
        <span className="transition-colors  duration-50 group-hover:text-orange-600 truncate">{row.display_name || val}</span>
        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-0 text-gray-400 group-hover:text-orange-600 flex-shrink-0" />
      </a>
    ),
  },
  modelNoLink: {
    key: 'model',
    label: 'Model',
    sortable: true,
    className: 'font-mono whitespace-nowrap min-w-[200px]',
    render: (val, row) => (
      <div className="group flex items-center gap-2 w-fit">
        <ModelIcon organization={row.organization || row.provider} />
        <span className="truncate">{row.display_name || val}</span>
      </div>
    ),
  },
  score: { key: 'score', label: 'Score', sortable: true, align: 'right' },
  ci: { key: 'ci', label: '95% CI (±)', sortable: true, align: 'right' },
  votes: { key: 'votes', label: 'Votes', sortable: true, align: 'right' },
  organization: { key: 'organization', label: 'Organization', sortable: true },
  license: { key: 'license', label: 'License', sortable: true, render: (val) => val || '-' },
  rankNoTrophy: { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <div className="pl-4 text-gray-900 font-medium">{val}</div> },
};

export const leaderboardColumns = [commonColumns.rankNoTrophy, commonColumns.model, commonColumns.score, commonColumns.ci, commonColumns.votes, commonColumns.organization, commonColumns.license];

export const leaderboardColumnsNoLink = [commonColumns.rankNoTrophy, commonColumns.modelNoLink, commonColumns.score, commonColumns.ci, commonColumns.votes, commonColumns.organization, commonColumns.license];

export const ttsColumns = [
  { key: 'rank', label: 'Rank', sortable: false, width: '10%', render: () => <div className="pl-4 text-gray-500 font-medium">-</div> },
  commonColumns.model,
  { key: 'score', label: 'Score', sortable: true, align: 'right' },
  { key: '95_ci_pm', label: '95% CI', sortable: true, align: 'right' },
  { key: 'lower_ci', label: 'Lower CI', sortable: true, align: 'right' },
  { key: 'upper_ci', label: 'Upper CI', sortable: true, align: 'right' },
  { key: 'num_battles', label: 'Number of Battles', sortable: true, align: 'right' },
];

export const asrColumns = [
  { key: 'rank', label: 'Rank', sortable: true, width: '10%', render: (val) => <RankCell rank={val} /> },
  commonColumns.model,
  { key: 'wer (%)', label: 'WER (%)', sortable: true, align: 'right' },
];

// Language Definitions
export const allLanguages = [{ value: 'Overall', label: 'Overall' }];
export const ttsLanguages = [{ value: 'Overall', label: 'Overall' }];

// Organization Options
export const organizationOptions = [
  { value: 'ai4b', label: 'AI4Bharat' },
  { value: 'aquarium', label: 'Aquarium' },
  { value: 'ai4x', label: 'AI4X' },
];

// Feature Configurations
export const leaderboardConfig = {
  asr: {
    title: 'ASR Leaderboards',
    description: (
      <a href="https://voice-of-india.ai.joshtalks.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
        More info on Voice of India
      </a>
    ),
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
        id: 'voice-of-india',
        title: 'Voice of India',
        tabTitle: 'Voice of India',
        tabDescription: (
          <a href="https://voice-of-india.ai.joshtalks.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
            More info on Voice of India
          </a>
        ),
        icon: Mic,
        fetchEndpoint: (params) => endpoints.models.leaderboard('asr/voice-of-india', params?.organization, params?.language),
        languagesEndpoint: endpoints.models.leaderboardLanguages('asr/voice-of-india'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/asr/voice-of-india` : '/leaderboard/asr/voice-of-india',
        columns: asrColumns,
      },
      {
        id: 'asr-arena',
        title: 'ASR Arena',
        tabTitle: 'ASR Arena',
        tabDescription: 'View rankings across various ASR models on their versatility, linguistic precision, and cultural context.',
        icon: Mic,
        fetchEndpoint: (params) => endpoints.models.leaderboard('asr/asr-arena', params?.organization, params?.language),
        languagesEndpoint: endpoints.models.leaderboardLanguages('asr/asr-arena'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/asr/asr-arena` : '/leaderboard/asr/asr-arena',
        columns: asrColumns,
      },
    ],
  },
  llm: {
    // Chat
    title: 'LLM Leaderboards',
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
        title: 'Text Arena',
        tabTitle: 'Text Arena',
        icon: FileText,
        fetchEndpoint: (params) => endpoints.models.leaderboard('llm', params?.organization || tenant || 'ai4b', params?.language),
        languagesEndpoint: endpoints.models.leaderboardLanguages('llm/text'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/chat/text` : '/leaderboard/chat/text',
        columns: leaderboardColumns,
      },
    ],
  },
  tts: {
    title: 'TTS Arena',
    description: 'View rankings across various TTS models.',
    type: 'tts',
    isWorkInProgress: true,
    defaultLanguage: 'Overall',
    defaultOrganization: 'ai4b',
    languages: ttsLanguages, // Or specific TTS languages if different
    organizations: organizationOptions,
    columns: ttsColumns,
    fetchEndpoint: (params) => endpoints.models.leaderboard('tts', params?.organization, params?.language),
    getOverviewSections: (tenant) => [
      {
        id: 'tts-academic-benchmark',
        title: 'TTS Academic Benchmark',
        tabTitle: 'TTS Academic Benchmark',
        icon: FileText,
        isWorkInProgress: true,
        fetchEndpoint: (params) => endpoints.models.leaderboard('tts/tts-academic-benchmark', params?.organization || tenant || 'ai4b', params?.language),
        languagesEndpoint: endpoints.models.leaderboardLanguages('tts/tts-academic-benchmark'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/tts/tts-academic-benchmark` : '/leaderboard/tts/tts-academic-benchmark',
        columns: ttsColumns,
      },
      {
        id: 'tts-arena',
        title: 'TTS Arena',
        tabTitle: 'TTS Arena',
        tabDescription: 'View rankings across various TTS models on their versatility, linguistic precision, and cultural context.',
        icon: FileText,
        isWorkInProgress: true,
        fetchEndpoint: (params) => endpoints.models.leaderboard('tts/tts-arena', params?.organization, params?.language),
        languagesEndpoint: endpoints.models.leaderboardLanguages('tts/tts-arena'),
        viewAllLink: tenant ? `/${tenant}/leaderboard/tts/tts-arena` : '/leaderboard/tts/tts-arena',
        columns: ttsColumns,
      },
    ],
  },
};
