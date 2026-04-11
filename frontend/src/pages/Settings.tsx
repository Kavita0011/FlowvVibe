import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, User, Bell, CreditCard, Key, Globe, Smartphone,
  Trash2, ExternalLink, Copy, Check, Loader2, MessageSquare, 
  Code, Shield, Database
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, reset } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('demo-api-key-12345');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    reset();
    navigate('/');
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({ ...user!, ...profile });
      setLoading(false);
    }, 1000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'channels', label: 'Channels', icon: Globe },
    { id: 'api', label: 'API & Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

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
              <span className="text-2xl font-bold text-white">Settings</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          <div className="w-56">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                    activeTab === tab.id
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Phone (optional)</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Channel Integrations</h2>
                <div className="space-y-4">
                  {[
                    { icon: Globe, name: 'Website', desc: 'Add chat widget to your website' },
                    { icon: MessageSquare, name: 'WhatsApp', desc: 'Connect WhatsApp Business' },
                    { icon: Smartphone, name: 'Telegram', desc: 'Connect Telegram bot' },
                    { icon: Code, name: 'Slack', desc: 'Add to Slack workspace' },
                  ].map((channel, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
                          <channel.icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{channel.name}</h3>
                          <p className="text-slate-400 text-sm">{channel.desc}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors">
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">API Keys</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-400 mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="demo-api-key-12345"
                        readOnly
                        className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                      <button 
                        onClick={handleCopyApiKey}
                        className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://your-server.com/webhook"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Keep your API key secure</h4>
                        <p className="text-slate-400 text-sm mt-1">
                          Never share your API key publicly. Use environment variables in your applications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
                    { id: 'push', label: 'Push notifications', desc: 'Browser push notifications' },
                    { id: 'sms', label: 'SMS alerts', desc: 'Important alerts via SMS' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <div>
                        <h3 className="text-white font-medium">{item.label}</h3>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications[item.id as keyof typeof notifications]}
                          onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Billing & Subscription</h2>
                <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Current Plan</p>
                      <h3 className="text-2xl font-bold text-white">Free Plan</h3>
                    </div>
                    <span className="px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      Active
                    </span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Check className="w-5 h-5 text-green-400" />
                    1 chatbot
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Check className="w-5 h-5 text-green-400" />
                    100 messages/month
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Check className="w-5 h-5 text-green-400" />
                    Basic features
                  </div>
                </div>
                <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors">
                  Upgrade to Pro - ₹499/month
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}