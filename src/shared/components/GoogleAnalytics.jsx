import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const GA_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;
if (GA_ID) {
  ReactGA.initialize(GA_ID);
}

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_ID) {
      ReactGA.send({ 
        hitType: "pageview", 
        page: location.pathname + location.search 
      });
    }
  }, [location]);

  return null;
};

export default GoogleAnalytics;