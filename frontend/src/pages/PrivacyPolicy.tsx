import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, ChevronDown, ChevronUp, Phone } from 'lucide-react';

const sections = [
  {
    id: 'collection',
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including:
• Account information (name, email)
• Business details (company name, website)
• Payment information (processed securely via Razorpay)
• Chatbot configurations and conversation data
• Integration credentials you choose to connect`
  }
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('collection');

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
          <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400">Last Updated: April 2026</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
          <p className="text-slate-300 leading-relaxed">
            FlowvVibe ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI chatbot builder platform.
          </p>
          <div className="mt-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
            <p className="text-cyan-300 text-sm">
              <strong>Your Data is Yours:</strong> You own all chatbots, conversations, and customer data you create. We never use your customer data for our own marketing or advertising purposes.
            </p>
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
          <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
          <p className="text-slate-300 mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <div className="flex items-center gap-3 text-slate-300">
            <Mail className="w-5 h-5 text-cyan-400" />
            <span>devappkavita@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 mt-2">
            <Phone className="w-5 h-5 text-cyan-400" />
            <span>+91 45065191325</span>
          </div>
        </div>
      </div>
    </div>
  );
}