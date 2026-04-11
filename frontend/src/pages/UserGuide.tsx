import { useState } from 'react';
import { Bot, Play, MessageSquare, GitBranch, Webhook, BarChart, Settings, Zap, BookOpen, HelpCircle, ArrowRight, ExternalLink, CheckCircle, ChevronDown, ChevronRight, MessageCircle, FileText, Download } from 'lucide-react';

const sections = [
  {
    id: 'quickstart',
    title: 'Quick Start Guide',
    icon: Play,
    content: [
      { title: '1. Create Your Account', desc: 'Sign up at /register with your email and password.' },
      { title: '2. Create a Chatbot', desc: 'Go to Dashboard and click "New Chatbot". Give it a name and select industry.' },
      { title: '3. Build the Flow', desc: 'Use Flow Builder - drag and drop nodes to create conversation flow.' },
      { title: '4. Train AI', desc: 'Add intents and training phrases in NLP Training page.' },
      { title: '5. Deploy', desc: 'Go to Embed page, copy code, and paste into your website.' }
    ]
  },
  {
    id: 'flowbuilder',
    title: 'Flow Builder',
    icon: GitBranch,
    content: [
      { title: 'Start Node', desc: 'Conversation begins here. Set welcome message.' },
      { title: 'AI Response', desc: 'Bot responds with AI-generated replies.' },
      { title: 'Input Nodes', desc: 'Collect text, email, phone from users.' },
      { title: 'Conditions', desc: 'Branch based on user input or state.' },
      { title: 'Actions', desc: 'Send email, call webhook, transfer to agent.' },
      { title: 'Premium Nodes', desc: 'Bookings, calls, CRM - requires paid add-ons.' }
    ]
  },
  {
    id: 'nlp',
    title: 'NLP & Training',
    icon: Bot,
    content: [
      { title: 'Intents', desc: 'User intentions your bot understands (greeting, pricing, support).' },
      { title: 'Training Phrases', desc: 'Examples of what users might say. Add 5-10 minimum.' },
      { title: 'Responses', desc: 'What bot replies to each intent.' },
      { title: 'Entities', desc: 'Data to extract (dates, names, emails).' },
      { title: 'Train Model', desc: 'Click Train to update AI after making changes.' }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Webhook,
    content: [
      { title: 'Slack', desc: 'Get Bot User OAuth Token from Slack API.' },
      { title: 'WhatsApp', desc: 'Get WhatsApp Business API credentials.' },
      { title: 'Zapier', desc: 'Connect webhooks to 5000+ apps.' },
      { title: 'Webhooks', desc: 'Custom HTTP endpoints for any integration.' },
      { title: 'CRM', desc: 'Salesforce, HubSpot connections available.' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart,
    content: [
      { title: 'Conversations', desc: 'Total chats started with bot.' },
      { title: 'Messages', desc: 'Total messages exchanged.' },
      { title: 'Response Time', desc: 'Average bot response in seconds.' },
      { title: 'Satisfaction', desc: 'User ratings (if enabled).' },
      { title: 'Leads', desc: 'Contact info collected from visitors.' }
    ]
  },
  {
    id: 'channels',
    title: 'Channels',
    icon: MessageSquare,
    content: [
      { title: 'Website Widget', desc: 'Embed code for any website.' },
      { title: 'WhatsApp', desc: 'Connect WhatsApp Business API.' },
      { title: 'Slack', desc: 'Add bot to Slack workspace.' },
      { title: 'API Access', desc: 'REST API for custom integrations.' }
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing & Plans',
    icon: Zap,
    content: [
      { title: 'Free', desc: '1 chatbot, 50 conversations/month.' },
      { title: 'Pro ₹499/mo', desc: '5 chatbots, unlimited conversations.' },
      { title: 'Enterprise', desc: 'Unlimited, custom integrations.' },
      { title: 'Add-ons', desc: 'Bookings (₹199), Calls (₹299), Webhooks (₹199).' }
    ]
  }
];

export default function UserGuide() {
  const [openSection, setOpenSection] = useState('quickstart');
  const [search, setSearch] = useState('');

  const filteredSections = sections.map(section => ({
    ...section,
    content: section.content.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.content.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">User Guide</h1>
          <p className="text-slate-400">Everything you need to know about FlowvVibe</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search guide..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <a href="#quickstart" className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 text-center">
            <Play className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <span className="text-white text-sm">Quick Start</span>
          </a>
          <a href="#flowbuilder" className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 text-center">
            <GitBranch className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <span className="text-white text-sm">Flow Builder</span>
          </a>
          <a href="#integrations" className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 text-center">
            <Webhook className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <span className="text-white text-sm">Integrations</span>
          </a>
          <a href="#analytics" className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 text-center">
            <BarChart className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <span className="text-white text-sm">Analytics</span>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <FAQItem question="How do I embed the chatbot on my website?" answer="Go to /embed page, select your chatbot, copy the code, and paste into your website's HTML." />
            <FAQItem question="Can I use my own AI model?" answer="Yes! Connect OpenRouter API key in backend .env for custom AI." />
            <FAQItem question="How does billing work?" answer="Monthly subscription. Add-ons are extra per month. Cancel anytime." />
            <FAQItem question="Is there a free trial?" answer="Free plan available with basic features. No credit card needed." />
            <FAQItem question="Can I export my chatbot?" answer="Yes, go to Settings > Export to download your bot." />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filteredSections.map((section) => (
            <div key={section.id} id={section.id} className="bg-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <section.icon className="w-5 h-5 text-cyan-400" />
                <span className="flex-1 text-white font-medium">{section.title}</span>
                {openSection === section.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
              {openSection === section.id && (
                <div className="px-4 pb-4 space-y-3">
                  {section.content.map((item, i) => (
                    <div key={i} className="pl-8">
                      <h4 className="text-white font-medium">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help */}
        <div className="mt-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-6 border border-cyan-500/30">
          <h3 className="text-white font-semibold mb-2">Need More Help?</h3>
          <p className="text-slate-400 mb-4">Contact our support team</p>
          <a href="mailto:support@flowvibe.ai" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
            <HelpCircle className="w-4 h-4" /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-800 rounded-lg">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between text-left">
        <span className="text-white">{question}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <p className="px-4 pb-4 text-slate-400">{answer}</p>}
    </div>
  );
}