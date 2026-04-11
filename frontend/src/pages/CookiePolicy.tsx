import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cookie, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const sections = [
  {
    id: 'what',
    title: 'What Are Cookies',
    content: `Cookies are small text files stored on your device when you visit websites. They help remember your preferences and improve your browsing experience.

Cookies can be:
• Session cookies (deleted when you close your browser)
• Persistent cookies (remain until expired or deleted)
• First-party cookies (set by our site)
• Third-party cookies (set by external services)`
  },
  {
    id: 'types',
    title: 'Types of Cookies We Use',
    content: `Essential Cookies:
• Authentication - keep you logged in
• Security - protect against fraud
• Preferences - remember your settings

Functional Cookies:
• Language settings
• Interface customizations
• Chatbot configurations

Analytics Cookies:
• Page views and engagement
• Traffic sources
• Feature usage patterns

Marketing Cookies:
• We do NOT use marketing cookies
• We do not track you for advertising
• Your privacy is protected`
  },
  {
    id: 'purpose',
    title: 'Why We Use Cookies',
    content: `We use cookies to:
• Keep you logged into your account
• Remember your preferences and settings
• Understand how you use our service
• Improve our chatbots and features
• Secure your account and data
• Provide customer support

We do NOT use cookies to:
• Track you across other websites
• Build advertising profiles
• Share data with advertisers`
  },
  {
    id: 'thirdparty',
    title: 'Third-Party Cookies',
    content: `Some features involve third-party services that may set cookies:

Google Analytics:
• Analyzes website traffic
• Helps us improve our service

Razorpay:
• Secure payment processing
• Fraud prevention

WhatsApp/Telegram/Slack:
• OAuth authentication
• Channel integration

Each third-party service has its own privacy policy.`
  },
  {
    id: 'management',
    title: 'Managing Cookies',
    content: `You can control or delete cookies:

Browser Settings:
• Most browsers allow cookie management
• You can block all cookies
• You can delete existing cookies
• Settings typically in: Privacy/Security

Impact of Blocking:
• Some features may not work
• You may need to log in repeatedly
• Personalized features may be limited

Our Preference Center:
• Use settings in your account to manage analytics cookies`
  },
  {
    id: 'updates',
    title: 'Policy Updates',
    content: `We may update this Cookie Policy to reflect:
• Changes in our services
• New third-party integrations
• Regulatory requirements

We will notify you of material changes by:
• Posting updated policy on this page
• Updating the "Last Updated" date

Your continued use constitutes acceptance.`
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `Questions about our Cookie Policy?

Contact: devappkavita@gmail.com
Phone: +91 45065191325

We respond within 24-48 hours.`
  }
];

export default function CookiePolicy() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('what');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-5 h-5" />Back to Home
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Cookie Policy</h1>
          <p className="text-slate-400">Last Updated: April 2026</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Summary</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            This Cookie Policy explains how FlowvVibe uses cookies and similar technologies to improve your experience.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <p className="text-green-400 font-medium">What We Use</p>
              <p className="text-slate-300 text-sm mt-1">Essential & functional cookies for security and preferences</p>
            </div>
            <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <p className="text-cyan-400 font-medium">What We Don't Use</p>
              <p className="text-slate-300 text-sm mt-1">No marketing or advertising cookies</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-lg font-medium text-white">{section.title}</span>
                {openSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5">
                  <pre className="text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {section.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Manage Your Preferences</h3>
          </div>
          <p className="text-slate-300 mb-4">
            You can control which cookies you allow in your browser settings.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-400 transition-colors"
            >
              Account Settings
            </button>
            <a 
              href="https://www.aboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm hover:text-white hover:border-slate-500 transition-colors"
            >
              Learn More About Cookies
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}