import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, Link, Plus, Trash2, Check, X, Slack, Mail, Globe, Database, ArrowRight, ExternalLink, Zap, Send, MessageCircle, Phone, Calendar, FileText, Users, BarChart3, Settings, Copy, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ChannelConfig {
  id: string;
  type: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'web';
  name: string;
  config: Record<string, string>;
  connected: boolean;
  status: 'active' | 'inactive' | 'error';
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
  preview: string;
}

const CHANNELS = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    icon: MessageCircle, 
    color: 'bg-green-500',
    description: 'Connect WhatsApp Business API',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text' },
      { key: 'accessToken', label: 'Access Token', type: 'password' },
      { key: 'businessAccountId', label: 'Business Account ID', type: 'text' }
    ]
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: Send, 
    color: 'bg-blue-500',
    description: 'Connect Telegram Bot API',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password' },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', readonly: true }
    ]
  },
  { 
    id: 'slack', 
    name: 'Slack', 
    icon: Slack, 
    color: 'bg-purple-500',
    description: 'Post to Slack channels',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password' },
      { key: 'channelId', label: 'Channel ID', type: 'text' },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password' }
    ]
  },
  { 
    id: 'discord', 
    name: 'Discord', 
    icon: Users, 
    color: 'bg-indigo-500',
    description: 'Discord server bot',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password' },
      { key: 'guildId', label: 'Server ID', type: 'text' },
      { key: 'channelId', label: 'Channel ID', type: 'text' }
    ]
  },
  { 
    id: 'web', 
    name: 'Web Widget', 
    icon: Globe, 
    color: 'bg-cyan-500',
    description: 'Embed on your website',
    fields: []
  }
];

const TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Customer Support Bot',
    description: 'Handle common support queries with AI',
    category: 'Support',
    nodes: [],
    edges: [],
    preview: '🎧'
  },
  {
    id: '2',
    name: 'Lead Generation',
    description: 'Capture and qualify leads automatically',
    category: 'Sales',
    nodes: [],
    edges: [],
    preview: '🎯'
  },
  {
    id: '3',
    name: 'Appointment Booking',
    description: 'Schedule meetings with calendar integration',
    category: 'Sales',
    nodes: [],
    edges: [],
    preview: '📅'
  },
  {
    id: '4',
    name: 'E-commerce Assistant',
    description: 'Product recommendations and order tracking',
    category: 'E-commerce',
    nodes: [],
    edges: [],
    preview: '🛒'
  },
  {
    id: '5',
    name: 'Real Estate Bot',
    description: 'Property listings and inquiries',
    category: 'Real Estate',
    nodes: [],
    edges: [],
    preview: '🏠'
  },
  {
    id: '6',
    name: 'FAQ Bot',
    description: 'Answer frequently asked questions',
    category: 'Support',
    nodes: [],
    edges: [],
    preview: '❓'
  },
];

