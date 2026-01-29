export function useAnalytics() {
    const { user, isAnonymous } = useSelector((state) => state.auth);
  
    const trackEvent = (eventName, properties = {}) => {
      // Add your analytics provider here (Google Analytics, Mixpanel, etc.)
      if (window.gtag) {
        window.gtag('event', eventName, {
          user_id: user?.id,
          is_anonymous: isAnonymous,
          ...properties,
        });
      }
    };
  
    const trackPageView = (pageName) => {
      if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: pageName,
        });
      }
    };
  
    return { trackEvent, trackPageView };
  }