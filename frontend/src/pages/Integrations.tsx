import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, Link, Plus, Trash2, Check, X, Slack, Mail, Globe, Database, ArrowRight, ExternalLink, Zap, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Webhook {
  id: string;
  name: string;
  url: string;
  event: string;
  active: boolean;
}

const INTEGRATIONS = [
  { id: 'zapier', name: 'Zapier', icon: Zap, description: 'Connect to 5000+ apps', color: 'bg-orange-500' },
  { id: 'slack', name: 'Slack', icon: Slack, description: 'Notify team in Slack', color: 'bg-purple-500' },
  { id: 'whatsapp', name: 'WhatsApp', icon: Send, description: 'WhatsApp Business API', color: 'bg-green-500' },
  { id: 'mailchimp', name: 'Mailchimp', icon: Mail, description: 'Email marketing', color: 'bg-yellow-500' },
  { id: 'salesforce', name: 'Salesforce', icon: Database, description: 'CRM integration', color: 'bg-blue-500' },
  { id: 'hubspot', name: 'HubSpot', icon: Database, description: 'Marketing CRM', color: 'bg-orange-600' },
  { id: 'webhook', name: 'Custom Webhook', icon: Globe, description: 'Any HTTP endpoint', color: 'bg-cyan-500' }
];

const WEBHOOK_EVENTS = [
  'conversation.started',
  'conversation.ended',
  'lead.collected',
  'booking.created',
  'message.received'
];

export default function Integrations() {
  const navigate = useNavigate();
  const { currentChatbot } = useChatbotStore();
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: '1', name: 'Slack Notify', url: 'https://hooks.slack.com/xxx', event: 'lead.collected', active: true },
    { id: '2', name: 'Zapier Flow', url: 'https://hooks.zapier.com/xxx', event: 'booking.created', active: true }
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', event: 'lead.collected' });

  const handleAddWebhook = () => {
    if (newWebhook.name && newWebhook.url) {
      setWebhooks([...webhooks, { ...newWebhook, id: Date.now().toString(), active: true }]);
      setNewWebhook({ name: '', url: '', event: 'lead.collected' });
      setShowAdd(false);
    }
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  if (!currentChatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Chatbot Selected</h2>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-3 bg-cyan-500 text-white rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-slate-400 mb-8">Connect your chatbot to external services</p>

        {/* Available Integrations */}
        <h2 className="text-xl font-semibold text-white mb-4">Available Integrations</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {INTEGRATIONS.map((int) => (
            <div key={int.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
              <div className={`w-10 h-10 ${int.color} rounded-lg flex items-center justify-center mb-3`}>
                <int.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-medium">{int.name}</h3>
              <p className="text-slate-400 text-sm">{int.description}</p>
              <button className="mt-3 flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300">
                Connect <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Webhooks */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Webhooks</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
            <Plus className="w-4 h-4" /> Add Webhook
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleWebhook(webhook.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${webhook.active ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}>
                  {webhook.active && <Check className="w-3 h-3 text-white" />}
                </button>
                <div>
                  <h4 className="text-white font-medium">{webhook.name}</h4>
                  <p className="text-slate-400 text-sm">{webhook.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">{webhook.event}</span>
                <button onClick={() => deleteWebhook(webhook.id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <Link className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No webhooks configured</p>
            </div>
          )}
        </div>

        {/* Add Webhook Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Add Webhook</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-2">Name</label>
                  <input type="text" value={newWebhook.name} onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })} placeholder="My Webhook" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Webhook URL</label>
                  <input type="url" value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Event</label>
                  <select value={newWebhook.event} onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white">
                    {WEBHOOK_EVENTS.map((event) => (
                      <option key={event} value={event}>{event}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-slate-600 text-white rounded-xl hover:bg-slate-700">Cancel</button>
                <button onClick={handleAddWebhook} className="flex-1 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Zapier CTA */}
        <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Connect with Zapier</h3>
              <p className="text-slate-400 text-sm">Automate workflows with 5000+ apps</p>
            </div>
            <a href="https://zapier.com" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400">
              Connect <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}