import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export function RandomVotesCard() {
    const { isAnonymous } = useSelector((state) => state.auth);
    const { selectedMode } = useSelector((state) => state.chat);
    const [votesCount, setVotesCount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only show for authenticated users in random mode
        if (isAnonymous || selectedMode !== 'random') {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const response = await apiClient.get(endpoints.auth.stats);
                setVotesCount(response.data.llm_random_votes_count || 0);
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
                // Silently fail - don't show the card if stats fetch fails
                setVotesCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAnonymous, selectedMode]);

    // Don't render if anonymous or not in random mode
    if (isAnonymous || selectedMode !== 'random' || loading) {
        return null;
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-blue-50/30 border border-blue-100/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-2 sm:p-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex flex-col">
                        <span className="text-lg sm:text-xl font-bold text-blue-900 leading-tight">
                            {votesCount}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-600 font-medium leading-tight">
                            vote{votesCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {votesCount > 0 && (
                        <div className="ml-1">
                            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
