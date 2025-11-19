import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, loginAnonymously, setInitialized, setMaintenanceMode } from '../features/auth/store/authSlice';
import { ChatLayout } from '../features/chat/components/ChatLayout';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { SharedSessionView } from '../features/chat/components/SharedSessionView';
import { PrivacyPolicyPage, TermsOfServicePage, MaintenancePage } from '../features/legal/components';
import { Loading } from '../shared/components/Loading';

export function AppRouter() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, initialized, isUnderMaintenance } = useSelector((state) => state.auth);
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
        
        if (httpStatusCode === 503 || httpStatusCode === 500) {
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

  if (initialized && isUnderMaintenance) {
    return (
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="*" element={<MaintenancePage />} /> 
      </Routes>
    );
  }
  
  return (
    <Routes>
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/chat/:sessionId" element={<ChatLayout />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/leaderboard/:category" element={<ChatLayout />} />
      <Route path="/shared/:shareToken" element={<SharedSessionView />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/" element={<Navigate to="/chat" />} />
    </Routes>
  );
} 