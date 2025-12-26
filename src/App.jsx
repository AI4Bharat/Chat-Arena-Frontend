import { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { queryClient } from './app/queryClient';
import { AppRouter } from './app/router';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { fetchCurrentUser, loginAnonymously } from './features/auth/store/authSlice';
import { TenantProvider } from './shared/context/TenantContext';
import './styles/globals.css';

// Auth initialization component
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user, initialized } = useSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initialized) {
      setIsInitializing(false);
      return;
    }

    const initAuth = async () => {
      // Check if user has any token
      const accessToken = localStorage.getItem('access_token');
      const anonymousToken = localStorage.getItem('anonymous_token');

      if (accessToken || anonymousToken) {
        // Try to fetch current user
        try {
          await dispatch(fetchCurrentUser()).unwrap();
        } catch (error) {
          console.log('No valid session found:', error);

          // Clear any invalid tokens to prevent retry loops
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');

          // Create anonymous user only if we don't already have one
          if (!anonymousToken) {
            try {
              await dispatch(loginAnonymously()).unwrap();
            } catch (anonError) {
              console.error('Failed to create anonymous session:', anonError);
            }
          }
        }
      } else {
        // No tokens at all, create anonymous user
        try {
          await dispatch(loginAnonymously()).unwrap();
        } catch (error) {
          console.error('Failed to create anonymous session:', error);
        }
      }

      setIsInitializing(false);
    };

    initAuth();
  }, [dispatch, initialized]);

  // Show loading screen during initial auth check
  if (isInitializing || (loading && !user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <HashRouter>
            <TenantProvider>
              <AuthInitializer>
                <AppRouter />
              </AuthInitializer>
            </TenantProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#065f46',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#7f1d1d',
                  },
                },
                loading: {
                  style: {
                    background: '#1e40af',
                  },
                },
              }}
            />
            <ReactQueryDevtools initialIsOpen={false} />
          </HashRouter>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;