import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import { updatePreferences } from '../../auth/store/authSlice';

export function usePrivacyConsent() {
  const dispatch = useDispatch();
  const { user, isAnonymous } = useSelector((state) => state.auth);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [pendingCallback, setPendingCallback] = useState(null);

  // Check if user has already given consent
  const hasGivenConsent = useCallback(() => {
    // For registered users, assume consent is given during registration
    // if (!isAnonymous) return true;
    
    // For anonymous users, check localStorage first (immediate)
    const localConsent = localStorage.getItem('privacy_consent_given');
    if (localConsent === 'true') return true;
    return false;
    
    // Also check user preferences (if available)
    // return user?.preferences?.privacy_consent_given === true;
  }, [isAnonymous, user]);

  // Store consent decision
  const storeConsentDecision = useCallback(async (accepted) => {
    // Store in localStorage immediately for instant access
    localStorage.setItem('privacy_consent_given', accepted.toString());
    // localStorage.setItem('privacy_consent_timestamp', new Date().toISOString());
    
    // For anonymous users, also store in user preferences
    // if (isAnonymous && user) {
    //   try {
    //     await dispatch(updatePreferences({
    //       preferences: {
    //         ...user.preferences,
    //         privacy_consent_given: accepted,
    //         privacy_consent_timestamp: new Date().toISOString()
    //       }
    //     }));
    //   } catch (error) {
    //     console.error('Failed to update privacy consent in preferences:', error);
    //     // Continue anyway since localStorage is stored
    //   }
    // }
  }, [isAnonymous, user, dispatch]);

  // Check consent before sending message
  const checkConsentBeforeSending = useCallback((message, onContinue) => {
    if (hasGivenConsent()) {
      // User has already given consent, proceed immediately
      onContinue();
      return;
    }

    // User hasn't given consent, show modal
    setPendingMessage(message);
    setPendingCallback(() => onContinue);
    setShowConsentModal(true);
  }, [hasGivenConsent]);

  // Handle consent acceptance
  const handleAcceptConsent = useCallback(async () => {
    await storeConsentDecision(true);
    setShowConsentModal(false);
    
    // Execute the pending callback (send the message)
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
      setPendingMessage(null);
    }
  }, [storeConsentDecision, pendingCallback]);

  // Handle consent decline
  const handleDeclineConsent = useCallback(async () => {
    await storeConsentDecision(false);
    setShowConsentModal(false);
    
    // Clear pending message/callback without executing
    setPendingCallback(null);
    setPendingMessage(null);
  }, [storeConsentDecision]);

  return {
    hasGivenConsent: hasGivenConsent(),
    showConsentModal,
    checkConsentBeforeSending,
    handleAcceptConsent,
    handleDeclineConsent,
    pendingMessage
  };
}