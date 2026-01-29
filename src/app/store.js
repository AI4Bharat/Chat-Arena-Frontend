import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from '../features/auth/store/authSlice';
import llmChatReducer from '../features/chat/store/chatSlice';
import ttsChatReducer from '../features/tts/store/chatSlice';
import asrChatReducer from '../features/asr/store/chatSlice';
import modelsReducer from '../features/models/store/modelsSlice';
import { setLogoutCallback } from '../shared/api/client';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: llmChatReducer,
    ttsChat: ttsChatReducer,
    asrChat: asrChatReducer,
    models: modelsReducer,
  },
});

// Set up the logout callback to break circular dependency
setLogoutCallback(() => {
  store.dispatch(logout());
});