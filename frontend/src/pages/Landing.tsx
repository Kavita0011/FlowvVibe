import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import SEO from '../components/SEO';
import { 
  Bot, MessageSquare, Zap, Globe, Phone, Mail, ChevronRight, ArrowRight, 
  Check, Star, Menu, X, Facebook, Twitter, Instagram, Linkedin,
  Quote, Users, ArrowUpRight, FileText, Shield, Clock, CreditCard
} from 'lucide-react';

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'E-commerce Owner',
    company: 'ShopRight',
    image: '',
    content: 'FlowvVibe transformed our customer support. Our conversion rate increased by 40% in just 2 weeks!',
    rating: 5
  },
  {
    name: 'Dr. Priya Patel',
    role: 'Clinic Manager',
    company: 'HealthPlus',
    image: '',
    content: 'The AI handles 80% of our patient queries automatically. Our staff now focuses on critical cases.',
    rating: 5
  },
  {
    name: 'Amit Kumar',
    role: 'Restaurant Owner',
    company: 'Spice Garden',
    image: '',
    content: 'Table reservations and orders are now automated. Our customers love the instant responses!',
    rating: 5
  }
];

const features = [
  { icon: Bot, title: 'Smart AI', desc: 'Natural conversations with intent detection' },
  { icon: MessageSquare, title: 'Visual Builder', desc: 'Drag-drop flow design with React Flow' },
  { icon: Globe, title: 'Multi-Channel', desc: 'Website, WhatsApp, Telegram & more' },
  { icon: Zap, title: 'Auto Learning', desc: 'Improves from feedback' },
  { icon: Mail, title: 'Email Automation', desc: 'Smart auto-replies' },
  { icon: Shield, title: 'Lead Capture', desc: 'Email collection with validation' },
  { icon: Clock, title: '24/7 Support', desc: 'Always-on customer service' },
  { icon: CreditCard, title: 'Easy Payments', desc: 'UPI & bank transfer integration' }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for testing',
    features: ['1 Chatbot', '100 messages/month', 'Basic widgets', 'Email support'],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    description: 'For growing businesses',
    features: ['Unlimited chatbots', '10,000 messages/month', 'All channels', 'Lead capture', 'Analytics', 'Priority support'],
    cta: 'Go Pro',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'Custom training', 'On-premise option'],
    cta: 'Contact Us',
    popular: false
  }
];

const faqData = [
  { q: 'How does the AI learn?', a: 'The AI analyzes conversations and feedback to continuously improve responses.' },
  { q: 'Can I integrate with my existing systems?', a: 'Yes! We support API integrations with CRM, helpdesk, and other tools.' },
  { q: 'Is there a free trial?', a: 'Yes, the Starter plan is free forever with no credit card required.' },
  { q: 'What channels are supported?', a: 'We support Website widgets, WhatsApp, Telegram, Slack, Instagram, and Facebook Messenger.' }
];

const comparisonData = [
  { feature: 'Pricing Model', flowvibe: '₹0-9999/lifetime', botpress: '$99/mo', voiceflow: '$50-500/mo', tidio: '$39-199/mo', chatbase: '$99/mo', dialogflow: '$60-180/mo' },
  { feature: 'One-time Pricing', flowvibe: 10, botpress: 4, voiceflow: 3, tidio: 3, chatbase: 4, dialogflow: 3 },
  { feature: 'No-Code Builder', flowvibe: 9, botpress: 8, voiceflow: 9, tidio: 9, chatbase: 9, dialogflow: 6 },
  { feature: 'AI/LLM Integration', flowvibe: 8, botpress: 10, voiceflow: 10, tidio: 7, chatbase: 8, dialogflow: 10 },
  { feature: 'Visual Flow Builder', flowvibe: 9, botpress: 9, voiceflow: 10, tidio: 8, chatbase: 6, dialogflow: 6 },
  { feature: 'Multi-Channel Support', flowvibe: 8, botpress: 9, voiceflow: 9, tidio: 9, chatbase: 7, dialogflow: 8 },
  { feature: 'Indian Payment Gateway', flowvibe: 10, botpress: 2, voiceflow: 3, tidio: 4, chatbase: 3, dialogflow: 2 },
  { feature: 'Free Plan Available', flowvibe: 10, botpress: 7, voiceflow: 6, tidio: 5, chatbase: 6, dialogflow: 5 },
  { feature: 'Easy Setup', flowvibe: 9, botpress: 6, voiceflow: 7, tidio: 9, chatbase: 9, dialogflow: 5 },
  { feature: 'Lead Generation', flowvibe: 9, botpress: 8, voiceflow: 9, tidio: 9, chatbase: 8, dialogflow: 7 },
  { feature: 'Analytics Dashboard', flowvibe: 8, botpress: 9, voiceflow: 9, tidio: 8, chatbase: 7, dialogflow: 8 },
  { feature: 'Custom Branding', flowvibe: 8, botpress: 7, voiceflow: 8, tidio: 6, chatbase: 5, dialogflow: 5 },
  { feature: 'Export Widget', flowvibe: 9, botpress: 6, voiceflow: 7, tidio: 5, chatbase: 4, dialogflow: 4 }
];

