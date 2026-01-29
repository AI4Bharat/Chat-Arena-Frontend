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
      title: 'Welcome to Chat Arena! 🎉',
      content: (
        <div className="text-center space-y-3">
          <p className="text-gray-700 text-base leading-relaxed">
            Experience and compare the best AI models in <strong>Indian languages</strong>.
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
          You are in guest mode. Sign in to keep your conversations synced and avoid limits.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="sidebar"]',
      title: 'Your Sidebar',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Access your chat history, start a new session, or view the Leaderboard from here.
        </p>
      ),
      placement: 'right',
      avoidCovering: true,
    },
    {
      target: '[data-tour="new-chat"]',
      title: 'Start a New Chat',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Click here anytime to start a fresh conversation with AI models.
        </p>
      ),
      placement: 'right',
      avoidCovering: true,
    },
    {
      target: '[data-tour="leaderboard-link"]',
      title: 'Check the Leaderboard',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          See which models are performing the best based on user feedback and community votes.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="mode-selector"]',
      title: 'Choose Your Mode',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Pick <strong>Random Mode</strong> to compare anonymous models, <strong>Direct Chat</strong> for one model, or <strong>Compare Models</strong> to pit two models side-by-side.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
    },
    {
      target: '[data-tour="model-selector"]',
      title: 'Select AI Models',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Choose the AI models you want to test. In Arena mode, pick two different models to compare their responses.
        </p>
      ),
      placement: 'bottom',
      avoidCovering: true,
      optional: true,
    },
    {
      target: '[data-tour="message-input"]',
      title: 'Start Chatting',
      content: (
        <p className="text-gray-700 text-sm leading-relaxed">
          Type your prompt here in <strong>any Indian language</strong>. You can ask questions, request translations, or just chat naturally.
        </p>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="language-selector"]',
      title: 'Language Support',
      content: (
        <div className="space-y-2">
          <p className="text-gray-700 text-sm leading-relaxed">
            Click the translate icon and select your preferred Indian language for transliteration support.
          </p>
          <p className="text-orange-600 text-sm leading-relaxed font-medium">
            ⚠️ Important: If you plan to use voice typing, make sure to select your language here first!
          </p>
        </div>
      ),
      placement: 'top',
      optional: true,
    },
    {
      target: '[data-tour="message-actions"]',
      title: 'Voice, Attach, Send',
      content: (
        <div className="space-y-2">
          <p className="text-gray-700 text-sm leading-relaxed">
            Use voice input, attach images (coming soon), or send your message. Icons stay handy on desktop and mobile.
          </p>
          <p className="text-orange-600 text-sm leading-relaxed font-medium">
            💡 Tip: Select your language from the translate icon before using voice typing for accurate transcription!
          </p>
        </div>
      ),
      placement: 'top',
      avoidCovering: true,
    },
  ];

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('has_seen_walkthrough') === 'true';

    // If user has not completed walkthrough yet, start it immediately (regardless of consent)
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
      const needsSidebar = ['[data-tour="sidebar"]', '[data-tour="new-chat"]', '[data-tour="leaderboard-link"]'].includes(step.target);

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
      const needsSidebar = currentStep >= 0 && currentStep < steps.length && ['[data-tour="sidebar"]', '[data-tour="new-chat"]', '[data-tour="leaderboard-link"]'].includes(steps[currentStep].target);
      if (isMobile && !needsSidebar) {
        closeSidebarMobile();
        autoOpenedSidebarRef.current = false;
      }
    }
  }, [currentStep, isActive]);

  const openSidebarMobile = () => {
    const sidebar = document.querySelector('[data-tour="sidebar"]');
    const isClosed = sidebar ? sidebar.className.includes('-translate-x-full') : true;
    const openBtn = document.querySelector('button[aria-label="Open sidebar"]');
    if (openBtn && isClosed) {
      openBtn.click();
      autoOpenedSidebarRef.current = true;
    }
  };

  const closeSidebarMobile = () => {
    // Find the mobile sidebar overlay without relying on invalid selector characters
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
    const maxWidth = isMobile ? 384 : 448; // max-w-sm vs max-w-md
    const tooltipWidth = Math.min(window.innerWidth * 0.92, maxWidth);

    const tooltipHeight = 230; // approximate height
    const padding = 16; // viewport padding
    const offset = avoidCovering ? 32 : 14; // extra gap when we must not cover the target

    const banner = document.querySelector('[data-tour="signin-banner"]');
    const safeTop = banner ? banner.getBoundingClientRect().height + padding : padding;

    let top = 0;
    let left = 0;
    const forceRightPlacement = selector === '[data-tour="mode-selector"]' && window.innerWidth >= 768;
    const currentPlacement = forceRightPlacement ? 'right' : placement;

    switch (currentPlacement) {
      case 'bottom':
        top = rect.bottom + scrollY + offset;
        left = rect.left + scrollX + rect.width / 2;
        // For mode selector on desktop, ensure card is clearly below the button
        if (selector === '[data-tour="mode-selector"]') {
          const isMobileView = window.innerWidth < 768;
          if (!isMobileView) {
            top = rect.bottom + scrollY + 20; // Add extra space on desktop
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

    // Boundary detection and adjustment (also reduce overlap with target)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check left boundary (tooltip going off left edge)
    if (left - tooltipWidth / 2 < padding) {
      left = tooltipWidth / 2 + padding;
    }

    // Check right boundary (tooltip going off right edge)
    if (left + tooltipWidth / 2 > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth / 2 - padding;
    }

    // Check top boundary
    if (top < safeTop + scrollY) {
      top = Math.max(rect.bottom + scrollY + offset, safeTop + scrollY);
    }

    // Check bottom boundary
    const isModeDesktop = selector === '[data-tour="mode-selector"]' && window.innerWidth >= 768;
    if (top + tooltipHeight > viewportHeight + scrollY - padding) {
      // For mode selector on desktop, don't move to top - keep it below and let it scroll into view
      if (!isModeDesktop) {
        top = rect.top + scrollY - tooltipHeight - offset; // Move to top if too low
      }
    }

    // If still overlapping vertically with target (e.g., tall tooltip), push further away
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

    // Calculate arrow offsets to point to target center even if tooltip is shifted
    const targetCenterX = rect.left + scrollX + rect.width / 2;
    const targetCenterY = rect.top + scrollY + rect.height / 2;

    const tooltipCenterX = left; // left is center due to transform
    const tooltipCenterY = top + tooltipHeight / 2; // top is top edge

    let arrowX = targetCenterX - tooltipCenterX;
    let arrowY = targetCenterY - tooltipCenterY;

    // Clamp arrow to keep it within tooltip rounded corners
    const edgePadding = 24;
    const maxArrowX = tooltipWidth / 2 - edgePadding;
    const maxArrowY = tooltipHeight / 2 - edgePadding;

    arrowX = Math.max(-maxArrowX, Math.min(maxArrowX, arrowX));
    arrowY = Math.max(-maxArrowY, Math.min(maxArrowY, arrowY));

    setTooltipPosition({ top, left, arrowX, arrowY, orientation: currentPlacement });
  };

  const handleNext = () => {
    // On mobile, after the leaderboard card, close sidebar before moving on
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isLeaderboardStep = currentStep === 5; // index of leaderboard-link step
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
    localStorage.setItem('has_seen_walkthrough', 'true');
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
    (step.target === '[data-tour="mode-selector"]' || step.target === '[data-tour="leaderboard-link"]');
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
        className={`fixed z-[10000] bg-white rounded-xl border-2 border-orange-500 transition-all duration-200 ${isCentered
            ? 'transform -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md'
            : step.target === '[data-tour="mode-selector"]' && window.innerWidth >= 768
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
                className={`h-1.5 flex-1 rounded-full transition-colors ${index === currentStep ? 'bg-orange-600' : index < currentStep ? 'bg-orange-300' : 'bg-gray-200'
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
