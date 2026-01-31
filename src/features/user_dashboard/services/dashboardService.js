import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const dashboardService = {
    fetchUserStats: async () => {
        try {
            const response = await apiClient.get(endpoints.auth.stats);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            throw error;
        }
    }
};