export default function Landing() {
  const navigate = useNavigate();
  const { setUser } = useChatbotStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'pricing' | 'terms' | 'testimonials' | 'contact' | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  return (
    <>
      <SEO
        title="FlowvVibe - AI Chatbot Builder Without Code"
        description="Build AI chatbots without coding. Visual drag-drop flow builder, multi-channel deployment, WhatsApp integration. One-time pricing starting at ₹0."
        keywords={['AI chatbot builder', 'no-code chatbot', 'WhatsApp bot', 'customer support automation', 'chatbot platform']}
        url="/"
      />
      <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">FlowvVibe</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => setActiveSection('about')} className={activeSection === 'about' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}>Features</button>
                <button onClick={() => setActiveSection('pricing')} className={activeSection === 'pricing' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}>Pricing</button>
                <button onClick={() => setActiveSection('testimonials')} className={activeSection === 'testimonials' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}>Testimonials</button>
                <button onClick={() => navigate('/guide')} className="text-slate-300 hover:text-white">Guide</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white hidden sm:block">Login</button>
                <button onClick={() => navigate('/register')} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity">Start Free</button>
              </div>
            </div>
</div>
        </nav>

        <main className="pt-16">
          {!activeSection && (
            <div className="max-w-6xl mx-auto px-8 py-12 md:py-20">
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Build Smart AI Chatbots
                  <span className="block text-cyan-400">in Minutes, Not Days</span>
                </h1>
                <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                  Create powerful AI chatbots with our visual flow builder.
                  PRD to production in a few clicks. Deploy anywhere.
                </p>
                <form onSubmit={handleStart} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Loading...' : 'Start Free'}
                  </button>
                </form>
              </div>

              <div className="grid md:grid-cols-4 gap-6 mb-20">
                {features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center hover:border-cyan-500/50 transition-colors">
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
              <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
                Back
              </button>
              <h1 className="text-4xl font-bold text-white mb-8">About FlowvVibe</h1>
              <p className="text-slate-300 text-lg mb-6">
                FlowvVibe is an AI-powered chatbot builder platform that enables businesses to create
                intelligent conversational agents without coding.
              </p>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="max-w-5xl mx-auto px-8 py-16">
              <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
                Back
              </button>
              <h1 className="text-4xl font-bold text-white text-center mb-4">Simple, Transparent Pricing</h1>
              <p className="text-slate-400 text-center mb-12">Choose the plan that fits your needs</p>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingPlans.map((plan, i) => (
                  <div key={i} className={cn(
                    "bg-slate-800 rounded-2xl p-8 border",
                    plan.popular ? "border-cyan-500 relative" : "border-slate-700"
                  )}>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                    <button className="w-full py-3 rounded-lg font-medium transition-colors bg-cyan-500 hover:bg-cyan-400 text-white">
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-6 h-6 text-cyan-400" />
                <span className="text-xl font-bold text-white">FlowvVibe</span>
              </div>
              <p className="text-slate-400 text-sm">Build smart AI chatbots in minutes.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button onClick={() => setActiveSection('pricing')} className="hover:text-white">Pricing</button></li>
                <li><button onClick={() => setActiveSection('about')} className="hover:text-white">About</button></li>
                <li><button onClick={() => setActiveSection('testimonials')} className="hover:text-white">Testimonials</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button onClick={() => navigate('/guide')} className="hover:text-white">User Guide</button></li>
                <li><button onClick={() => navigate('/guide')} className="hover:text-white">Help Center</button></li>
                <li><button onClick={() => setActiveSection('contact')} className="hover:text-white">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button onClick={() => navigate('/terms')} className="hover:text-white">Terms</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button></li>
                <li><button onClick={() => navigate('/cookies')} className="hover:text-white">Cookies</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">&copy; 2024 FlowvVibe. All rights reserved.</p>
            <div className="flex gap-4">
              <Twitter className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              <Facebook className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              <Instagram className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
              <Linkedin className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}