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
        { rank: 1, model: "google/gemma-3-12b-it", score: 1451, votes: 54087, organization: "Google", license: "Apache 2.0" },
        { rank: 2, model: "google/gemma-3-27b-it", score: 1447, votes: 21306, organization: "Google", license: "Apache 2.0" },
        { rank: 3, model: "meta-llama/Llama-3.2-3B-Instruct", score: 1445, votes: 6287, organization: "Meta", license: "Apache 2.0" },
        { rank: 4, model: "meta-llama/Llama-3.3-70B-Instruct", score: 1441, votes: 14644, organization: "Meta", license: "Apache 2.0" },
        { rank: 5, model: "meta-llama/Llama-3-3-70B-Instruct-Turbo", score: 1440, votes: 40013, organization: "Meta", license: "Apache 2.0" },
        { rank: 6, model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", score: 1440, votes: 51293, organization: "Meta", license: "Apache 2.0" },
        { rank: 7, model: "meta-llama/Llama-4-Scout-17B-16E-Instruct", score: 1438, votes: 6144, organization: "Meta", license: "Apache 2.0" },
        { rank: 8, model: "GPT4", score: 1437, votes: 23580, organization: "OpenAI", license: "Proprietary" },
        { rank: 9, model: "GPT40Mini", score: 1437, votes: 33298, organization: "OpenAI", license: "Proprietary" },
        { rank: 10, model: "GPT5", score: 1434, votes: 18078, organization: "OpenAI", license: "Proprietary" },
        { rank: 11, model: "Qwen/Qwen3-30B-A3B", score: 1425, votes: 21630, organization: "Qwen", license: "Apache 2.0" },
        { rank: 12, model: "SARVAM_M", score: 1423, votes: 6919, organization: "Sarvam", license: "Apache 2.0" },
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
      {/* Notice Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-medium">
          We will update the leaderboard once a sufficient number of votes are received for each model.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={24} className="text-gray-700" />
                <h2 className="text-2xl font-semibold text-gray-900">{category.title}</h2>
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
