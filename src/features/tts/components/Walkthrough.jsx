import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';

export function Walkthrough() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowX: 0, arrowY: 0 });
  const autoOpenedSidebarRef = useRef(false);
  const { user } = useSelector((state) => state.auth);

  const steps = [
    {
      target: 'body',
      title: 'Welcome to TTS Arena! 🎉',
      content: (
        <div className="text-center space-y-3">
          <p className="text-gray-700 text-base leading-relaxed">
            Experience and compare the best <strong>Text-to-Speech</strong> models in <strong>Indian languages</strong>.
          </p>
          <p className="text-gray-600 text-sm">
            Let's take a quick tour to help you get started!
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="signin-banner"]',
      title: 'Sign in to save',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          You are in guest mode. Sign in to keep your sessions synced and avoid limits.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="tts-sidebar"]',
      title: 'Your Sidebar',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Access your TTS history, start a new session, or view the Leaderboard from here.
        </p>
      ),
      placement: 'right',
      avoidCovering: true,
    },
    {
      target: '[data-tour="tts-new-chat"]',
      title: 'Start a New Session',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Click here anytime to start a fresh TTS session with new text.
        </p>
      ),
      placement: 'right',
      avoidCovering: true,
    },
    {
      target: '[data-tour="tts-leaderboard-link"]',
      title: 'Check the Leaderboard',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          See which TTS models are performing the best based on user feedback and community votes.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="tts-mode-selector"]',
      title: 'Choose Your Mode',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Pick <strong>Direct Mode</strong> for one TTS model, <strong>Compare Models</strong> to compare two models of your choice, <strong>Random</strong> for anonymous models, or <strong>Academic Benchmarking</strong> to evaluate with standardized prompts.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="tts-message-input"]',
      title: 'Enter Your Text',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Type any text in <strong>Indian languages</strong> that you want to convert to speech. The AI models will generate audio for you to compare.
        </p>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="tts-language-selector"]',
      title: 'Select Language',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Choose your preferred Indian language for text-to-speech conversion. Different models support different languages.
        </p>
      ),
      placement: 'top',
      optional: true,
    },
  ];

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('has_seen_walkthrough_tts') === 'true';

    // If user has not completed walkthrough yet, start it immediately
    if (!hasSeenWalkthrough) {
      setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 800);
    }
  }, [user]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length && isActive) {
      const step = steps[currentStep];
      
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const needsSidebar = ['[data-tour="tts-sidebar"]', '[data-tour="tts-new-chat"]', '[data-tour="tts-leaderboard-link"]'].includes(step.target);

      // Auto-open sidebar on mobile for sidebar-related steps
      if (isMobile && needsSidebar) {
        openSidebarMobile();
      }

      // Skip steps whose targets aren't present (optional or missing in this layout)
      const element = document.querySelector(step.target);
      if (!element) {
        handleNext();
        return;
      }

      if (step.placement === 'center') {
        setTooltipPosition({ top: '50%', left: '50%' });
      } else {
        // Ensure target is visible, then position and re-position after a tick to reduce misalignment
        if (element && element.scrollIntoView) {
          element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
        }
        updateTooltipPosition(step.target, step.placement, step.avoidCovering);
        setTimeout(() => updateTooltipPosition(step.target, step.placement, step.avoidCovering), 60);
      }

      // Add resize listener to recalc position and avoid covering
      const handleResize = () => {
        if (step.placement !== 'center') {
          updateTooltipPosition(step.target, step.placement, step.avoidCovering);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Close sidebar if we auto-opened it and current step no longer needs it
    const prevAutoOpened = autoOpenedSidebarRef.current;
    if (prevAutoOpened) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const needsSidebar = currentStep >= 0 && currentStep < steps.length && ['[data-tour="tts-sidebar"]', '[data-tour="tts-new-chat"]', '[data-tour="tts-leaderboard-link"]'].includes(steps[currentStep].target);
      if (isMobile && !needsSidebar) {
        closeSidebarMobile();
        autoOpenedSidebarRef.current = false;
      }
    }
  }, [currentStep, isActive]);

  const openSidebarMobile = () => {
    const sidebar = document.querySelector('[data-tour="tts-sidebar"]');
    const isClosed = sidebar ? sidebar.className.includes('-translate-x-full') : true;
    const openBtn = document.querySelector('button[aria-label="Open sidebar"]');
    if (openBtn && isClosed) {
      openBtn.click();
      autoOpenedSidebarRef.current = true;
    }
  };

  const closeSidebarMobile = () => {
    // Find the mobile sidebar overlay
    const overlay = Array.from(document.querySelectorAll('div.fixed.inset-0')).find((el) => {
      const cls = el.className || '';
      return cls.includes('bg-black/30') && cls.includes('md:hidden');
    });

    if (overlay) {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  };

  const updateTooltipPosition = (selector, placement, avoidCovering = false) => {
    const element = document.querySelector(selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Tooltip sizing and spacing
    const isMobile = window.innerWidth < 768;
    const maxWidth = isMobile ? 384 : 448;
    const tooltipWidth = Math.min(window.innerWidth * 0.92, maxWidth);
    
    const tooltipHeight = 230;
    const padding = 16;
    const offset = avoidCovering ? 32 : 14;

    const banner = document.querySelector('[data-tour="signin-banner"]');
    const safeTop = banner ? banner.getBoundingClientRect().height + padding : padding;

    let top = 0;
    let left = 0;
    const forceRightPlacement = selector === '[data-tour="tts-mode-selector"]' && window.innerWidth >= 768;
    const currentPlacement = forceRightPlacement ? 'right' : placement;

    switch (currentPlacement) {
      case 'bottom':
        top = rect.bottom + scrollY + offset;
        left = rect.left + scrollX + rect.width / 2;
        if (selector === '[data-tour="tts-mode-selector"]') {
          const isMobileView = window.innerWidth < 768;
          if (!isMobileView) {
            top = rect.bottom + scrollY + 20;
          }
        }
        break;
      case 'top':
        top = rect.top + scrollY - tooltipHeight - offset;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + scrollX + offset;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
        left = rect.left + scrollX - tooltipWidth - offset;
        break;
      default:
        break;
    }

    // Boundary detection and adjustment
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left - tooltipWidth / 2 < padding) {
      left = tooltipWidth / 2 + padding;
    }

    if (left + tooltipWidth / 2 > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth / 2 - padding;
    }

    if (top < safeTop + scrollY) {
      top = Math.max(rect.bottom + scrollY + offset, safeTop + scrollY);
    }

    const isModeDesktop = selector === '[data-tour="tts-mode-selector"]' && window.innerWidth >= 768;
    if (top + tooltipHeight > viewportHeight + scrollY - padding) {
      if (!isModeDesktop) {
        top = rect.top + scrollY - tooltipHeight - offset;
      }
    }

    // If still overlapping vertically with target, push further away
    const targetTop = rect.top + scrollY;
    const targetBottom = rect.bottom + scrollY;
    const tooltipBottom = top + tooltipHeight;
    const verticalOverlap = !(tooltipBottom < targetTop || top > targetBottom);
    if (verticalOverlap) {
      if (currentPlacement === 'bottom') {
        top = targetBottom + offset + 12;
      } else if (currentPlacement === 'top') {
        top = targetTop - tooltipHeight - offset - 12;
      }
    }

    // Calculate arrow offsets
    const targetCenterX = rect.left + scrollX + rect.width / 2;
    const targetCenterY = rect.top + scrollY + rect.height / 2;
    
    const tooltipCenterX = left;
    const tooltipCenterY = top + tooltipHeight / 2;
    
    let arrowX = targetCenterX - tooltipCenterX;
    let arrowY = targetCenterY - tooltipCenterY;
    
    const edgePadding = 24; 
    const maxArrowX = tooltipWidth / 2 - edgePadding;
    const maxArrowY = tooltipHeight / 2 - edgePadding;
    
    arrowX = Math.max(-maxArrowX, Math.min(maxArrowX, arrowX));
    arrowY = Math.max(-maxArrowY, Math.min(maxArrowY, arrowY));

    setTooltipPosition({ top, left, arrowX, arrowY, orientation: currentPlacement });
  };

  const handleNext = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isLeaderboardStep = currentStep === 4; // index of leaderboard-link step
    if (isMobile && isLeaderboardStep) {
      closeSidebarMobile();
      autoOpenedSidebarRef.current = false;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('has_seen_walkthrough_tts', 'true');
    closeSidebarMobile();
    autoOpenedSidebarRef.current = false;
    setIsActive(false);
    setCurrentStep(-1);
  };

  if (!isActive || currentStep < 0) return null;

  const step = steps[currentStep];
  const isCentered = step.placement === 'center';
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const orientation = tooltipPosition.orientation || step.placement;
  const forceCenteredArrow =
    !isCentered &&
    isDesktop &&
    orientation === 'bottom' &&
    (step.target === '[data-tour="tts-mode-selector"]' || step.target === '[data-tour="tts-leaderboard-link"]');
  const arrowXOffset = forceCenteredArrow ? 0 : tooltipPosition.arrowX || 0;
  const arrowYOffset = forceCenteredArrow ? 0 : tooltipPosition.arrowY || 0;

  return (
    <>
      {/* Overlay with soft blur */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9998] transition-opacity"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Spotlight effect on target element */}
      {!isCentered && step.target !== 'body' && (
        <style>
          {`
            [data-tour="${step.target.replace('[data-tour="', '').replace('"]', '')}"] {
              position: relative;
              z-index: 9999 !important;
              box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.6), 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
            }
          `}
        </style>
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[10000] bg-white rounded-xl border-2 border-orange-500 transition-all duration-200 ${
          isCentered
            ? 'transform -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md'
            : step.target === '[data-tour="tts-mode-selector"]' && window.innerWidth >= 768
              ? 'transform -translate-x-1/2 w-96'
              : 'transform -translate-x-1/2 w-[92%] max-w-sm md:max-w-md'
        }`}
        style={{
          ...(isCentered
            ? { top: tooltipPosition.top, left: tooltipPosition.left }
            : { top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px` }),
        }}
      >
        {/* Arrow */}
        {!isCentered && (
          <div
            className="absolute w-3 h-3 bg-white rotate-45 border-2 border-orange-500"
            style={{
              top: orientation === 'bottom' ? -7 : orientation === 'top' ? 'auto' : `calc(50% + ${arrowYOffset}px)`,
              bottom: orientation === 'top' ? -7 : 'auto',
              left: orientation === 'right' ? -7 : orientation === 'left' ? 'auto' : `calc(50% + ${arrowXOffset}px)`,
              right: orientation === 'left' ? -7 : 'auto',
              transform: orientation === 'left' || orientation === 'right' ? 'translateY(-50%) rotate(45deg)' : 'translateX(-50%) rotate(45deg)',
            }}
          />
        )}

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close walkthrough"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 pr-6">{step.title}</h3>
          <div className="text-sm leading-relaxed text-gray-700">{step.content}</div>

          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index === currentStep ? 'bg-orange-600' : index < currentStep ? 'bg-orange-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
