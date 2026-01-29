import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const userService = {
  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get(endpoints.auth.currentUser);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await apiClient.patch(
      endpoints.auth.updatePreferences, 
      preferences
    );
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await apiClient.post(endpoints.auth.deleteAccount);
    return response.data;
  },

  // Refresh access token
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post(endpoints.auth.refresh, {
      refresh: refreshToken
    });
    
    // Update stored tokens
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }
    
    return response.data;
  },

  // Check if user has reached guest limits
  checkGuestLimits: (user) => {
    if (!user?.is_anonymous) return { canSendMessage: true, canCreateSession: true };
    
    const messageCount = user.preferences?.message_count || 0;
    const sessionCount = user.preferences?.session_count || 0;
    
    return {
      canSendMessage: messageCount < 20,
      canCreateSession: sessionCount < 3,
      messageCount,
      sessionCount,
      messageLimit: 20,
      sessionLimit: 3,
    };
  },

  // Store tokens from auth response
  storeTokens: (tokens) => {
    if (tokens.access) {
      localStorage.setItem('access_token', tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  },

  // Clear all auth tokens
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('anonymous_token');
  },
};