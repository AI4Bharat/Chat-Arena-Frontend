import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle, loginWithPhone, loginAnonymously } from '../store/authSlice';
import { X, Shield, Clock, User, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../shared/api/client';
import { endpoints } from '../../../shared/api/endpoints';
import { PhoneAuth } from './PhoneAuth';

export const fetchSessionsLLM = createAsyncThunk(
  'chat/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_llm);
    return response.data;
  }
);

export const fetchSessionsASR = createAsyncThunk(
  'chat/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_asr);
    return response.data;
  }
);

export const fetchSessionsTTS = createAsyncThunk(
  'chat/fetchSessions',
  async () => {
    const response = await apiClient.get(endpoints.sessions.list_tts);
    return response.data;
  }
);

// Initialize Firebase (do this once in your app)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export function AuthModal({ isOpen, onClose, session_type="LLM" }) {
  const dispatch = useDispatch();
  const { loading, isAnonymous, error } = useSelector((state) => state.auth);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // Use Firebase's signInWithPopup
      const result = await signInWithPopup(auth, googleProvider);

      // Get the ID token
      const idToken = await result.user.getIdToken();

      // Send to backend
      await dispatch(loginWithGoogle(idToken)).unwrap();

      if (session_type === "ASR") {
        dispatch(fetchSessionsASR());
      } else if (session_type === "TTS") {
        dispatch(fetchSessionsTTS());
      } else {
        dispatch(fetchSessionsLLM());
      }

      toast.success('Successfully signed in with Google!');
      onClose();

    } catch (error) {
      console.error('Google sign in error:', error);

      // Handle specific Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePhoneAuthSuccess = async (idToken, displayName) => {
    try {
      await dispatch(loginWithPhone({ idToken, displayName })).unwrap();

      if (session_type === "ASR") {
        dispatch(fetchSessionsASR());
      } else if (session_type === "TTS") {
        dispatch(fetchSessionsTTS());
      } else {
        dispatch(fetchSessionsLLM());
      }

      toast.success('Successfully signed in with Phone!');
      setShowPhoneAuth(false);
      onClose();
    } catch (error) {
      console.error('Phone login error:', error);
      toast.error('Phone login failed');
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await dispatch(loginAnonymously()).unwrap();
      toast.success('Continuing as guest');
      onClose();
    } catch (error) {
      console.error('Anonymous login error:', error);
      toast.error('Failed to continue as guest');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <User size={26} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isAnonymous ? 'Sign in Now' : 'Sign in to unlock all features'}
            </h2>
            <p className="text-sm text-gray-500">
              Get persistent chat history and access to all models
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="text-orange-500" size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">Permanent chat history</p>
                <p className="text-xs text-gray-500">Your conversations are saved forever</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-orange-500" size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">Unlimited access</p>
                <p className="text-xs text-gray-500">No message or session limits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-orange-500" size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">Account security</p>
                <p className="text-xs text-gray-500">Secure login with Google or Phone</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign In Buttons */}
          {!showPhoneAuth ? (
            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading || isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || isSigningIn) ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#fff"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#fff"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#fff"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#fff"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-medium">Continue with Google</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPhoneAuth(true)}
                disabled={loading || isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-700 font-medium">Continue with Phone</span>
              </button>

              {isAnonymous && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  Your current session will be transferred to your account
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <PhoneAuth
                onSuccess={handlePhoneAuthSuccess}
                onCancel={() => setShowPhoneAuth(false)}
              />
            </div>
          )}

          {/* Continue as guest */}
          {!isAnonymous && (
            <button
              onClick={handleContinueAsGuest}
              disabled={loading}
              className="w-full mt-4 text-sm text-gray-500 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue as guest
            </button>
          )}
        </div>
      </div>
    </>
  );
}