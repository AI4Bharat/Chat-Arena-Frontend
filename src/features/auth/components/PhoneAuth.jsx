import { useState, useEffect } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../../config/firebase';
import { updateProfile } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export function PhoneAuth({ onSuccess, onCancel }) {
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
    // Initialize reCAPTCHA verifier on component mount
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
    }

    // Cleanup
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    const fullPhoneNumber = countryCode + phoneNumber;

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (error) {
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        toast.error('SMS quota exceeded. Please use a test phone number or try again later.');
      } else if (error.message && error.message.includes('INVALID_APP_CREDENTIAL')) {
        toast.error('Firebase configuration error. Please contact support.');
      } else {
        toast.error(`Failed to send OTP: ${error.message || 'Unknown error'}`);
      }

      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        setRecaptchaVerifier(newVerifier);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // Check if this is a new user or existing user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

      if (result.user.displayName && !isNewUser) {
        onSuccess(idToken, result.user.displayName);
      } else {
        setStep('displayName');
        window.phoneAuthToken = idToken;
      }
    } catch (error) {
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP expired. Please request a new one.');
        setStep('phone');
      } else {
        toast.error('Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDisplayName = async (e) => {
    e.preventDefault();

    if (!displayName || displayName.trim().length < 2) {
      toast.error('Display name must be at least 2 characters');
      return;
    }

    const idToken = window.phoneAuthToken;
    if (!idToken) {
      toast.error('Session expired. Please try again.');
      setStep('phone');
      return;
    }

    setLoading(true);

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim()
        });
      }

      onSuccess(idToken, displayName.trim());

      delete window.phoneAuthToken;
    } catch (error) {
      onSuccess(idToken, displayName.trim());
      delete window.phoneAuthToken;
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'displayName') {
      setStep('otp');
      setDisplayName('');
    }
  };

  return (
    <div className="space-y-4">
      <div id="recaptcha-container"></div>

      {step === 'phone' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex space-x-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={loading}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+65">+65 (SG)</option>
                <option value="+971">+971 (AE)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+49">+49 (DE)</option>
                <option value="+33">+33 (FR)</option>
                <option value="+81">+81 (JP)</option>
                <option value="+86">+86 (CN)</option>
                <option value="+82">+82 (KR)</option>
                <option value="+60">+60 (MY)</option>
                <option value="+64">+64 (NZ)</option>
                <option value="+31">+31 (NL)</option>
                <option value="+46">+46 (SE)</option>
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter phone number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={loading}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter your phone number without country code
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const newOtp = otp.split('');

                    newOtp[index] = value;
                    setOtp(newOtp.join('').slice(0, 6));

                    if (value && index < 5) {
                      document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      const newOtp = otp.split('');

                      if (otp[index]) {
                        newOtp[index] = '';
                        setOtp(newOtp.join(''));
                      } else if (index > 0) {
                        newOtp[index - 1] = '';
                        setOtp(newOtp.join(''));
                        document.getElementById(`otp-${index - 1}`)?.focus();
                      }
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    setOtp(pastedData);
                    const focusIndex = Math.min(pastedData.length, 5);
                    document.getElementById(`otp-${focusIndex}`)?.focus();
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  disabled={loading}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Code sent to {countryCode} {phoneNumber}
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}

      {step === 'displayName' && (
        <form onSubmit={handleSubmitDisplayName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
              required
              minLength={2}
              maxLength={50}
            />
            <p className="mt-1 text-xs text-gray-500">
              This is how you'll be identified in the app
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Complete Sign In'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
