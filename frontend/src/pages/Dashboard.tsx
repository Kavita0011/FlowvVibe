import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, Plus, Settings, LogOut, MessageSquare, Users, BarChart3, 
  ChevronRight, Trash2, Edit, Play, Copy, ExternalLink 
} from 'lucide-react';
import type { Chatbot } from '../types';

const industries = [
  'E-commerce', 'Healthcare', 'Restaurant', 'Real Estate', 
  'SaaS', 'Education', 'Banking', 'Retail', 'Other'
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, chatbots, setCurrentChatbot, setChatbots, setPRD } = useChatbotStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', industry: '' });

  const handleCreateBot = () => {
    if (!newBot.name || !newBot.industry) return;
    
    const bot: Chatbot = {
      id: Date.now().toString(),
      userId: user?.id || '',
      name: newBot.name,
      industry: newBot.industry,
      tone: 'friendly',
      flow: { nodes: [], edges: [] },
      published: false,
      channels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatbots([...chatbots, bot]);
    setCurrentChatbot(bot);
    setPRD({
      id: Date.now().toString(),
      chatbotId: bot.id,
      companyName: newBot.name,
      industry: newBot.industry,
      services: [],
      targetAudience: '',
      faq: [],
      tone: 'friendly',
      createdAt: new Date()
    });
    setShowCreate(false);
    navigate('/prd');
  };

  const handleDeleteBot = (id: string) => {
    setChatbots(chatbots.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">FlowvVibe</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Welcome, {user?.displayName}</span>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Chatbots</h1>
            <p className="text-slate-400">Create and manage your AI chatbots</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Bot
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Chatbot</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={newBot.name}
                    onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                    placeholder="My Awesome Bot"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2">Industry</label>
                  <select
                    value={newBot.industry}
                    onChange={(e) => setNewBot({ ...newBot, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-400 rounded-lg hover:text-white hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateBot}
                    disabled={!newBot.name || !newBot.industry}
                    className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chatbots.length === 0 ? (
          <div className="text-center py-20">
            <Bot className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">No chatbots yet</h2>
            <p className="text-slate-400 mb-6">Create your first AI chatbot to get started</p>
            <button 
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((bot) => (
              <div key={bot.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    bot.published 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {bot.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{bot.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{bot.industry}</p>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                  <MessageSquare className="w-4 h-4" />
                  <span>{bot.flow.nodes.length} nodes</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCurrentChatbot(bot);
                      navigate('/flow');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Flow
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentChatbot(bot);
                      navigate('/preview');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </button>
                  <button 
                    onClick={() => handleDeleteBot(bot.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Messages</p>
                <p className="text-2xl font-bold text-white">1,234</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Chats</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Avg Rating</p>
                <p className="text-2xl font-bold text-white">4.8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}