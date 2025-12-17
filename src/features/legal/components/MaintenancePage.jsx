import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Mail,
  ArrowLeft,
  Server,
  CheckCircle,
  BotMessageSquare
} from 'lucide-react';

const MaintenancePage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        {/* <div className="mb-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
        </div> */}

        {/* Main Maintenance Card */}
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center">

          <div className="flex items-center justify-center gap-3 mb-4">
            <BotMessageSquare className="w-10 h-10 text-orange-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-grey-900">
              Indic LLM Arena
            </h2>
          </div>
          {/* Icon and Animation */}
          <div className="my-8">
            <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32">
              <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse"></div>
              <div className="relative bg-orange-600 rounded-full w-full h-full flex items-center justify-center">
                <Wrench className="text-white w-12 h-12 md:w-16 md:h-16 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-orange-800 to-orange-900 mb-4">
            We'll Be Back Soon!
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Indic LLM Arena is currently undergoing scheduled maintenance to improve your experience. 
            We're working hard to get everything back online as quickly as possible.
          </p>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <Server className="text-orange-600 w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Server Status</h3>
              <p className="text-sm text-gray-600">Updating</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <Clock className="text-blue-600 w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Estimated Time</h3>
              <p className="text-sm text-gray-600">15-30 minutes</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <CheckCircle className="text-green-600 w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Data Safety</h3>
              <p className="text-sm text-gray-600">100% Secure</p>
            </div>
          </div>

          {/* What's Happening */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
              <AlertCircle className="text-blue-600 w-5 h-5" />
              What's happening?
            </h3>
            <ul className="text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Upgrading our AI models for better performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Implementing security enhancements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Optimizing server infrastructure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Adding new features based on your feedback</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <RefreshCw size={20} />
              Refresh Page
            </button>
            
            <a
              href="mailto:arena@ai4bharat.org"
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Mail size={20} />
              Contact Support
            </a>
          </div>

          {/* Thank You Message */}
          <div className="border-t pt-6">
            <p className="text-gray-600 mb-4">
              Thank you for your patience while we make Indic LLM Arena even better!
            </p>
            
            {/* Links to Legal Pages */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <button
                onClick={() => navigate('/privacy')}
                className="text-orange-600 hover:text-orange-800 transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => navigate('/terms')}
                className="text-orange-600 hover:text-orange-800 transition-colors"
              >
                Terms of Service
              </button>
              <span className="text-gray-300">|</span>
              <a
                href="https://ai4bharat.iitm.ac.in/"
                className="text-orange-600 hover:text-orange-800 transition-colors" target='_blank'
              >
                About Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MaintenancePage };