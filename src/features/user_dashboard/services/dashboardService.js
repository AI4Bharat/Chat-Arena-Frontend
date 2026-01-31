import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const dashboardService = {
    fetchUserStats: async () => {
        const response = await apiClient.get(endpoints.auth.stats);
        return response.data;
    }
};
