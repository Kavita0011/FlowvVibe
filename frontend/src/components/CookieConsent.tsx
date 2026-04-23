import { useState, useEffect } from 'react';
import { X, Cookie, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  };

  const customize = () => {
    navigate('/cookies');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-slate-800/95 backdrop-blur-lg rounded-xl border border-slate-700 shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 flex-shrink-0">
            <Cookie className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              We value your privacy
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Learn more
              </button>
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={acceptAll}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={acceptEssential}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={customize}
                className="px-5 py-2.5 border border-slate-600 hover:border-slate-500 text-slate-300 font-medium rounded-lg transition-colors"
              >
                Customize
              </button>
            </div>
          </div>

          <button
            onClick={acceptEssential}
            className="text-slate-400 hover:text-white p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}