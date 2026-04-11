import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Sparkles, Building2, Users, MessageCircle, 
  Clock, FileText, Plus, Trash2, Wand2, Loader2, Send
} from 'lucide-react';
import type { PRD, FAQ } from '../types';

const industryTemplates: Record<string, Partial<PRD>> = {
  'E-commerce': {
    services: ['Product browsing', 'Order tracking', 'Returns & refunds', 'Payment support'],
    targetAudience: 'Online shoppers looking for products, order status, or support',
    faq: [
      { question: 'What is your return policy?', answer: 'We offer 30-day returns on all items.' },
      { question: 'How do I track my order?', answer: 'Use your order number in the tracking page.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, UPI, and digital wallets.' }
    ],
    escalationRules: 'Transfer to human for: order disputes, refunds > 5000,投诉升级'
  },
  'Healthcare': {
    services: ['Appointment booking', 'Doctor consultation', 'Medical records', 'Emergency support'],
    targetAudience: 'Patients seeking medical assistance and appointments',
    faq: [
      { question: 'How do I book an appointment?', answer: 'Use our booking system or call our helpline.' },
      { question: 'What are your operating hours?', answer: 'We are available 24/7 for emergencies.' },
      { question: 'Do you accept insurance?', answer: 'Yes, we work with major insurance providers.' }
    ],
    escalationRules: 'Always transfer to human for: medical emergencies, 急诊症状描述'
  },
  'Restaurant': {
    services: ['Table reservation', 'Menu inquiry', 'Order placement', 'Delivery tracking'],
    targetAudience: 'Diners looking for reservations and orders',
    faq: [
      { question: 'How do I reserve a table?', answer: 'Call us or use the online booking form.' },
      { question: 'What are your hours?', answer: 'We are open 11am-10pm daily.' },
      { question: 'Do you deliver?', answer: 'Yes, we deliver within 5km radius.' }
    ],
    escalationRules: 'Transfer for: large parties (>10人), complaints, allergic reactions'
  },
  'Real Estate': {
    services: ['Property listings', 'Virtual tours', 'Financing info', ' viewing scheduling'],
    targetAudience: 'Home buyers and renters looking for properties',
    faq: [
      { question: 'What properties do you have?', answer: 'Check our listings page for available properties.' },
      { question: 'How do I schedule a viewing?', answer: 'Use the contact form or call us.' },
      { question: 'Do you offer financing?', answer: 'We can connect you with our financing partners.' }
    ],
    escalationRules: 'Transfer for: negotiation, legal questions, rental agreements'
  },
  'SaaS': {
    services: ['Product demonstrations', 'Free trial signup', 'Technical support', 'Billing inquiries'],
    targetAudience: 'Businesses looking for software solutions',
    faq: [
      { question: 'How do I start a free trial?', answer: 'Sign up on our website with your email.' },
      { question: 'What features are included?', answer: 'All features are included in the trial.' },
      { question: 'How do I upgrade?', answer: 'Go to Settings > Subscription in your dashboard.' }
    ],
    escalationRules: 'Transfer for: enterprise pricing, technical issues, billing disputes'
  }
};

const tones = [
  { id: 'formal', label: 'Formal', desc: 'Professional and business-like' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', desc: 'Expert and authoritative' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed and informal' }
];

export default function PRDBuilder() {
  const navigate = useNavigate();
  const { prd, setPRD, updatePRD, setFlowData, currentChatbot } = useChatbotStore();
  const [generatedFlow, setGeneratedFlow] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newFAQ, setNewFAQ] = useState<FAQ>({ question: '', answer: '' });

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

  const handleGenerateWithAI = async () => {
    if (!prd) return;
    setGenerating(true);

    const prompt = `Create a conversation flow for a ${prd.tone} AI chatbot for a ${prd.industry} company called "${prd.companyName}".
    
    Company Services: ${prd.services.join(', ')}
    Target Audience: ${prd.targetAudience}
    FAQ: ${prd.faq.map(f => `Q: ${f.question} A: ${f.answer}`).join('; ')}
    Escalation Rules: ${prd.escalationRules}
    
    Create a JSON flow with these nodes:
    1. START node - welcome message
    2. AI Response nodes for each FAQ as quick replies
    3. Intent detection for common queries
    4. Condition nodes for different scenarios
    5. END node - closing message
    
    Return ONLY valid JSON in this exact format:
    {"nodes": [{"id": "start", "type": "start", "position": {"x": 100, "y": 200}, "data": {"label": "Start", "message": "Welcome message"}}, ...], "edges": [...]}`;

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
      setGeneratedFlow(JSON.stringify({
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 200 }, data: { label: 'Start', message: `Welcome to ${prd.companyName}! How can I help you today?` } },
          { id: 'end', type: 'end', position: { x: 500, y: 200 }, data: { label: 'End', message: 'Thank you for chatting with us!' } }
        ],
        edges: [{ id: 'e1', source: 'start', target: 'end' }]
      }, null, 2));
      setFlowData({
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 200 }, data: { label: 'Start', message: `Welcome to ${prd.companyName}! How can I help you today?` } },
          { id: 'end', type: 'end', position: { x: 500, y: 200 }, data: { label: 'End', message: 'Thank you for chatting with us!' } }
        ],
        edges: [{ id: 'e1', source: 'start', target: 'end' }]
      });
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
          <button 
            onClick={handleGenerateWithAI}
            disabled={generating || !prd.services.length}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            Generate Flow with AI
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={prd.companyName}
                    onChange={(e) => setPRD({ ...prd, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Industry</label>
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
                <Users className="w-5 h-5 text-cyan-400" />
                Target Audience
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-2">Who is your ideal customer?</label>
                  <textarea
                    value={prd.targetAudience}
                    onChange={(e) => setPRD({ ...prd, targetAudience: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="Describe your target audience..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Bot Personality
              </h2>
              <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-slate-400 text-sm">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                Services You Offer
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
                  placeholder="Add a service..."
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
                <FileText className="w-5 h-5 text-cyan-400" />
                FAQ - Quick Replies
              </h2>
              <div className="space-y-3">
                {prd.faq.map((faq, i) => (
                  <div key={i} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-cyan-400 font-medium">Q: {faq.question}</p>
                        <p className="text-slate-300 mt-1">A: {faq.answer}</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Answer"
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button 
                  onClick={handleAddFAQ}
                  disabled={!newFAQ.question || !newFAQ.answer}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
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
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="When should the bot transfer to a human agent?"
              />
            </div>
          </div>
        </div>

        {generatedFlow && (
          <div className="mt-8 bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Generated Flow Preview</h2>
            <pre className="bg-slate-900 p-4 rounded-lg text-slate-300 text-sm overflow-auto max-h-64">
              {generatedFlow}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}