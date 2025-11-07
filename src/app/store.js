import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from '../features/auth/store/authSlice';
import chatReducer from '../features/chat/store/chatSlice';
import modelsReducer from '../features/models/store/modelsSlice';
import { setLogoutCallback } from '../shared/api/client';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    models: modelsReducer,
  },
});

// Set up the logout callback to break circular dependency
setLogoutCallback(() => {
  store.dispatch(logout());
});