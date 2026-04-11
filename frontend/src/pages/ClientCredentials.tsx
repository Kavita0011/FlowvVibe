import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, Slack, Send, Database, Key, Check, X, ExternalLink, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ChannelConfig {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  authUrl?: string;
}

export default function ClientCredentials() {
  const navigate = useNavigate();
  const { currentChatbot } = useChatbotStore();
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { id: 'slack', name: 'Slack', icon: Slack, connected: false, description: 'Connect your Slack workspace to receive notifications', authUrl: '/api/slack/oauth' },
    { id: 'whatsapp', name: 'WhatsApp', icon: Send, connected: false, description: 'Connect WhatsApp Business API' },
    { id: 'crm', name: 'CRM', icon: Database, connected: false, description: 'Connect Salesforce, HubSpot, or any CRM' },
    { id: 'custom', name: 'Custom Webhook', icon: Key, connected: false, description: 'Add your own API endpoint' }
  ]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState({ url: '', token: '', apiKey: '' });

  const handleConnect = async (channel: ChannelConfig) => {
    if (channel.id === 'custom') {
      if (!configForm.url) return;
      // Save custom webhook
      await fetch(`${API_URL}/api/webhooks/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: currentChatbot?.id,
          url: configForm.url,
          token: configForm.token
        })
      });
    }
    setChannels(channels.map(c => c.id === channel.id ? { ...c, connected: true } : c));
  };

  const handleDisconnect = (channelId: string) => {
    setChannels(channels.map(c => c.id === channelId ? { ...c, connected: false } : c));
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
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Connect Your Channels</h1>
        <p className="text-slate-400 mb-8">Connect your own accounts to {currentChatbot.name}</p>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3 mb-8">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium">Bring Your Own Credentials</h4>
            <p className="text-slate-400 text-sm">Connect your own Slack, WhatsApp, or CRM. All data stays with you. No extra cost.</p>
          </div>
        </div>

        {/* Channels */}
        <div className="space-y-4 mb-8">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${channel.connected ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                    <channel.icon className={`w-6 h-6 ${channel.connected ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {channel.name}
                      {channel.connected && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Connected</span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-sm">{channel.description}</p>
                  </div>
                </div>
                {channel.connected ? (
                  <button onClick={() => handleDisconnect(channel.id)} className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10">
                    Disconnect
                  </button>
                ) : (
                  <button onClick={() => setSelectedChannel(channel.id)} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
                    Connect
                  </button>
                )}
              </div>

              {/* Custom Webhook Form */}
              {selectedChannel === channel.id && channel.id === 'custom' && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-2">Webhook URL *</label>
                    <input type="url" value={configForm.url} onChange={(e) => setConfigForm({ ...configForm, url: e.target.value })} placeholder="https://your-api.com/webhook" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Auth Token (optional)</label>
                    <input type="password" value={configForm.token} onChange={(e) => setConfigForm({ ...configForm, token: e.target.value })} placeholder="Bearer xxx or Basic xxx" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedChannel(null)} className="px-4 py-2 border border-slate-600 text-white rounded-lg hover:bg-slate-700">Cancel</button>
                    <button onClick={() => handleConnect(channel)} disabled={!configForm.url} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 disabled:opacity-50">Save</button>
                  </div>
                </div>
              )}

              {/* OAuth Buttons */}
              {selectedChannel === channel.id && channel.id !== 'custom' && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 w-full justify-center">
                    <ExternalLink className="w-4 h-4" /> Connect {channel.name}
                  </button>
                  <p className="text-slate-400 text-xs text-center mt-2">You'll be redirected to authorize</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">How to get credentials:</h3>
          <div className="space-y-3 text-slate-400 text-sm">
            <div className="flex gap-3">
              <span className="text-cyan-400">1.</span>
              <span><strong className="text-white">Slack:</strong> Go to api.slack.com/apps → Create New App → Get Bot User OAuth Token</span>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400">2.</span>
              <span><strong className="text-white">WhatsApp:</strong> Meta Business → WhatsApp Business API → Get credentials</span>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400">3.</span>
              <span><strong className="text-white">CRM:</strong> Salesforce/HubSpot → Connected Apps → Get API Key</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}