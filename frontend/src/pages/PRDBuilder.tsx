import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Sparkles, Building2, Users, MessageCircle, 
  Clock, FileText, Plus, Trash2, Wand2, Loader2, Send,
  Briefcase, Target, Heart, Lightbulb, Zap, Globe, Mail, Phone
} from 'lucide-react';
import type { PRD, FAQ } from '../types';

const industryTemplates: Record<string, Partial<PRD>> = {
  'E-commerce': {
    services: ['Product browsing', 'Order tracking', 'Returns & refunds', 'Payment support', 'Size guide', 'Product recommendations'],
    targetAudience: 'Online shoppers looking for products, order status, or support',
    faq: [
      { question: 'What is your return policy?', answer: 'We offer 30-day returns on all items.' },
      { question: 'How do I track my order?', answer: 'Use your order number in the tracking page.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, UPI, and digital wallets.' },
      { question: 'Do you have size guide?', answer: 'Yes! Check our size guide on each product page.' }
    ],
    escalationRules: 'Transfer to human for: order disputes, refunds > 5000,投诉升级'
  },
  'Healthcare': {
    services: ['Appointment booking', 'Doctor consultation', 'Medical records', 'Emergency support', 'Prescription renewal'],
    targetAudience: 'Patients seeking medical assistance and appointments',
    faq: [
      { question: 'How do I book an appointment?', answer: 'Use our booking system or call our helpline.' },
      { question: 'What are your operating hours?', answer: 'We are available 24/7 for emergencies.' },
      { question: 'Do you accept insurance?', answer: 'Yes, we work with major insurance providers.' }
    ],
    escalationRules: 'Always transfer to human for: medical emergencies, 急诊症状描述'
  },
  'Restaurant': {
    services: ['Table reservation', 'Menu inquiry', 'Order placement', 'Delivery tracking', 'Catering orders', 'Private events'],
    targetAudience: 'Diners looking for reservations and orders',
    faq: [
      { question: 'How do I reserve a table?', answer: 'Call us or use the online booking form.' },
      { question: 'What are your hours?', answer: 'We are open 11am-10pm daily.' },
      { question: 'Do you deliver?', answer: 'Yes, we deliver within 5km radius.' }
    ],
    escalationRules: 'Transfer for: large parties (>10人), complaints, allergic reactions'
  },
  'Real Estate': {
    services: ['Property listings', 'Virtual tours', 'Financing info', 'Viewing scheduling', 'Property valuation'],
    targetAudience: 'Home buyers and renters looking for properties',
    faq: [
      { question: 'What properties do you have?', answer: 'Check our listings page for available properties.' },
      { question: 'How do I schedule a viewing?', answer: 'Use the contact form or call us.' },
      { question: 'Do you offer financing?', answer: 'We can connect you with our financing partners.' }
    ],
    escalationRules: 'Transfer for: negotiation, legal questions, rental agreements'
  },
  'SaaS': {
    services: ['Product demonstrations', 'Free trial signup', 'Technical support', 'Billing inquiries', 'Custom integrations'],
    targetAudience: 'Businesses looking for software solutions',
    faq: [
      { question: 'How do I start a free trial?', answer: 'Sign up on our website with your email.' },
      { question: 'What features are included?', answer: 'All features are included in the trial.' },
      { question: 'How do I upgrade?', answer: 'Go to Settings > Subscription in your dashboard.' }
    ],
    escalationRules: 'Transfer for: enterprise pricing, technical issues, billing disputes'
  },
  'Education': {
    services: ['Course enrollment', 'Placement assistance', 'Certificate verification', 'Career counseling'],
    targetAudience: 'Students and professionals seeking education',
    faq: [
      { question: 'What courses do you offer?', answer: 'We offer courses in technology, business, and design.' },
      { question: 'Do you provide placement?', answer: 'Yes, we have a dedicated placement team.' }
    ],
    escalationRules: 'Transfer for: refunds, certificate verification issues'
  },
  'Banking': {
    services: ['Account balance', 'Fund transfer', 'Loan inquiry', 'Credit card applications'],
    targetAudience: 'Customers seeking banking services',
    faq: [
      { question: 'How do I check my balance?', answer: 'Use our mobile app or website.' },
      { question: 'How do I apply for a loan?', answer: 'Apply online through our website or visit a branch.' }
    ],
    escalationRules: 'Always transfer for: fraud concerns, loan applications'
  },
  'Retail': {
    services: ['Product availability', 'In-store pickup', 'Gift cards', 'Loyalty program'],
    targetAudience: 'Shoppers looking for products and deals',
    faq: [
      { question: 'Is this item in stock?', answer: 'Let me check the availability for you.' },
      { question: 'Do you have loyalty points?', answer: 'Yes! Join our loyalty program for exclusive rewards.' }
    ],
    escalationRules: 'Transfer for: large orders, complaints'
  }
};

