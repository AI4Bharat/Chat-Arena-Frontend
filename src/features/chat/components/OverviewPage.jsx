// OverviewPage.jsx
import { LeaderboardTable } from './LeaderboardTable';
import { FileText, Code, Eye, ImageIcon, Wand2, Globe, Video, Image as ImageIcon2, Terminal } from 'lucide-react';

export function OverviewPage() {
  const categories = [
    {
      id: 'text',
      title: 'Text',
      icon: FileText,
      data: [
        { rank: 1, model: "gemini-2.5-pro", score: 1451, votes: 54087, organization: "Google", license: "Proprietary" },
        { rank: 1, model: "claude-opus-4-1-20250805-thinking-16k", score: 1447, votes: 21306, organization: "Anthropic", license: "Proprietary" },
        { rank: 1, model: "claude-sonnet-4-5-20250929-thinking-32k", score: 1445, votes: 6287, organization: "Anthropic", license: "Proprietary" },
        { rank: 1, model: "gpt-4.5-preview-2025-02-27", score: 1441, votes: 14644, organization: "OpenAI", license: "Proprietary" },
        { rank: 2, model: "chatgpt-4o-latest-20250326", score: 1440, votes: 40013, organization: "OpenAI", license: "Proprietary" },
        { rank: 2, model: "o3-2025-04-16", score: 1440, votes: 51293, organization: "OpenAI", license: "Proprietary" },
        { rank: 2, model: "claude-sonnet-4-5-20250929", score: 1438, votes: 6144, organization: "Anthropic", license: "Proprietary" },
        { rank: 2, model: "gpt-5-high", score: 1437, votes: 23580, organization: "OpenAI", license: "Proprietary" },
        { rank: 2, model: "claude-opus-4-1-20250805", score: 1437, votes: 33298, organization: "Anthropic", license: "Proprietary" },
        { rank: 3, model: "qwen3-max-preview", score: 1434, votes: 18078, organization: "Alibaba", license: "Proprietary" },
      ]
    },
    // {
    //   id: 'webdev',
    //   title: 'WebDev',
    //   icon: Code,
    //   data: [
    //     // Add dummy data for WebDev (top 10 rows)
    //     { rank: 1, model: "gpt-4.5-webdev", score: 1420, votes: 15000, organization: "OpenAI", license: "Proprietary" },
    //     // ... 9 more rows
    //   ]
    // },
    // {
    //   id: 'vision',
    //   title: 'Vision',
    //   icon: Eye,
    //   data: [
    //     // Add dummy data for Vision (top 10 rows)
    //     { rank: 1, model: "gemini-vision-pro", score: 1410, votes: 12000, organization: "Google", license: "Proprietary" },
    //     // ... 9 more rows
    //   ]
    // },
    // // Add more categories...
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">


      <div className="space-y-8">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={24} className="text-gray-700 dark:text-gray-300" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{category.title}</h2>
              </div>
              <LeaderboardTable 
                data={category.data} 
                categoryId={category.id}
                showViewAll={true}
                compact={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
