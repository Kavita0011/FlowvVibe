import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import SEO from '../components/SEO';
import {
  Bot, MessageSquare, Zap, Globe, Phone, Mail, Check, Star, Menu, X,
  Facebook, Twitter, Instagram, Linkedin, CreditCard
} from 'lucide-react';

const features = [
  { icon: Bot, title: 'Smart AI', desc: 'Natural conversations with intent detection' },
  { icon: MessageSquare, title: 'Visual Builder', desc: 'Drag-drop flow design' },
  { icon: Globe, title: 'Multi-Channel', desc: 'Website, WhatsApp, Telegram & more' },
  { icon: Zap, title: 'Auto Learning', desc: 'Improves from feedback' },
  { icon: Mail, title: 'Email Automation', desc: 'Smart auto-replies' },
  { icon: CreditCard, title: 'Easy Payments', desc: 'UPI & bank transfer' }
];

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Perfect for testing',
    features: ['1 Chatbot', '50 Conversations', 'Basic Widget', 'Email support'],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: '',
    description: 'For growing businesses',
    features: ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Analytics', 'Export Widget', 'Priority support'],
    cta: 'Get Pro',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '₹9,999',
    period: '',
    description: 'For large organizations',
    features: ['Unlimited Everything', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'Custom Training'],
    cta: 'Contact Us',
    popular: false
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      navigate('/register', { state: { email } });
    } else {
      navigate('/register');
    }
  };

  return (
    <>
      <SEO
        title="FlowvVibe - AI Chatbot Builder Without Code"
        description="Build AI chatbots without coding. Visual drag-drop flow builder, multi-channel deployment. One-time pricing starting at ₹0."
        keywords={['AI chatbot builder', 'no-code chatbot', 'WhatsApp bot', 'customer support automation']}
        url="/"
      />
      <div className="min-h-screen bg-slate-900 text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-cyan-400" />
                <span className="text-xl font-bold text-white">FlowvVibe</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => setActiveSection('about')} className={activeSection === 'about' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}>Features</button>
                <button onClick={() => setActiveSection('pricing')} className={activeSection === 'pricing' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}>Pricing</button>
                <button onClick={() => navigate('/guide')} className="text-slate-300 hover:text-white">Guide</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white">Login</button>
                <button onClick={() => navigate('/register')} className="px-4 py-2 bg-cyan-500 rounded-lg font-medium hover:bg-cyan-400">Start Free</button>
              </div>
            </div>
          </div>
        </nav>

        <main className="pt-16">
          {!activeSection && (
            <div className="max-w-6xl mx-auto px-8 py-20">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-6">
                  Build Smart AI Chatbots
                  <span className="block text-cyan-400">in Minutes</span>
                </h1>
                <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                  Create powerful AI chatbots with our visual flow builder. No coding required.
                </p>
                <form onSubmit={handleStart} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-cyan-500 rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Start Free'}
                  </button>
                </form>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {features.map((feature, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
                    <feature.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="max-w-4xl mx-auto px-8 py-16">
              <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8">Back</button>
              <h1 className="text-4xl font-bold text-white mb-8">About FlowvVibe</h1>
              <p className="text-slate-300 text-lg">
                FlowvVibe is an AI-powered chatbot builder platform that enables businesses to create
                intelligent conversational agents without coding.
              </p>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="max-w-5xl mx-auto px-8 py-16">
              <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8">Back</button>
              <h1 className="text-4xl font-bold text-white text-center mb-4">Simple Pricing</h1>
              <p className="text-slate-400 text-center mb-12">One-time payment, lifetime access</p>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingPlans.map((plan, i) => (
                  <div key={i} className={cn(
                    "bg-slate-800 rounded-2xl p-8 border",
                    plan.popular ? "border-cyan-500" : "border-slate-700"
                  )}>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                    <button onClick={() => navigate('/register')} className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white">
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-12">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-cyan-400" />
                <span className="text-xl font-bold text-white">FlowvVibe</span>
              </div>
              <p className="text-slate-400 text-sm">&copy; 2026 FlowvVibe. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}