const tones = [
  { id: 'formal', label: 'Formal', desc: 'Professional and business-like' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', desc: 'Expert and authoritative' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed and informal' }
];

interface ExtendedPRD extends PRD {
  companyDescription?: string;
  uniqueSellingPoints?: string[];
  hoursOfOperation?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: string[];
  leadQualification?: string;
  commonObjections?: string[];
  competitiveAdvantages?: string;
}

export default function PRDBuilder() {
  const navigate = useNavigate();
  const { prd, setPRD, updatePRD, setFlowData, currentChatbot } = useChatbotStore();
  const [generatedFlow, setGeneratedFlow] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newFAQ, setNewFAQ] = useState<FAQ>({ question: '', answer: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const extendedPRD = prd as ExtendedPRD | null;
  
  const industries = Object.keys(industryTemplates);

  const handleIndustrySelect = (industry: string) => {
    const template = industryTemplates[industry];
    if (template && prd) {
      setPRD({
        ...prd,
        industry,
        services: template.services || [],
        targetAudience: template.targetAudience || '',
        faq: template.faq || [],
        escalationRules: template.escalationRules || ''
      });
    }
  };

  const handleAddFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) return;
    if (prd) {
      setPRD({ ...prd, faq: [...prd.faq, newFAQ] });
      setNewFAQ({ question: '', answer: '' });
    }
  };

  const handleRemoveFAQ = (index: number) => {
    if (prd) {
      setPRD({ ...prd, faq: prd.faq.filter((_, i) => i !== index) });
    }
  };

  const handleAddUSP = (usp: string) => {
    if (!usp || !extendedPRD) return;
    setPRD({
      ...prd!,
      uniqueSellingPoints: [...(extendedPRD.uniqueSellingPoints || []), usp]
    } as PRD);
  };

  const handleAddObjection = (obj: string) => {
    if (!obj || !extendedPRD) return;
    setPRD({
      ...prd!,
      commonObjections: [...(extendedPRD.commonObjections || []), obj]
    } as PRD);
  };

  const handleGenerateWithAI = async () => {
    if (!prd) return;
    setGenerating(true);

    const usps = extendedPRD?.uniqueSellingPoints?.join(', ') || 'quality products, excellent service';
    const objections = extendedPRD?.commonObjections?.join(', ') || 'price, timing, trust';
    const advantages = extendedPRD?.competitiveAdvantages || 'best in class service';
    const hours = extendedPRD?.hoursOfOperation || '9 AM - 6 PM';
    const location = extendedPRD?.location || 'to be confirmed';
    const email = extendedPRD?.contactEmail || 'contact@company.com';
    const phone = extendedPRD?.contactPhone || 'to be confirmed';

    const prompt = `Create a smart conversation flow for a ${prd.tone} AI chatbot for a ${prd.industry} company called "${prd.companyName}".
    
    COMPANY DETAILS:
    - Description: ${extendedPRD?.companyDescription || 'Not specified'}
    - Unique Selling Points: ${usps}
    - Competitive Advantages: ${advantages}
    - Target Audience: ${prd.targetAudience || 'General customers'}
    - Hours of Operation: ${hours}
    - Location: ${location}
    - Contact Email: ${email}
    - Contact Phone: ${phone}
    
    SERVICES: ${prd.services.join(', ')}
    
    FAQ (Quick Replies):
    ${prd.faq.map(f => `Q: ${f.question} A: ${f.answer}`).join('\n')}
    
    LEAD QUALIFICATION: ${extendedPRD?.leadQualification || 'Basic - collect name, email, phone and interest'}
    
    COMMON OBJECTIONS TO HANDLE: ${objections}
    
    ESCALATION RULES: ${prd.escalationRules || 'Transfer for complex queries'}
    
    IMPORTANT: The flow must:
    1. Have a warm, personalized greeting using company name
    2. Offer to help with common services first
    3. Include condition nodes to route based on user intent  
    4. Handle lead collection with proper validation (email format, phone format)
    5. Address common objections proactively
    6. Have clear path to human agent when needed
    7. End with call-to-action for conversions
    
    Create a complete JSON flow with these node types:
    - start: Welcome message with companyUSP
    - aiResponse: For each FAQ as quick reply buttons
    - textInput/emailInput/phoneInput: For lead collection
    - condition: To detect intent and route appropriately
    - branch: For different scenarios
    - sendEmail: To send leads to team
    - transferToAgent: When human is needed
    - end: Closing with CTA
    
    Return ONLY valid JSON:
    {"nodes": [{"id": "start", "type": "start", "position": {"x": 100, "y": 200}, "data": {"label": "Start", "message": "Welcome!", "companyUSP": []}}, ...], "edges": [...]}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const flow = JSON.parse(data.choices[0].message.content);
      setGeneratedFlow(JSON.stringify(flow, null, 2));
      setFlowData(flow);
    } catch (error) {
      console.error('AI generation failed:', error);
      const fallbackFlow = {
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 200 }, data: { label: 'Start', message: `Welcome to ${prd.companyName}! How can I help you today?`, companyUSP: extendedPRD?.uniqueSellingPoints || [] } },
          { id: 'name-input', type: 'textInput', position: { x: 100, y: 350 }, data: { label: 'Get Name', question: 'May I know your name?' } },
          { id: 'email-input', type: 'emailInput', position: { x: 100, y: 500 }, data: { label: 'Get Email', question: 'What is your email?' } },
          { id: 'phone-input', type: 'phoneInput', position: { x: 100, y: 650 }, data: { label: 'Get Phone', question: 'Your phone number?' } },
          { id: 'service-menu', type: 'aiResponse', position: { x: 100, y: 800 }, data: { label: 'Services', message: `Great! We offer: ${prd.services.slice(0, 4).join(', ')}. How can I help?`, quickReplies: prd.services } },
          { id: 'end', type: 'end', position: { x: 500, y: 800 }, data: { label: 'End', message: 'Thank you for chatting! We will contact you soon.' } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'name-input' },
          { id: 'e2', source: 'name-input', target: 'email-input' },
          { id: 'e3', source: 'email-input', target: 'phone-input' },
          { id: 'e4', source: 'phone-input', target: 'service-menu' },
          { id: 'e5', source: 'service-menu', target: 'end' }
        ]
      };
      setGeneratedFlow(JSON.stringify(fallbackFlow, null, 2));
      setFlowData(fallbackFlow as any);
    } finally {
      setGenerating(false);
      navigate('/flow');
    }
  };

  if (!prd) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">PRD Builder</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                showAdvanced ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-300 hover:text-white"
              )}
            >
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </button>
            <button 
              onClick={handleGenerateWithAI}
              disabled={generating || !prd.companyName || !prd.industry}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              Generate Smart Flow
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Company Information (Required)
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={prd.companyName}
                    onChange={(e) => setPRD({ ...prd, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Industry *</label>
                  <select
                    value={prd.industry}
                    onChange={(e) => handleIndustrySelect(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                Your Services (Required)
              </h2>
              <div className="space-y-3">
                {prd.services.map((service, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">{service}</span>
                    <button 
                      onClick={() => setPRD({ ...prd, services: prd.services.filter((_, idx) => idx !== i) })}
                      className="ml-auto text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Type a service and press Enter..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setPRD({ ...prd, services: [...prd.services, e.currentTarget.value] });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Target Audience
              </h2>
              <textarea
                value={prd.targetAudience}
                onChange={(e) => setPRD({ ...prd, targetAudience: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Describe your ideal customer..."
              />
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Bot Personality
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tones.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setPRD({ ...prd, tone: tone.id })}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      prd.tone === tone.id 
                        ? "bg-cyan-500/20 border-cyan-500" 
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    )}
                  >
                    <p className="text-white font-medium">{tone.label}</p>
                    <p className="text-slate-400 text-xs">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {showAdvanced && (
              <>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                    Enhanced Details (Optional - Better AI Responses)
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 mb-2">Company Description (for better AI context)</label>
                      <textarea
                        value={extendedPRD?.companyDescription || ''}
                        onChange={(e) => setPRD({ ...prd, companyDescription: e.target.value } as PRD)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                        placeholder="Tell us about your company in a few sentences..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Unique Selling Points (USPs)</label>
                      <div className="space-y-2">
                        {(extendedPRD?.uniqueSellingPoints || []).map((usp, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-white flex-1">{usp}</span>
                            <button 
                              onClick={() => setPRD({ ...prd, uniqueSellingPoints: (extendedPRD?.uniqueSellingPoints || []).filter((_, idx) => idx !== i) } as PRD)}
                              className="text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          placeholder="Add a unique selling point..."
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                              handleAddUSP(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Competitive Advantages</label>
                      <textarea
                        value={extendedPRD?.competitiveAdvantages || ''}
                        onChange={(e) => setPRD({ ...prd, competitiveAdvantages: e.target.value } as PRD)}
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                        placeholder="What makes you better than competitors?"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Contact & Operations (Optional)
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2">Business Hours</label>
                      <input
                        type="text"
                        value={extendedPRD?.hoursOfOperation || ''}
                        onChange={(e) => setPRD({ ...prd, hoursOfOperation: e.target.value } as PRD)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="e.g., 9 AM - 6 PM, Mon-Sat"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Location</label>
                      <input
                        type="text"
                        value={extendedPRD?.location || ''}
                        onChange={(e) => setPRD({ ...prd, location: e.target.value } as PRD)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="City, State"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={extendedPRD?.contactEmail || ''}
                        onChange={(e) => setPRD({ ...prd, contactEmail: e.target.value } as PRD)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="support@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={extendedPRD?.contactPhone || ''}
                        onChange={(e) => setPRD({ ...prd, contactPhone: e.target.value } as PRD)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-400" />
                    Lead Qualification (Optional)
                  </h2>
                  <select
                    value={extendedPRD?.leadQualification || 'basic'}
                    onChange={(e) => setPRD({ ...prd, leadQualification: e.target.value } as PRD)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="basic">Basic - Name, Email, Phone</option>
                    <option value="standard">Standard + Interest & Budget</option>
                    <option value="detailed">Detailed + Timeline & Requirements</option>
                  </select>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Common Objections to Handle (Optional)
                  </h2>
                  <div className="space-y-2">
                    {(extendedPRD?.commonObjections || []).map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
                        <span className="text-white">{obj}</span>
                        <button 
                          onClick={() => setPRD({ ...prd, commonObjections: (extendedPRD?.commonObjections || []).filter((_, idx) => idx !== i) } as PRD)}
                          className="ml-auto text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add common objection..."
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleAddObjection(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
               </>
             )}

             <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                FAQ - Quick Replies
              </h2>
              <div className="space-y-3">
                {prd.faq.map((faq, i) => (
                  <div key={i} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-cyan-400 font-medium text-sm">Q: {faq.question}</p>
                        <p className="text-slate-300 mt-1 text-sm">A: {faq.answer}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFAQ(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="grid gap-2">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Answer"
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <button 
                  onClick={handleAddFAQ}
                  disabled={!newFAQ.question || !newFAQ.answer}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add FAQ
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Escalation Rules
              </h2>
              <textarea
                value={prd.escalationRules || ''}
                onChange={(e) => setPRD({ ...prd, escalationRules: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none text-sm"
                placeholder="When should the bot transfer to human?&#10;e.g., For refunds > 5000, complaints, technical issues"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}