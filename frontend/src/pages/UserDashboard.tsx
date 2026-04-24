import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import type { PRD } from '../types';
import { cn } from '../utils/cn';
import {
  Bot, ArrowLeft, Plus, Settings, CreditCard, Users, MessageSquare,
  TrendingUp, Calendar, Clock, LogOut, Copy, ExternalLink, MoreVertical,
  ChevronRight, Zap, Star, Check, AlertCircle, Play, Pause, Trash2,
  Mail, Phone, Building2, MapPin, User, Search, Filter, RefreshCw, Eye,
  ChevronLeft, ChevronDown
} from 'lucide-react';
import { fetchLeadsByChatbot, updateLeadStatus, deleteLead } from '../lib/crud';
import toast from 'react-hot-toast';
import { chatbotsApi, subscriptions, pricing, profile as profileApi, admin } from '../lib/api';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    payments, 
    chatbots: storeChatbots, 
    setPRD, 
    setCurrentChatbot,
    getUserBots,
    canEditBot,
    canDeleteBot,
    activateBot,
    deactivateBot,
    deleteChatbot,
    isAdmin 
  } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('bots');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [dbChatbots, setDbChatbots] = useState<ChatbotRow[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentRow[]>([]);
  const [dbLeads, setDbLeads] = useState<LeadRow[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState('all');
  const [dbBookings, setDbBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profile, setProfile] = useState({ companyName: '', location: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '' });
  const [stats, setStats] = useState({
    totalBots: 0,
    conversations: 0,
    leads: 0,
    avgRating: 0
  });
  const [subscription, setSubscription] = useState<{
    tier_name: string;
    tier_id: string;
    status: string;
    expires_at: string;
  } | null>(null);
  const upgradeClicked = () => navigate('/pricing');

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      await profileApi.update({
        displayName: user.displayName,
        companyName: profile.companyName,
        location: profile.location
      });
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.newPass) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwords.newPass.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await profileApi.updatePassword(passwords.newPass);
      toast.success('Password updated successfully!');
      setPasswords({ current: '', newPass: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    if (!confirm('This will permanently delete all your chatbots, leads, and data. Continue?')) {
      return;
    }
    try {
      await profileApi.delete();
      logout();
      navigate('/');
      toast.success('Account marked for deletion');
    } catch {
      toast.error('Failed to delete account');
    }
  };
  
  // Get user's bots (or all bots if admin)
  const userBots = getUserBots();

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch user's chatbots from backend API (Neon)
        const botsData = await chatbotsApi.getAll();
        const myBots = botsData?.filter(b => b.user_id === user.id) || [];
        setDbChatbots(myBots);

        // Fetch user subscription
        const subData = await subscriptions.get();
        if (subData) {
          setSubscription({
            tier_name: subData.tier?.name || 'Free',
            tier_id: subData.tier_id || 'free',
            status: subData.status,
            expires_at: subData.expires_at
          });
        }

        // Fetch pricing tiers
        const tiersData = await pricing.getTiers();
        if (tiersData && tiersData.length > 0) {
          setPlansList(tiersData.map((tier: any) => ({
            id: tier.tier_key || tier.id,
            name: tier.name,
            price: tier.price,
            features: tier.metadata?.features || [],
            popular: tier.is_featured || false
          })));
        }
        
        // Fetch leads for user's chatbots
        let leads: any[] = [];
        if (myBots.length > 0) {
          const leadsData = await admin.getLeads();
          if (leadsData) {
            leads = leadsData.filter((l: any) => myBots.some((b: any) => b.id === l.chatbot_id));
            setDbLeads(leads);
          }
        }

        setStats({
          totalBots: myBots.length,
          conversations: myBots.reduce((acc, b) => acc + (b.conversations_count || 0), 0),
          leads: leads.length,
          avgRating: 4.5
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user?.id]);

  const userPayments = dbPayments.length > 0 ? dbPayments : payments.filter(p => p.userId === user?.id);
  const userChatbots = dbChatbots.length > 0 ? dbChatbots : storeChatbots.filter(c => c.userId === user?.id);
  
  // Calculate totals from real data
  const totalSpent = dbPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const completedPayments = dbPayments.filter(p => p.status === 'completed').length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">Please sign in to view your dashboard.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">My Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg"
            >
              <Zap className="w-4 h-4" />
              Upgrade
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-700 rounded-lg">
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{user.displayName?.[0] || 'U'}</span>
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-sm">{user.displayName}</p>
                <p className="text-slate-400 text-xs">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-1">
            {[
              { id: 'bots', label: 'My Chatbots', icon: Bot },
              { id: 'leads', label: 'My Leads', icon: Users },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeTab === item.id
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {/* My Chatbots Tab */}
          {activeTab === 'bots' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">My Chatbots</h1>
                <button 
                  onClick={() => {
                    const newPRD: PRD = {
                      id: `prd_${Date.now()}`,
                      chatbotId: '',
                      companyName: '',
                      industry: '',
                      services: [],
                      targetAudience: '',
                      tone: 'friendly',
                      faq: [],
                      escalationRules: '',
                      createdAt: new Date()
                    };
                    setPRD(newPRD);
                    navigate('/prd');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create New Bot
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userBots.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                    <Bot className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">No chatbots yet</h3>
                    <p className="text-slate-400 mb-4">Create your first chatbot to get started</p>
                    <button 
                      onClick={() => {
                        const newPRD: PRD = {
                          id: `prd_${Date.now()}`,
                          chatbotId: '',
                          companyName: '',
                          industry: '',
                          services: [],
                          targetAudience: '',
                          tone: 'friendly',
                          faq: [],
                          escalationRules: '',
                          createdAt: new Date()
                        };
                        setPRD(newPRD);
                        navigate('/prd');
                      }}
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                      Create Bot
                    </button>
                  </div>
                ) : (
                  userBots.map((bot) => (
                    <div key={bot.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <Bot className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            bot.status === 'active' ? "bg-green-500/20 text-green-400" :
                            bot.status === 'draft' ? "bg-amber-500/20 text-amber-400" :
                            bot.status === 'inactive' ? "bg-red-500/20 text-red-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {bot.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-1">{bot.name}</h3>
                      <p className="text-slate-400 text-sm mb-4">{bot.industry}</p>
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                        <span>Updated {new Date(bot.updatedAt).toLocaleDateString()}</span>
                        <span>{bot.published ? 'Published' : 'Unpublished'}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => {
                            setCurrentChatbot(bot);
                            navigate('/flow');
                          }}
                          disabled={!canEditBot(bot.id)}
                          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentChatbot(bot);
                            navigate('/preview');
                          }}
                          className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm transition-colors"
                        >
                          Test
                        </button>
                        {bot.status === 'active' ? (
                          <button 
                            onClick={() => deactivateBot(bot.id)}
                            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors"
                            title="Deactivate"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => activateBot(bot.id)}
                            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                            title="Activate"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteBot(bot.id) && (
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this bot?')) {
                                deleteChatbot(bot.id);
                              }
                            }}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: 'Create Bot', action: () => {
                      const newPRD: PRD = {
                        id: `prd_${Date.now()}`,
                        chatbotId: '',
                        companyName: '',
                        industry: '',
                        services: [],
                        targetAudience: '',
                        tone: 'friendly',
                        faq: [],
                        escalationRules: '',
                        createdAt: new Date()
                      };
                      setPRD(newPRD);
                      navigate('/prd');
                    }, icon: Plus },
                    { label: 'View Analytics', action: () => navigate('/analytics'), icon: TrendingUp },
                    { label: 'Export Data', action: () => {
                      const blob = new Blob([JSON.stringify({ chatbots: user.chatbots, stats }, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `flowvibe_export_${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Data exported successfully!');
                    }, icon: Copy },
                    { label: 'Get Help', action: () => navigate('/guide'), icon: MessageSquare }
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={action.action}
                      className="flex items-center gap-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white text-sm transition-colors"
                    >
                      <action.icon className="w-5 h-5 text-cyan-400" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-8">Payment History</h1>

              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <Bot className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +{stats.totalBots > 0 ? '1' : '0'}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalBots}</p>
                  <p className="text-slate-400 text-sm">Total Bots</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <MessageSquare className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +24%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.conversations.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Conversations</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +12%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.leads}</p>
                  <p className="text-slate-400 text-sm">Leads Collected</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <Star className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +0.2
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.avgRating}</p>
                  <p className="text-slate-400 text-sm">Avg Rating</p>
                </div>
              </div>
              
              {loading && (
                <div className="text-center py-4">
                  <p className="text-slate-400">Loading data...</p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-white">Pro</p>
                  <p className="text-cyan-400 text-sm">₹499/month</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-white">₹1,997</p>
                  <p className="text-slate-400 text-sm">4 payments</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Next Payment</p>
                  <p className="text-2xl font-bold text-white">Jan 1, 2026</p>
                  <p className="text-slate-400 text-sm">Auto-renew</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Plan</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Amount</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Method</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No payments found. Upgrade your plan to get started.
                        </td>
                      </tr>
                    ) : (
                      userPayments.map((payment: any) => (
                        <tr key={payment.id} className="border-t border-slate-700">
                          <td className="px-6 py-4 text-white">
                            {new Date(payment.created_at || payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-white capitalize">{payment.plan}</td>
                          <td className="px-6 py-4 text-white">₹{payment.amount}</td>
                          <td className="px-6 py-4 text-slate-400 capitalize">{payment.method || payment.payment_method || 'UPI'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              payment.status === 'completed' ? "bg-green-500/20 text-green-400" :
                              payment.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                              "bg-red-500/20 text-red-400"
                            )}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                            {payment.transaction_id || payment.transactionId || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">UPI</span>
                    </div>
                    <div>
                      <p className="text-white text-sm">flowvibe@yesbank</p>
                      <p className="text-slate-400 text-xs">Default</p>
                    </div>
                  </div>
                  <button className="text-cyan-400 text-sm">Edit</button>
                </div>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-8">Account Settings</h1>

              {/* Profile Settings */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Profile Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user.displayName}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      disabled
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Company Name</label>
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button onClick={handleSaveProfile} disabled={profileLoading} className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2">
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

{/* Subscription Settings */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Subscription
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">
                      {subscription ? subscription.tier_name : 'Free Plan'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {subscription
                        ? `Renews on ${new Date(subscription.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Upgrade for unlimited access'}
                    </p>
                  </div>
                  <button
                    onClick={upgradeClicked}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                  >
                    {subscription ? 'Manage' : 'Upgrade'}
                  </button>
                </div>
              </div>

              {/* Password & Security */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Password & Security
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Current Password</label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">New Password</label>
                    <input
                      type="password"
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                      placeholder="Enter new password (min 8 chars)"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <button onClick={handleUpdatePassword} disabled={passwordLoading} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2">
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-slate-800 rounded-xl p-6 border border-red-500/20">
                <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button onClick={handleDeleteAccount} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500 rounded-lg">
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
              <button 
                onClick={() => setShowUpgrade(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                ×
              </button>
            </div>
            <div className="p-6 grid md:grid-cols-3 gap-6">
              {plansList.length > 0 ? plansList.map((plan) => (
                <div 
                  key={plan.id}
                  className={cn(
                    "relative bg-slate-700/50 rounded-xl p-6 border",
                    plan.popular ? "border-cyan-500" : "border-slate-600"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-white mb-4">
                    ₹{plan.price}
                    <span className="text-slate-400 text-sm font-normal">/month</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => navigate('/payment', { state: { plan: plan.id, addons: [], total: plan.price * 1 } })}
                    className={cn(
                      "w-full py-3 rounded-lg font-medium transition-colors",
                      plan.popular 
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                        : "bg-slate-600 text-white hover:bg-slate-500"
                    )}
                  >
                    {plan.price === 0 ? 'Current Plan' : `Buy for ₹${plan.price}`}
                  </button>
                </div>
              )) : (
                <div className="col-span-3 text-center text-slate-400 py-8">
                  Loading plans...
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}