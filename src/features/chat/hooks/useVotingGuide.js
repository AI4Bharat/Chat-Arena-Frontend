import { useState, useCallback } from 'react';

export function useVotingGuide() {
  const [showVotingGuide, setShowVotingGuide] = useState(false);

  // Check if user has seen the voting guide
  const hasSeenVotingGuide = useCallback(() => {
    return localStorage.getItem('voting_guide_seen_llm') === 'true';
  }, []);

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return window.innerWidth < 640; // sm breakpoint in Tailwind
  }, []);

  // Show voting guide for first-time users
  const checkAndShowVotingGuide = useCallback(() => {
    // Only show if user hasn't seen it before AND is on mobile
    const hasSeenGuide = localStorage.getItem('voting_guide_seen_llm') === 'true';
    
    if (!hasSeenGuide && !showVotingGuide && isMobile()) {
      setShowVotingGuide(true);
      return true;
    }
    return false;
  }, [showVotingGuide, isMobile]);

  // Mark voting guide as seen
  const markVotingGuideAsSeen = useCallback(() => {
    localStorage.setItem('voting_guide_seen_llm', 'true');
    localStorage.setItem('voting_guide_seen_llm_timestamp', new Date().toISOString());
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
    // Only show guide on mobile devices
    if (isMobile()) {
      setShowVotingGuide(true);
    }
  }, [isMobile]);

  return {
    showVotingGuide,
    hasSeenVotingGuide: hasSeenVotingGuide(),
    checkAndShowVotingGuide,
    handleGotIt,
    handleClose,
    showGuide,
  };
}