import { Trophy, Medal, Award } from 'lucide-react';

export function RankCell({ rank }) {
  const numericRank = Number(rank);

  if (numericRank === 1) {
    return (
        <div className="flex items-center justify-start pl-2">
            <Trophy className="text-[#FFD700] " size={20} />
        </div>
    );
  }
  if (numericRank === 2) {
    return (
        <div className="flex items-center justify-start pl-2">
             <Medal className="text-[#C0C0C0] " size={20} />
        </div>
    );
  }
  if (numericRank === 3) {
    return (
        <div className="flex items-center justify-start pl-2">
            <Award className="text-[#CD7F32] " size={20} />
        </div>
    );
  }

  return <div className="pl-4 text-gray-900 font-medium">{rank}</div>;
}
