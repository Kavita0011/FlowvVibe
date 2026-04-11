import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
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
  { icon: Phone, title: 'Voice Ready', desc: 'IVR and voice AI support' },
  { icon: Mail, title: 'Email Automation', desc: 'Smart auto-replies' },
  { icon: Shield, title: 'Lead Capture', desc: 'Validated contact collection' },
  { icon: Clock, title: '24/7 Support', desc: 'Always-on customer service' }
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

export default function Landing() {
  const navigate = useNavigate();
  const { setUser } = useChatbotStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'pricing' | 'terms' | 'testimonials' | 'contact' | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'demo-user',
        email: email || 'demo@example.com',
        displayName: 'Demo User',
        createdAt: new Date(),
        isActive: true,
        role: 'user'
      });
      navigate('/dashboard');
    }, 1000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending email (in production, this would call your backend API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Contact form submitted:', contactForm);
    // In real app, send to: support@flowvibe.ai
    alert(`Thank you! Your message has been sent. We'll contact you at ${contactForm.email}`);
    setContactSent(true);
  };

  const handleNavClick = (section: typeof activeSection) => {
    if (!section) return;
    setActiveSection(section);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="flex items-center justify-between px-4 md:px-8 py-6 relative z-50">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">FlowvVibe</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => setActiveSection('about')} className="text-slate-300 hover:text-white transition-colors">About</button>
          <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white transition-colors">Pricing</button>
          <button onClick={() => setActiveSection('testimonials')} className="text-slate-300 hover:text-white transition-colors">Testimonials</button>
          <button onClick={() => setActiveSection('contact')} className="text-slate-300 hover:text-white transition-colors">Contact</button>
          <button onClick={() => setActiveSection('terms')} className="text-slate-300 hover:text-white transition-colors">Terms</button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
          >
            Get Started
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-800 p-4 md:hidden flex flex-col gap-4 border-b border-slate-700">
            <button onClick={() => handleNavClick('about')} className="text-slate-300 hover:text-white text-left">About</button>
            <button onClick={() => handleNavClick('pricing')} className="text-slate-300 hover:text-white text-left">Pricing</button>
            <button onClick={() => handleNavClick('testimonials')} className="text-slate-300 hover:text-white text-left">Testimonials</button>
            <button onClick={() => handleNavClick('contact')} className="text-slate-300 hover:text-white text-left">Contact</button>
            <button onClick={() => handleNavClick('terms')} className="text-slate-300 hover:text-white text-left">Terms</button>
          </div>
        )}
      </nav>

      {!activeSection && (
        <>
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
                  {loading ? 'Loading...' : (
                    <>
                      Start Free <ArrowRight className="w-5 h-5" />
                    </>
                  )}
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

            <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-8 md:p-12 border border-slate-700 mb-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                  <div className="space-y-6">
                    {[
                      { step: '1', title: 'Describe Your Bot', desc: 'Enter your company details and requirements' },
                      { step: '2', title: 'AI Generates Flow', desc: 'Our AI creates the conversation flow' },
                      { step: '3', title: 'Customize & Deploy', desc: 'Edit visually and publish anywhere' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{item.title}</h4>
                          <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full" />
                      <div className="flex-1 bg-slate-800 rounded-lg p-3">
                        <p className="text-white text-sm">Hi! How can I help you today?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full" />
                      <div className="flex-1 bg-slate-800 rounded-lg p-3">
                        <p className="text-white text-sm">I want to order a pizza</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full" />
                      <div className="flex-1 bg-slate-800 rounded-lg p-3">
                        <p className="text-white text-sm">Great! What size would you like?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'about' && (
        <div className="max-w-4xl mx-auto px-8 py-16">
          <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-8">About FlowvVibe</h1>
          <p className="text-slate-300 text-lg mb-6">
            FlowvVibe is an AI-powered chatbot builder platform that enables businesses to create 
            intelligent conversational agents without coding. Our mission is to make AI accessible to every business.
          </p>
          <p className="text-slate-300 text-lg mb-6">
            Founded in 2024, we help businesses of all sizes automate customer support, 
            generate leads, and deliver exceptional experiences through smart AI chatbots.
          </p>
        </div>
      )}

      {activeSection === 'pricing' && (
        <div className="max-w-5xl mx-auto px-8 py-16">
          <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <h1 className="text-4xl font-bold text-white text-center mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-400 text-center mb-12">Choose the plan that fits your needs</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={cn(
                "bg-slate-800 rounded-2xl p-8 border",
                plan.popular ? "border-cyan-500 relative" : "border-slate-700"
              )}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-white text-sm rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-green-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={cn(
                  "w-full py-3 rounded-lg font-medium transition-colors",
                  plan.popular ? "bg-cyan-500 hover:bg-cyan-400 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"
                )}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="text-white font-medium">Payment Methods</h3>
                <p className="text-slate-400 text-sm">UPI, Bank Transfer, Credit/Debit Cards available</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'testimonials' && (
        <div className="max-w-4xl mx-auto px-8 py-16">
          <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <h1 className="text-4xl font-bold text-white text-center mb-4">What Our Customers Say</h1>
          <p className="text-slate-400 text-center mb-12">Join 500+ businesses using FlowvVibe</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-cyan-400/50 mb-3" />
                <p className="text-slate-300 mb-4">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.name}</p>
                    <p className="text-slate-400 text-sm">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'contact' && (
        <div className="max-w-2xl mx-auto px-8 py-16">
          <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-slate-400 mb-8">Have questions? We'd love to hear from you.</p>
          
          {contactSent ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-8 text-center">
              <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-slate-400">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-2">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white resize-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      )}

      {activeSection === 'terms' && (
        <div className="max-w-4xl mx-auto px-8 py-16">
          <button onClick={() => setActiveSection(null)} className="text-cyan-400 mb-8 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
          
          <div className="space-y-8">
            {faqData.map((item, i) => (
              <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-white font-medium mb-2">{item.q}</h3>
                <p className="text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-20">
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
                <li><button onClick={() => setActiveSection('contact')} className="hover:text-white">Contact</button></li>
                <li><button className="hover:text-white">Documentation</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><button onClick={() => setActiveSection('terms')} className="hover:text-white">Terms</button></li>
                <li><button className="hover:text-white">Privacy</button></li>
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
    </div>
  );
}