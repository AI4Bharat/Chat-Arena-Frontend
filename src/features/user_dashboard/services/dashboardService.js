import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const dashboardService = {
    fetchUserStats: async (arenaType) => {
        try {
            let url = endpoints.auth.stats;
            if (arenaType) {
                url += `?type=${arenaType}`;
            }
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            throw error;
        }
    }
};
