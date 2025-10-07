import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';

export const fetchModels = createAsyncThunk(
  'models/fetchModels',
  async () => {
    const response = await apiClient.get(endpoints.models.list);
    return response.data;
  }
);

export const testModel = createAsyncThunk(
  'models/testModel',
  async ({ modelId, prompt }) => {
    const response = await apiClient.post(endpoints.models.test(modelId), { prompt });
    return response.data;
  }
);

const modelsSlice = createSlice({
  name: 'models',
  initialState: {
    models: [],
    loading: false,
    error: null,
    testResults: {},
  },
  reducers: {
    clearTestResults: (state) => {
      state.testResults = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(testModel.fulfilled, (state, action) => {
        state.testResults[action.meta.arg.modelId] = action.payload;
      });
  },
});

export const { clearTestResults } = modelsSlice.actions;
export default modelsSlice.reducer;