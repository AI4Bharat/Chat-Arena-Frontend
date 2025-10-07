import axios from 'axios';
import { userService } from '../../features/auth/services/userService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if you use them
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers = [];

// Add subscriber to refresh token
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// Call all refresh subscribers
function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Don't add auth headers to auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/');
    
    if (!isAuthEndpoint) {
      // Check for JWT access token
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      // Check for anonymous token (as fallback)
      const anonymousToken = localStorage.getItem('anonymous_token');
      if (anonymousToken && !accessToken) {
        config.headers['X-Anonymous-Token'] = anonymousToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry on auth endpoints
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }
          
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          isRefreshing = false;
          onRefreshed(access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          isRefreshing = false;
          
          // Clear tokens and redirect to login
          userService.clearTokens();
          window.location.href = '/';
          
          return Promise.reject(refreshError);
        }
      } else {
        // Token is being refreshed, wait for it
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// WebSocket connection helper
export const createWebSocketConnection = (path, options = {}) => {
  const token = localStorage.getItem('access_token');
  const anonymousToken = localStorage.getItem('anonymous_token');
  
  let wsUrl = `${WS_BASE_URL}${path}`;
  
  // Add authentication to query params
  const queryParams = [];
  if (token) {
    queryParams.push(`token=${token}`);
  } else if (anonymousToken) {
    queryParams.push(`anonymous_token=${anonymousToken}`);
  }
  
  // Add any additional options as query params
  Object.entries(options).forEach(([key, value]) => {
    if (value) queryParams.push(`${key}=${value}`);
  });
  
  if (queryParams.length > 0) {
    wsUrl += `?${queryParams.join('&')}`;
  }
  
  return new WebSocket(wsUrl);
};

export { apiClient, API_BASE_URL, WS_BASE_URL };