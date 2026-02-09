import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, loginAnonymously, setInitialized, setMaintenanceMode } from '../features/auth/store/authSlice';
import { ChatLayout } from '../features/chat/components/ChatLayout';
import { ChatLayoutAquarium } from '../features/chat/components/ChatLayoutAquarium';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { SharedSessionView } from '../features/chat/components/SharedSessionView';
import { PrivacyPolicyPage, TermsOfServicePage, MaintenancePage } from '../features/legal/components';
import { Loading } from '../shared/components/Loading';
import { AsrLayout } from '../features/asr/components/AsrLayout';
import { AsrLayoutAquarium } from '../features/asr/components/AsrLayoutAquarium';
import { AudioVisualization } from '../features/asr/components/AudioVisualization';
import { TtsLayout } from '../features/tts/components/TtsLayout';
import { TtsLayoutAquarium } from '../features/tts/components/TtsLayoutAquarium';
import { TtsAcademicLayout } from '../features/tts/components/TtsAcademicLayout';
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
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/chat" />} />

      {/* Legal pages */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* Shared session view */}
      <Route path="/shared/:shareToken" element={<SharedSessionView />} />

      {/* ========== CHAT ROUTES ========== */}
      {/* Standard Chat */}
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/chat/:sessionId" element={<ChatLayout />} />
      
      {/* Chat Leaderboard */}
      <Route path="/leaderboard/chat" element={<ChatLayout />} />
      <Route path="/leaderboard/chat/:category" element={<ChatLayout />} />

      {/* Aquarium Chat */}
      <Route path="/aquarium/chat" element={<ChatLayoutAquarium />} />
      <Route path="/aquarium/chat/:sessionId" element={<ChatLayoutAquarium />} />
      
      {/* Aquarium Chat Leaderboard */}
      <Route path="/aquarium/leaderboard/chat" element={<ChatLayoutAquarium />} />
      <Route path="/aquarium/leaderboard/chat/:category" element={<ChatLayoutAquarium />} />

      {/* ========== ASR ROUTES ========== */}
      {/* Standard ASR */}
      <Route path="/asr" element={<AsrLayout />} />
      <Route path="/asr/:sessionId" element={<AsrLayout />} />
      <Route path="/asr/synthetic/job/:jobId" element={<AudioVisualization />} />
      
      {/* ASR Leaderboard */}
      <Route path="/leaderboard/asr" element={<AsrLayout />} />
      <Route path="/leaderboard/asr/:category" element={<AsrLayout />} />

      {/* Aquarium ASR */}
      <Route path="/aquarium/asr" element={<AsrLayoutAquarium />} />
      <Route path="/aquarium/asr/:sessionId" element={<AsrLayoutAquarium />} />
      
      {/* Aquarium ASR Leaderboard */}
      <Route path="/aquarium/leaderboard/asr" element={<AsrLayoutAquarium />} />
      <Route path="/aquarium/leaderboard/asr/:category" element={<AsrLayoutAquarium />} />

      {/* ========== TTS ROUTES ========== */}
      {/* Standard TTS */}
      <Route path="/tts" element={<TtsLayout />} />
      <Route path="/tts/academic" element={<TtsAcademicLayout />} />
      <Route path="/tts/:sessionId" element={<TtsLayout />} />
      
      {/* TTS Leaderboard */}
      <Route path="/leaderboard/tts" element={<TtsLayout />} />
      <Route path="/leaderboard/tts/:category" element={<TtsLayout />} />
      
      {/* ========== TTS ROUTES ========== */}
      {/* Standard TTS */}
      <Route path="/aquarium/tts" element={<TtsLayoutAquarium />} />
      <Route path="/aquarium/tts/:sessionId" element={<TtsLayoutAquarium />} />
      
      {/* TTS Leaderboard */}
      <Route path="/aquarium/leaderboard/tts" element={<TtsLayoutAquarium />} />
      <Route path="/aquarium/leaderboard/tts/:category" element={<TtsLayoutAquarium />} />

      {/* ========== TENANT-SPECIFIC ROUTES ========== */}
      {/* Tenant Chat */}
      <Route path="/:tenant/chat" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/chat/:sessionId" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      
      {/* Tenant Chat Leaderboard */}
      <Route path="/:tenant/leaderboard/chat" element={<TenantRoute><ChatLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/chat/:category" element={<TenantRoute><ChatLayout /></TenantRoute>} />

      {/* Tenant Aquarium Chat */}
      <Route path="/:tenant/aquarium/chat" element={<TenantRoute><ChatLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/chat/:sessionId" element={<TenantRoute><ChatLayoutAquarium /></TenantRoute>} />

      {/* Tenant ASR */}
      <Route path="/:tenant/asr" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/asr/:sessionId" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/asr/synthetic/job/:jobId" element={<TenantRoute><AudioVisualization /></TenantRoute>} />
      
      {/* Tenant ASR Leaderboard */}
      <Route path="/:tenant/leaderboard/asr" element={<TenantRoute><AsrLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/asr/:category" element={<TenantRoute><AsrLayout /></TenantRoute>} />

      {/* Tenant Aquarium ASR */}
      <Route path="/:tenant/aquarium/asr" element={<TenantRoute><AsrLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/asr/:sessionId" element={<TenantRoute><AsrLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/leaderboard/asr" element={<TenantRoute><AsrLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/leaderboard/asr/:category" element={<TenantRoute><AsrLayoutAquarium /></TenantRoute>} />

      {/* Tenant TTS */}
      <Route path="/:tenant/tts" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/tts/academic" element={<TenantRoute><TtsAcademicLayout /></TenantRoute>} />
      <Route path="/:tenant/tts/:sessionId" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      
      {/* Tenant TTS Leaderboard */}
      <Route path="/:tenant/leaderboard/tts" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      <Route path="/:tenant/leaderboard/tts/:category" element={<TenantRoute><TtsLayout /></TenantRoute>} />
      
      {/* Tenant TTS */}
      <Route path="/:tenant/aquarium/tts" element={<TenantRoute><TtsLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/tts/:sessionId" element={<TenantRoute><TtsLayoutAquarium /></TenantRoute>} />
      
      {/* Tenant TTS Leaderboard */}
      <Route path="/:tenant/aquarium/leaderboard/tts" element={<TenantRoute><TtsLayoutAquarium /></TenantRoute>} />
      <Route path="/:tenant/aquarium/leaderboard/tts/:category" element={<TenantRoute><TtsLayoutAquarium /></TenantRoute>} />

      {/* Tenant Shared Session */}
      <Route path="/:tenant/shared/:shareToken" element={<TenantRoute><SharedSessionView /></TenantRoute>} />
    </Routes>
  );
}
