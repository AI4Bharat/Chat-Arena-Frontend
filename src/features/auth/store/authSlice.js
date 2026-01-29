import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { userService } from '../services/userService';

const handleApiError = (error, dispatch) => {
  const status = error.response?.status;
  if (status === 503 || status === 500) {
    dispatch(setMaintenanceMode(true));
  }
  return error;
};

// Async thunks
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue, dispatch }) => {
    try {
      // Get anonymous token if exists
      const anonymousToken = localStorage.getItem('anonymous_token');

      // Set anonymous token in header if exists for merging
      if (anonymousToken) {
        apiClient.defaults.headers['X-Anonymous-Token'] = anonymousToken;
      }

      const response = await apiClient.post(endpoints.auth.google, { id_token: idToken });

      // Store JWT tokens
      userService.storeTokens(response.data.tokens);

      // Clean up anonymous token after successful merge
      if (anonymousToken) {
        localStorage.removeItem('anonymous_token');
        delete apiClient.defaults.headers['X-Anonymous-Token'];
      }

      return response.data;
    } catch (error) {
      handleApiError(error, dispatch);
      return rejectWithValue(error.message);
    }
  }
);

export const loginWithPhone = createAsyncThunk(
  'auth/loginWithPhone',
  async ({ idToken, displayName }, { rejectWithValue, dispatch }) => {
    try {
      // Get anonymous token if exists
      const anonymousToken = localStorage.getItem('anonymous_token');

      // Set anonymous token in header if exists for merging
      if (anonymousToken) {
        apiClient.defaults.headers['X-Anonymous-Token'] = anonymousToken;
      }

      const response = await apiClient.post(endpoints.auth.phone, {
        id_token: idToken,
        display_name: displayName
      });

      // Store JWT tokens
      userService.storeTokens(response.data.tokens);

      // Clean up anonymous token after successful merge
      if (anonymousToken) {
        localStorage.removeItem('anonymous_token');
        delete apiClient.defaults.headers['X-Anonymous-Token'];
      }

      return response.data;
    } catch (error) {
      handleApiError(error, dispatch);
      return rejectWithValue(error.message);
    }
  }
);

export const loginAnonymously = createAsyncThunk(
  'auth/loginAnonymously',
  async (displayName, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post(endpoints.auth.anonymous, {
        display_name: displayName
      });

      // Store JWT tokens and anonymous token
      userService.storeTokens(response.data.tokens);
      if (response.data.anonymous_token) {
        localStorage.setItem('anonymous_token', response.data.anonymous_token);
      }

      return response.data;
    } catch (error) {
      handleApiError(error, dispatch);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get(endpoints.auth.currentUser);
      return response.data;
    } catch (error) {
      handleApiError(error, dispatch);
      const status = error.response?.status || error.status;
      const errorCode = error.code || error.response?.code;
      const errorMessage = error.message || error?.toString();

      if (
        status === 503 || status === 500 ||
        errorCode === 'ERR_CONNECTION_REFUSED' ||
        errorMessage?.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage?.includes('Network Error') ||
        errorMessage?.includes('Failed to fetch')
      ) {
        dispatch(setMaintenanceMode(true));
      }
      if (status === 401) {
        return rejectWithValue('Authentication failed');
      }
      return rejectWithValue({
        message: error.message,
        status: status,
      });
    }
  }
);

export const updatePreferences = createAsyncThunk(
  'auth/updatePreferences',
  async (preferences, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.patch(endpoints.auth.updatePreferences, preferences);
      return response.data;
    } catch (error) {
      handleApiError(error, dispatch);
      return rejectWithValue(error.message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await userService.refreshAccessToken();
      return response;
    } catch (error) {
      handleApiError(error, dispatch);
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isAnonymous: false,
    loading: false,
    error: null,
    initialized: false,
    isUnderMaintenance: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAnonymous = false;
      state.error = null;
      state.initialized = false;
      // Clear all tokens
      state.isUnderMaintenance = false;
      userService.clearTokens();
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    setMaintenanceMode: (state, action) => {
      state.isUnderMaintenance = action.payload;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    // Google login
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAnonymous = false;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

    // Phone login
    builder
      .addCase(loginWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAnonymous = false;
        state.error = null;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });

      // Anonymous login
    builder
      .addCase(loginAnonymously.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAnonymously.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAnonymous = true;
        state.error = null;
        state.initialized = true;
      })
      .addCase(loginAnonymously.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.initialized = true;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAnonymous = action.payload.is_anonymous;
        state.error = null;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload || action.error.message;
        state.initialized = true;
      });

    // Update preferences
    builder
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // Refresh token
    builder
      .addCase(refreshToken.fulfilled, (state) => {
        // Token refreshed successfully, no state change needed
      })
      .addCase(refreshToken.rejected, (state) => {
        // Refresh failed, logout user
        state.user = null;
        state.isAuthenticated = false;
        state.isAnonymous = false;
        userService.clearTokens();
      });
  },
});

export const { logout, setLoading, clearError, setInitialized, setMaintenanceMode } = authSlice.actions;
export default authSlice.reducer;