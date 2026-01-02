import axios from 'axios';
import { userService } from '../../features/auth/services/userService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

// Tenant storage key
const TENANT_STORAGE_KEY = 'current_tenant';

// Extract tenant from current URL hash
// URL format: /#/{tenant}/chat/... or /#/{tenant}/asr/... etc.
function getTenantFromUrl() {
  const hash = window.location.hash;
  // Match tenant in URLs like /#/aquarium/chat or /#/aquarium/asr
  const match = hash.match(/^#\/([a-zA-Z0-9_-]+)\/(chat|asr|tts|leaderboard|shared)/);
  if (match) {
    // Store tenant in localStorage when detected from URL
    localStorage.setItem(TENANT_STORAGE_KEY, match[1]);
    return match[1];
  }
  return null;
}

// Get tenant from URL or localStorage fallback
function getCurrentTenant() {
  // First try to get from URL (most reliable source of truth)
  const urlTenant = getTenantFromUrl();
  if (urlTenant) {
    return urlTenant;
  }
  // Fall back to localStorage (for when URL hasn't updated yet)
  return localStorage.getItem(TENANT_STORAGE_KEY);
}

// Clear stored tenant (call this when navigating away from tenant routes)
export function clearStoredTenant() {
  localStorage.removeItem(TENANT_STORAGE_KEY);
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers = [];
let failedRequestsCount = 0;
const MAX_RETRY_ATTEMPTS = 3;

// Callback for logout - will be set by the store
let onLogoutCallback = null;

export const setLogoutCallback = (callback) => {
  onLogoutCallback = callback;
};

// Reset failed count periodically
setInterval(() => {
  failedRequestsCount = 0;
}, 60000); // Reset every minute

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// Call all refresh subscribers
function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

// Request interceptor for auth and tenant routing
apiClient.interceptors.request.use(
  (config) => {
    // Get tenant from URL or localStorage
    const tenant = getCurrentTenant();

    // Add tenant prefix to URL if tenant exists
    if (tenant && config.url) {
      // Remove any existing leading slash
      let cleanUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url;

      // If URL already starts with ANY tenant prefix (e.g. aquarium/), strip it
      // This prevents double prefixing if the code already added it
      const parts = cleanUrl.split('/');
      if (parts.length > 0 && parts[0] === tenant) {
        // It already has the correct tenant prefix, do nothing (just ensure leading slash)
        config.url = `/${cleanUrl}`;
      } else {
        // It doesn't have the tenant prefix, add it
        config.url = `/${tenant}/${cleanUrl}`;
      }
    }

    // Skip auth for these endpoints
    const skipAuthEndpoints = ['/auth/', '/public/'];
    const shouldSkipAuth = skipAuthEndpoints.some(endpoint =>
      config.url?.includes(endpoint)
    );

    if (!shouldSkipAuth) {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        const anonymousToken = localStorage.getItem('anonymous_token');
        if (anonymousToken) {
          config.headers['X-Anonymous-Token'] = anonymousToken;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Reset failed count on any successful request
    failedRequestsCount = 0;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (failedRequestsCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max retry attempts reached, stopping requests');
      onLogoutCallback?.();
      return Promise.reject(new Error('Authentication failed. Please refresh the page.'));
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip retry for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Mark request as retried
      originalRequest._retry = true;
      failedRequestsCount++;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');

          // If no refresh token, don't try to refresh
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Don't use apiClient here to avoid interceptor loop
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh/`,
            { refresh: refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              // Add timeout to prevent hanging
              timeout: 5000
            }
          );

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reset failed count on successful refresh
          failedRequestsCount = 0;
          isRefreshing = false;
          onRefreshed(access);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);

        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Only clear tokens and logout, don't redirect
          userService.clearTokens();
          onLogoutCallback?.();

          // Return a rejected promise with a clear error
          return Promise.reject(new Error('Session expired. Please sign in again.'));
        }
      } else {
        // Wait for ongoing refresh
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });

          // Timeout for waiting
          setTimeout(() => {
            reject(new Error('Token refresh timeout'));
          }, 10000);
        });
      }
    }

    return Promise.reject(error);
  }
);

// Add abort controller support
export const createAbortController = () => new AbortController();

// WebSocket connection helper with better error handling
export const createWebSocketConnection = (path, options = {}) => {
  const token = localStorage.getItem('access_token');
  const anonymousToken = localStorage.getItem('anonymous_token');

  // Don't create connection without auth
  if (!token && !anonymousToken) {
    throw new Error('No authentication token available');
  }

  let wsUrl = `${WS_BASE_URL}${path}`;
  const queryParams = [];

  if (token) {
    queryParams.push(`token=${token}`);
  } else if (anonymousToken) {
    queryParams.push(`anonymous_token=${anonymousToken}`);
  }

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  });

  if (queryParams.length > 0) {
    wsUrl += `?${queryParams.join('&')}`;
  }

  return new WebSocket(wsUrl);
};

export { apiClient, API_BASE_URL, WS_BASE_URL };