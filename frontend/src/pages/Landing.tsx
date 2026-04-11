import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { Bot, MessageSquare, Zap, Globe, Phone, Mail, ChevronRight, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { setUser } = useChatbotStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setUser({
        id: 'demo-user',
        email: email || 'demo@example.com',
        displayName: 'Demo User',
        createdAt: new Date()
      });
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">FlowvVibe</span>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
        >
          Get Started
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build Smart AI Chatbots
            <span className="block text-cyan-400">in Minutes, Not Days</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Create powerful AI chatbots with our visual flow builder. 
            PRD to production in a few clicks. Deploy anywhere.
          </p>
          <form onSubmit={handleStart} className="flex gap-4 max-w-md mx-auto">
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
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Loading...' : (
                <>
                  Start Free <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Bot, title: 'AI-Powered', desc: 'Smart intent detection & natural conversations' },
            { icon: MessageSquare, title: 'Visual Builder', desc: 'Drag-drop flow design with React Flow' },
            { icon: Zap, title: 'Multi-Channel', desc: 'Website, WhatsApp, Telegram & more' }
          ].map((feature, i) => (
            <div key={i} className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center hover:border-cyan-500/50 transition-colors">
              <feature.icon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-12 border border-slate-700">
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
                    <p className="text-white text-sm">Great! What size would you like? We have small, medium, and large.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}