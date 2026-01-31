import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { dashboardService } from '../services/dashboardService';
import { StatsCard } from './StatsCard';
import { ModelRankings } from './ModelRankings';
import { UsageCharts } from './UsageCharts';
import { FavoriteModels } from './FavoriteModels';
import { Loading } from '../../../shared/components/Loading';
import { MessageSquare, ThumbsUp, Calendar, Zap, AlertCircle } from 'lucide-react';

export function DashboardPage() {
    const { user, isAuthenticated, isAnonymous } = useSelector((state) => state.auth);

    const { data: stats, isLoading, error, isRefetching, refetch } = useQuery({
        queryKey: ['userStats'],
        queryFn: dashboardService.fetchUserStats,
        enabled: isAuthenticated && !isAnonymous && !!user?.id,
        refetchOnMount: 'always',
    });

    // Guard: If not strictly authenticated or is anonymous, do not render dashboard logic
    if (!isAuthenticated || isAnonymous || !user) {
        return null;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 text-gray-800">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Error loading dashboard</h2>
                    <p className="text-gray-500 mb-4">
                        We're sorry, but something unexpected happened while loading your dashboard. Please try again.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || isRefetching || !stats) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <Loading size="large" />
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 text-gray-900 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Chats"
                        value={stats.total_sessions}
                        icon={MessageSquare}
                        description="Across all modes"
                        delay={0}
                    />
                    <StatsCard
                        title="Total Messages"
                        value={stats.total_messages}
                        icon={Zap}
                        description="Messages sent"
                        delay={0.1}
                    />
                    <StatsCard
                        title="Votes Cast"
                        value={stats.feedback_given}
                        icon={ThumbsUp}
                        description="Times you voted"
                        delay={0.2}
                    />
                    <StatsCard
                        title="Activity Streak"
                        value={`${stats.activity_streak} Days`}
                        icon={Calendar}
                        description="Consecutive days"
                        delay={0.3}
                    />
                </div>

                {/* Charts Section */}
                <div>
                    <UsageCharts
                        languageStats={stats.language_stats}
                        chatsByType={stats.chats_by_type}
                        sessionBreakdown={stats.session_breakdown}
                    />
                </div>

                {/* Rankings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ModelRankings models={stats.model_preferences} />
                    </div>

                    {/* Favorite Models (By Usage) */}
                    <FavoriteModels models={stats.favorite_models} />
                </div>

            </div>
        </div>
    );
}
