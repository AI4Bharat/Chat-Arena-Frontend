import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, loginAnonymously, setInitialized, setMaintenanceMode } from '../features/auth/store/authSlice';
import { ChatLayout } from '../features/chat/components/ChatLayout';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { SharedSessionView } from '../features/chat/components/SharedSessionView';
import { PrivacyPolicyPage, TermsOfServicePage, MaintenancePage } from '../features/legal/components';
import { Loading } from '../shared/components/Loading';
import { AsrLayout } from '../features/asr/components/AsrLayout';
import { TtsLayout } from '../features/tts/components/TtsLayout';
import { useTenant } from '../shared/context/TenantContext';

// Wrapper that extracts tenant from URL and sets context
function TenantRoute({ children }) {
  const { tenant } = useParams();
  const { setTenant } = useTenant();

  useEffect(() => {
    if (tenant) {
      setTenant(tenant);
    }
    return () => setTenant(null); // Clear on unmount
  }, [tenant, setTenant]);

  return children;
}

export function AppRouter() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, initialized, user } = useSelector((state) => state.auth);
  const initStarted = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initialization attempts
      if (initStarted.current || initialized) {
        return;
      }

      initStarted.current = true;

      // Check for existing tokens with CORRECT names
      const accessToken = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');
      const refreshToken = localStorage.getItem('refresh_token');

      try {
        if (accessToken || refreshToken || anonymousToken) {
          // Try to fetch current user with existing token
          await dispatch(fetchCurrentUser()).unwrap();
        } else {
          // No tokens, create anonymous user
          await dispatch(loginAnonymously()).unwrap();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);

        const httpStatusCode = error.status || error.payload?.status || error.response?.status;
        const errorCode = error.code || error.payload?.code;
        const errorMessage = error.message || error?.toString();

        if (
          httpStatusCode === 503 || httpStatusCode === 500 ||
          errorCode === 'ERR_CONNECTION_REFUSED' ||
          errorMessage?.includes('ERR_CONNECTION_REFUSED') ||
          errorMessage?.includes('Network Error') ||
          errorMessage?.includes('Failed to fetch')
        ) {
          dispatch(setMaintenanceMode(true));
          dispatch(setInitialized());
          return;
        }

        // Only try to create anonymous if we don't have any tokens
        if (!accessToken && !anonymousToken && !refreshToken) {
          try {
            await dispatch(loginAnonymously()).unwrap();
          } catch (anonError) {
            console.error('Failed to create anonymous user:', anonError);
            // Mark as initialized even on failure to prevent loops
            dispatch(setInitialized());
          }
        } else {
          // We have tokens but they're invalid, just mark as initialized
          // User will need to manually sign in again
          dispatch(setInitialized());
        }
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - only run once

  // Show loading only during initial auth check
  if (!initialized && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/chat/:sessionId" element={<ChatLayout />} />
      <Route path="/leaderboard/chat" element={<ChatLayout />} />
      <Route path="/leaderboard/chat/:category" element={<ChatLayout />} />
      <Route path="/asr" element={<AsrLayout />} />
      <Route path="/asr/:sessionId" element={<AsrLayout />} />
      <Route path="/leaderboard/asr" element={<AsrLayout />} />
      <Route path="/leaderboard/asr/:category" element={<AsrLayout />} />
      <Route path="/tts" element={<TtsLayout />} />
      <Route path="/tts/:sessionId" element={<TtsLayout />} />
      <Route path="/leaderboard/tts" element={<TtsLayout />} />
      <Route path="/leaderboard/tts/:category" element={<TtsLayout />} />
      <Route path="/shared/:shareToken" element={<SharedSessionView />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/" element={<Navigate to="/chat" />} />
      <Route path="/:tenant/chat" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/chat/:sessionId" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/asr" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/asr/:sessionId" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/tts" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/tts/:sessionId" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/chat" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/chat/:category" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/asr" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/asr/:category" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/tts" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/tts/:category" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/shared/:shareToken" element={<TenantRoute><SharedSessionView /></TenantRoute>} />
    </Routes >
  );
}