export default function Integrations() {
  const navigate = useNavigate();
  const { currentChatbot } = useChatbotStore();
  const [activeTab, setActiveTab] = useState<'channels' | 'templates' | 'knowledge' | 'handoff' | 'testing' | 'calendar'>('channels');
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { id: 'web', type: 'web', name: 'Web Widget', config: { embedCode: '' }, connected: true, status: 'active' }
  ]);
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [knowledgeBase, setKnowledgeBase] = useState<{url: string; status: string}[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [handoffEnabled, setHandoffEnabled] = useState(true);
  const [activeAgents, setActiveAgents] = useState(3);
  const [calendarProvider, setCalendarProvider] = useState<'google' | 'calendly' | null>(null);
  const [calendarConfig, setCalendarConfig] = useState({ calendarId: '', webhookUrl: '' });

  const handleDeleteKnowledge = (index: number) => {
    setKnowledgeBase(prev => prev.filter((_, i) => i !== index));
    toast.success('Knowledge source removed');
  };

  const handleSaveCalendar = () => {
    if (!calendarProvider) {
      toast.error('Please select a calendar provider');
      return;
    }
    if (calendarProvider === 'calendly' && !calendarConfig.calendarId) {
      toast.error('Please enter your Calendly URL');
      return;
    }
    toast.success('Calendar booking enabled!');
  };

  const handleAddScoringRule = () => {
    toast.success('Add scoring rule modal would open here');
  };

  const handleCreateTest = () => {
    toast.success('Create new A/B test modal would open here');
  };

  const handleConnect = (channelId: string) => {
    const channel = CHANNELS.find(c => c.id === channelId);
    if (!channel) return;
    
    if (channelId === 'web') {
      const embedCode = `<script src="https://flowvibe.app/widget/${currentChatbot?.id || 'demo'}"></script>`;
      const newChannel: ChannelConfig = {
        id: channelId,
        type: channelId as any,
        name: channel.name,
        config: { embedCode },
        connected: true,
        status: 'active'
      };
      setChannels([...channels.filter(c => c.id !== channelId), newChannel]);
      toast.success(`${channel.name} connected!`);
      setShowConnectModal(null);
    } else {
      setConfigForm({});
      setShowConnectModal(channelId);
    }
  };

  const handleSaveConfig = () => {
    if (!showConnectModal) return;
    const channel = CHANNELS.find(c => c.id === showConnectModal);
    if (!channel) return;

    const newChannel: ChannelConfig = {
      id: showConnectModal,
      type: showConnectModal as any,
      name: channel.name,
      config: configForm,
      connected: true,
      status: 'active'
    };
    setChannels([...channels.filter(c => c.id !== showConnectModal), newChannel]);
    toast.success(`${channel.name} connected successfully!`);
    setShowConnectModal(null);
    setConfigForm({});
  };

  const handleDisconnect = (channelId: string) => {
    setChannels(channels.map(c => c.id === channelId ? { ...c, connected: false, status: 'inactive' } : c));
    toast.success('Channel disconnected');
  };

  const handleAddKnowledge = () => {
    if (!newUrl) return;
    setKnowledgeBase([...knowledgeBase, { url: newUrl, status: 'syncing' }]);
    setNewUrl('');
    toast.success('Knowledge base sync started');
    setTimeout(() => {
      setKnowledgeBase(kb => kb.map(k => k.url === newUrl ? { ...k, status: 'ready' } : k));
    }, 3000);
  };

  const copyEmbedCode = async () => {
    const channel = channels.find(c => c.type === 'web');
    if (channel?.config.embedCode) {
      try {
        await navigator.clipboard.writeText(channel.config.embedCode);
        toast.success('Embed code copied!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
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
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Integrations & Channels</h1>
        <p className="text-slate-400 mb-8">Deploy your chatbot across multiple platforms</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'channels', label: 'Channels', icon: Link },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'knowledge', label: 'Knowledge Base', icon: Database },
            { id: 'handoff', label: 'Human Handoff', icon: Users },
            { id: 'testing', label: 'A/B Testing', icon: BarChart3 },
            { id: 'calendar', label: 'Calendar', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHANNELS.map(channel => {
                const connected = channels.find(c => c.id === channel.id)?.connected;
                return (
                  <div key={channel.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-cyan-500 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${channel.color} rounded-lg flex items-center justify-center`}>
                        <channel.icon className="w-5 h-5 text-white" />
                      </div>
                      {connected && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-medium mb-1">{channel.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{channel.description}</p>
                    {connected ? (
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600">
                          <Settings className="w-4 h-4 inline mr-1" /> Configure
                        </button>
                        <button onClick={() => handleDisconnect(channel.id)} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleConnect(channel.id)}
                        className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-400"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Web Widget Embed */}
            {channels.find(c => c.type === 'web' && c.connected) && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Web Widget Embed Code</h3>
                <div className="flex gap-2">
                  <code className="flex-1 bg-slate-900 p-4 rounded-lg text-slate-300 text-sm overflow-x-auto">
                    {channels.find(c => c.type === 'web')?.config.embedCode}
                  </code>
                  <button onClick={copyEmbedCode} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  Copy this code and paste it before the closing &lt;/body&gt; tag on your website.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(template => (
              <div key={template.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
                <div className="text-4xl mb-4">{template.preview}</div>
                <h3 className="text-white font-medium mb-2">{template.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{template.description}</p>
                <span className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                  {template.category}
                </span>
                <button
                  onClick={() => {
                    toast.success(`Template "${template.name}" applied!`);
                    navigate('/flow');
                  }}
                  className="mt-4 w-full py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 text-sm"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Add Knowledge Sources</h3>
              <p className="text-slate-400 text-sm mb-4">Upload PDFs or add URLs for the AI to learn from.</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
                <button onClick={handleAddKnowledge} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
                  Add URL
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Drag & drop PDFs here or click to upload</p>
                <p className="text-slate-500 text-sm">Supports PDF, DOC, TXT (max 10MB)</p>
              </div>
            </div>

            {knowledgeBase.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Synced Sources</h3>
                <div className="space-y-3">
                  {knowledgeBase.map((kb, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-white text-sm truncate max-w-md">{kb.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {kb.status === 'syncing' && <span className="text-yellow-400 text-sm">Syncing...</span>}
                        {kb.status === 'ready' && <span className="text-green-400 text-sm flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>}
                        <button onClick={() => handleDeleteKnowledge(i)} className="text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Human Handoff Tab */}
        {activeTab === 'handoff' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Human Handoff</h3>
                  <p className="text-slate-400 text-sm">Transfer to human agent when AI can't help</p>
                </div>
                <button
                  onClick={() => setHandoffEnabled(!handoffEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${handoffEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${handoffEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Active Agents</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Support Team', online: true, chats: 3 },
                  { name: 'Sales Team', online: true, chats: 5 },
                  { name: 'VIP Support', online: false, chats: 0 }
                ].map((agent, i) => (
                  <div key={i} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${agent.online ? 'bg-green-500' : 'bg-slate-500'}`} />
                      <span className="text-white font-medium">{agent.name}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{agent.chats} active chats</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* A/B Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">A/B Test: Greeting Message</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700 rounded-lg border-2 border-green-500/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-medium">Variant A</span>
                    <span className="text-slate-400 text-sm">50% traffic</span>
                  </div>
                  <p className="text-white">👋 Hi! Welcome to our store. How can I help you today?</p>
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Engagement Rate</span>
                      <span className="text-cyan-400 font-medium">68%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 font-medium">Variant B</span>
                    <span className="text-slate-400 text-sm">50% traffic</span>
                  </div>
                  <p className="text-white">🎯 Looking for something specific? I'm here to help!</p>
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Engagement Rate</span>
                      <span className="text-slate-400 font-medium">52%</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleCreateTest} className="mt-4 w-full py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
                Create New Test
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Lead Scoring Rules</h3>
              <div className="space-y-3">
                {[
                  { action: 'Asked about pricing', points: '+10' },
                  { action: 'Provided email', points: '+15' },
                  { action: 'Requested demo', points: '+25' },
                  { action: 'Inactive for 24h', points: '-5' }
                ].map((rule, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">{rule.action}</span>
                    <span className={rule.points.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{rule.points} pts</span>
                  </div>
                ))}
              </div>
              <button onClick={handleAddScoringRule} className="mt-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                <Plus className="w-4 h-4" /> Add scoring rule
              </button>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                onClick={() => setCalendarProvider('google')}
                className={`bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer ${calendarProvider === 'google' ? 'border-cyan-500' : ''}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-800" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Google Calendar</h3>
                    <p className="text-slate-400 text-sm">Sync with Google Calendar</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                  Connect Google Calendar
                </button>
              </div>

              <div 
                onClick={() => setCalendarProvider('calendly')}
                className={`bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer ${calendarProvider === 'calendly' ? 'border-cyan-500' : ''}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Calendly</h3>
                    <p className="text-slate-400 text-sm">Connect Calendly scheduling</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                  Connect Calendly
                </button>
              </div>
            </div>

            {calendarProvider && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {calendarProvider === 'google' ? 'Google Calendar Settings' : 'Calendly Settings'}
                </h3>
                {calendarProvider === 'google' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Calendar ID</label>
                      <input
                        type="text"
                        value={calendarConfig.calendarId}
                        onChange={(e) => setCalendarConfig({ ...calendarConfig, calendarId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="your-calendar-id@group.calendar.google.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Webhook URL (for notifications)</label>
                      <input
                        type="text"
                        readOnly
                        value={`https://flowvibe.app/webhooks/calendar/${currentChatbot?.id}`}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Calendly URL</label>
                      <input
                        type="url"
                        value={calendarConfig.calendarId}
                        onChange={(e) => setCalendarConfig({ ...calendarConfig, calendarId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="https://calendly.com/your-username"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">API Webhook</label>
                      <input
                        type="text"
                        readOnly
                        value={`https://flowvibe.app/webhooks/calendly/${currentChatbot?.id}`}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
                      />
                    </div>
                  </div>
                )}
                <button onClick={handleSaveCalendar} className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 text-sm">
                  Save & Enable Booking
                </button>
              </div>
            )}

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Booking Widget Preview</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Schedule a Consultation</span>
                </div>
                <p className="text-slate-400 text-sm mb-3">Select a time that works for you:</p>
                <div className="grid grid-cols-3 gap-2">
                  {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map(time => (
                    <button key={time} className="py-2 bg-slate-700 text-white text-sm rounded hover:bg-cyan-500">
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConnectModal(null)}>
          <div className="bg-slate-800 rounded-xl p-6 w-[450px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Connect {CHANNELS.find(c => c.id === showConnectModal)?.name}
              </h2>
              <button onClick={() => setShowConnectModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {CHANNELS.find(c => c.id === showConnectModal)?.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-slate-400 mb-2 text-sm">{field.label}</label>
                  <input
                    type={field.type}
                    value={configForm[field.key] || ''}
                    onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                    readOnly={field.readonly}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConnectModal(null)} className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                Cancel
              </button>
              <button onClick={handleSaveConfig} className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400">
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}