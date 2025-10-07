import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, loginAnonymously, setLoading } from '../features/auth/store/authSlice';
import { ChatLayout } from '../features/chat/components/ChatLayout';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { SharedSessionView } from '../features/chat/components/SharedSessionView';
import { Loading } from '../shared/components/Loading';

export function AppRouter() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing tokens
      const authToken = localStorage.getItem('authToken');
      const anonymousToken = localStorage.getItem('anonymousToken');
      
      try {
        if (authToken || anonymousToken) {
          // Try to fetch current user with existing token
          await dispatch(fetchCurrentUser()).unwrap();
        } else {
          // No tokens, create anonymous user
          await dispatch(loginAnonymously()).unwrap();
        }
      } catch (error) {
        // Failed to authenticate with existing tokens, create anonymous user
        try {
          await dispatch(loginAnonymously()).unwrap();
        } catch (anonError) {
          console.error('Failed to create anonymous user:', anonError);
          dispatch(setLoading(false));
        }
      }
    };
    
    initializeAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/shared/:shareToken" element={<SharedSessionView />} />
      <Route path="/" element={<Navigate to="/chat" />} />
    </Routes>
  );
}