import { useState, useCallback } from 'react';

export function useVotingGuide() {
  const [showVotingGuide, setShowVotingGuide] = useState(false);

  // Check if user has seen the voting guide
  const hasSeenVotingGuide = useCallback(() => {
    return localStorage.getItem('voting_guide_seen') === 'true';
  }, []);

  // Show voting guide for first-time users
  const checkAndShowVotingGuide = useCallback(() => {
    // Only show if user hasn't seen it before
    const hasSeenGuide = localStorage.getItem('voting_guide_seen') === 'true';
    
    if (!hasSeenGuide && !showVotingGuide) {
      setShowVotingGuide(true);
      return true;
    }
    return false;
  }, [showVotingGuide]);

  // Mark voting guide as seen
  const markVotingGuideAsSeen = useCallback(() => {
    localStorage.setItem('voting_guide_seen', 'true');
    localStorage.setItem('voting_guide_seen_timestamp', new Date().toISOString());
  }, []);

  // Handle user clicking "Got it"
  const handleGotIt = useCallback(() => {
    markVotingGuideAsSeen();
    setShowVotingGuide(false);
  }, [markVotingGuideAsSeen]);

  // Handle manual close (X button)
  const handleClose = useCallback(() => {
    markVotingGuideAsSeen();
    setShowVotingGuide(false);
  }, [markVotingGuideAsSeen]);

  // Manually trigger voting guide (for help buttons, etc.)
  const showGuide = useCallback(() => {
    setShowVotingGuide(true);
  }, []);

  return {
    showVotingGuide,
    hasSeenVotingGuide: hasSeenVotingGuide(),
    checkAndShowVotingGuide,
    handleGotIt,
    handleClose,
    showGuide,
  };
}