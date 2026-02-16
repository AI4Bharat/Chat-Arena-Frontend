import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { dashboardService } from '../services/dashboardService';
import { StatsCard } from './StatsCard';
import { ModelRankings } from './ModelRankings';
import { UsageCharts } from './UsageCharts';
import { FavoriteModels } from './FavoriteModels';
import { ArenaSelector } from './ArenaSelector';
import { Loading } from '../../../shared/components/Loading';
import { cn } from '../../../shared/utils';
import { MessageSquare, ThumbsUp, Calendar, Zap, AlertCircle, PanelLeftOpen } from 'lucide-react';

export function DashboardPage({ onToggleSidebar }) {
    const { user, isAuthenticated, isAnonymous } = useSelector((state) => state.auth);
    const [selectedArena, setSelectedArena] = useState('');

    const { data: stats, isLoading, error, isRefetching, refetch } = useQuery({
        queryKey: ['userStats', selectedArena],
        queryFn: () => dashboardService.fetchUserStats(selectedArena),
        enabled: isAuthenticated && !isAnonymous && !!user?.id,
        staleTime: 0,
    });

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

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <Loading size="large" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full text-gray-900">
            {/* Integrated Header */}
            <header className="bg-white border-b border-gray-200 px-2 sm:px-4 md:px-6 flex-shrink-0 h-[64px] flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    {/* Mobile Sidebar Toggle */}
                    <button
                        className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                        aria-label="Open sidebar"
                        onClick={onToggleSidebar}
                    >
                        <PanelLeftOpen size={20} />
                    </button>

                    {/* Integrated Arena Selector */}
                    <ArenaSelector
                        selectedArena={selectedArena}
                        onSelectArena={setSelectedArena}
                    />
                </div>
            </header>

            {/* Scrollable Content */}
            <div className={cn(
                "flex-1 overflow-y-auto p-6 transition-opacity duration-200",
                isRefetching ? "opacity-60" : "opacity-100"
            )}>
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Chats"
                            value={stats.total_sessions}
                            icon={MessageSquare}
                            description={selectedArena === '' ? "Across all modes" : "In this arena"}
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
        </div>
    );
}
