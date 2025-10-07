import { useSelector, useDispatch } from 'react-redux';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { updatePreferences } from '../../auth/store/authSlice';
import { userService } from '../../auth/services/userService';

export function useGuestLimitations() {
  const dispatch = useDispatch();
  const { user, isAnonymous } = useSelector((state) => state.auth);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  const limits = userService.checkGuestLimits(user);

  const checkMessageLimit = useCallback(() => {
    if (!isAnonymous) return true;
    
    if (!limits.canSendMessage) {
      toast.error('Guest users are limited to 20 messages. Sign in for unlimited access.');
      setShowAuthPrompt(true);
      return false;
    }
    
    // Show warning at 80% usage
    if (limits.messageCount >= 16) {
      toast.warning(`You have ${20 - limits.messageCount} messages remaining as a guest.`);
    }
    
    return true;
  }, [isAnonymous, limits]);

  const checkSessionLimit = useCallback(() => {
    if (!isAnonymous) return true;
    
    if (!limits.canCreateSession) {
      toast.error('Guest users are limited to 3 sessions. Sign in for unlimited access.');
      setShowAuthPrompt(true);
      return false;
    }
    
    return true;
  }, [isAnonymous, limits]);

  const incrementMessageCount = useCallback(async () => {
    if (isAnonymous && user) {
      const newCount = (user.preferences?.message_count || 0) + 1;
      
      // Update local state
      await dispatch(updatePreferences({
        preferences: {
          ...user.preferences,
          message_count: newCount
        }
      }));
    }
  }, [isAnonymous, user, dispatch]);

  const incrementSessionCount = useCallback(async () => {
    if (isAnonymous && user) {
      const newCount = (user.preferences?.session_count || 0) + 1;
      
      // Update local state
      await dispatch(updatePreferences({
        preferences: {
          ...user.preferences,
          session_count: newCount
        }
      }));
    }
  }, [isAnonymous, user, dispatch]);

  return {
    isGuest: isAnonymous,
    ...limits,
    checkMessageLimit,
    checkSessionLimit,
    incrementMessageCount,
    incrementSessionCount,
    showAuthPrompt,
    setShowAuthPrompt,
  };
}