import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Users, MessageSquare, BarChart3, DollarSign,
  Settings, Key, Copy, Check, ChevronDown, LogOut, TrendingUp,
  MessageCircle, PieChart, Activity, CreditCard, Wallet
} from 'lucide-react';
import { fetchUsers, fetchChatbots, fetchPayments, fetchLeads, fetchConversations } from '../lib/supabase';
import type { Database } from '../types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];
type ChatbotRow = Database['public']['Tables']['chatbots']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type ConversationRow = Database['public']['Tables']['conversations']['Row'];

export default function Admin() {
  const navigate = useNavigate();
  const { user, setUser } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Real data from database
  const [dbUsers, setDbUsers] = useState<UserRow[]>([]);
  const [dbChatbots, setDbChatbots] = useState<ChatbotRow[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentRow[]>([]);
  const [dbLeads, setDbLeads] = useState<LeadRow[]>([]);
  const [dbConversations, setDbConversations] = useState<ConversationRow[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeChats: 0,
    messagesToday: 0,
    revenue: 0
  });

  // Load credentials from localStorage or use defaults
  const [adminCredentials, setAdminCredentials] = useState(() => {
    const saved = localStorage.getItem('adminCredentials');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults if parse fails
      }
    }
    return {
      adminId: 'FV_ADMIN_001',
      email: 'devappkavita@gmail.com',
      password: 'kavitabisht2598@sbi',
      apiKey: 'fv_live_sk_1234567890abcdefghijklmnopqrstuvwxyz',
      dashboardUrl: 'https://flowvibe.ai/admin'
    };
  });

  // Editable copy of credentials
  const [editableCredentials, setEditableCredentials] = useState(adminCredentials);

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditableCredentials({ ...adminCredentials });
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableCredentials({ ...adminCredentials });
  };

  const handleSave = () => {
    // Validate required fields
    if (!editableCredentials.email || !editableCredentials.password) {
      alert('Email and password are required');
      return;
    }
    
    // Save to state and localStorage
    setAdminCredentials({ ...editableCredentials });
    localStorage.setItem('adminCredentials', JSON.stringify(editableCredentials));
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChange = (field: string, value: string) => {
    setEditableCredentials(prev => ({ ...prev, [field]: value }));
  };

  // Fetch real data from database
  useEffect(() => {
    async function loadAdminData() {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch all users
        const { data: users, error: usersError } = await fetchUsers();
        if (usersError) throw usersError;
        if (users) setDbUsers(users);
        
        // Fetch all chatbots
        const { data: chatbots, error: botsError } = await fetchChatbots();
        if (botsError) throw botsError;
        if (chatbots) setDbChatbots(chatbots);
        
        // Fetch all payments
        const { data: payments, error: payError } = await fetchPayments();
        if (payError) throw payError;
        if (payments) setDbPayments(payments);
        
        // Fetch all leads
        const { data: leads, error: leadsError } = await fetchLeads();
        if (leadsError) throw leadsError;
        if (leads) setDbLeads(leads);
        
        // Fetch recent conversations
        const { data: conversations, error: convError } = await fetchConversations();
        if (convError) throw convError;
        if (conversations) setDbConversations(conversations);
        
        // Calculate stats
        const totalRevenue = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
        const activeConversations = conversations?.filter(c => c.status === 'active').length || 0;
        
        setStats({
          totalUsers: users?.length || 0,
          activeChats: activeConversations,
          messagesToday: conversations?.length || 0,
          revenue: totalRevenue
        });
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadAdminData();
  }, [user?.id]);

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <Key className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">This area is restricted to administrators only.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
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
              <Settings className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">Admin Panel</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setUser(null);
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="flex">
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'leads', label: 'Leads', icon: MessageCircle },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'settings', label: 'Credentials', icon: Key },
              { id: 'management', label: 'Management', icon: Settings, route: '/admin/settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => item.route ? navigate(item.route) : setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeTab === item.id
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <>
              {loading && (
                <div className="text-center py-4 mb-4">
                  <p className="text-slate-400">Loading dashboard data...</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +12%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Total Users</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <MessageCircle className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +8%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.activeChats}</p>
                  <p className="text-slate-400 text-sm">Active Chats</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <MessageSquare className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +24%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.messagesToday.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Conversations</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-cyan-400" />
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +18%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">₹{stats.revenue.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Revenue</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {dbUsers.slice(0, 5).map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="text-white">{u.display_name || u.email}</p>
                          <p className="text-slate-400 text-sm capitalize">{u.subscription_tier} • {u.subscription_status}</p>
                        </div>
                        <span className="text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {dbUsers.length === 0 && (
                      <p className="text-slate-400 text-center py-4">No users found</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Free', count: dbUsers.filter(u => u.subscription_tier === 'free').length, color: 'bg-slate-500' },
                      { label: 'Starter', count: dbUsers.filter(u => u.subscription_tier === 'starter').length, color: 'bg-blue-500' },
                      { label: 'Pro', count: dbUsers.filter(u => u.subscription_tier === 'pro').length, color: 'bg-cyan-500' },
                      { label: 'Enterprise', count: dbUsers.filter(u => u.subscription_tier === 'enterprise').length, color: 'bg-purple-500' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-white">{item.count} users</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.color)} style={{ width: `${dbUsers.length > 0 ? (item.count / dbUsers.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Admin Credentials</h1>
                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" /> Saved successfully!
                    </span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Credentials
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-400" />
                  Your Admin Access
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-2">Admin ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={isEditing ? editableCredentials.adminId : adminCredentials.adminId}
                        onChange={(e) => handleChange('adminId', e.target.value)}
                        readOnly={!isEditing}
                        className={cn(
                          "flex-1 px-4 py-3 border rounded-lg text-white",
                          isEditing 
                            ? "bg-slate-600 border-slate-500 focus:border-cyan-500 focus:outline-none" 
                            : "bg-slate-700 border-slate-600"
                        )}
                      />
                      <button 
                        onClick={() => handleCopyCredentials(adminCredentials.adminId)}
                        className="p-3 bg-slate-600 rounded-lg text-white hover:bg-slate-500"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Admin Email *</label>
                    <input
                      type="email"
                      value={isEditing ? editableCredentials.email : adminCredentials.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      readOnly={!isEditing}
                      className={cn(
                        "w-full px-4 py-3 border rounded-lg text-white",
                        isEditing 
                          ? "bg-slate-600 border-slate-500 focus:border-cyan-500 focus:outline-none" 
                          : "bg-slate-700 border-slate-600"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Password *</label>
                    <input
                      type={isEditing ? "text" : "password"}
                      value={isEditing ? editableCredentials.password : adminCredentials.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      readOnly={!isEditing}
                      className={cn(
                        "w-full px-4 py-3 border rounded-lg text-white",
                        isEditing 
                          ? "bg-slate-600 border-slate-500 focus:border-cyan-500 focus:outline-none" 
                          : "bg-slate-700 border-slate-600"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  API Key
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isEditing ? editableCredentials.apiKey : adminCredentials.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    readOnly={!isEditing}
                    className={cn(
                      "flex-1 px-4 py-3 border rounded-lg text-white font-mono text-sm",
                      isEditing 
                        ? "bg-slate-600 border-slate-500 focus:border-cyan-500 focus:outline-none" 
                        : "bg-slate-700 border-slate-600"
                    )}
                  />
                  <button 
                    onClick={() => handleCopyCredentials(adminCredentials.apiKey)}
                    className="p-3 bg-slate-600 rounded-lg text-white hover:bg-slate-500"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-yellow-400 text-sm mt-2">Keep this key secret! Don't share publicly.</p>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Platform Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-2">Dashboard URL</label>
                    <input
                      type="text"
                      value={isEditing ? editableCredentials.dashboardUrl : adminCredentials.dashboardUrl}
                      onChange={(e) => handleChange('dashboardUrl', e.target.value)}
                      readOnly={!isEditing}
                      className={cn(
                        "w-full px-4 py-3 border rounded-lg text-white",
                        isEditing 
                          ? "bg-slate-600 border-slate-500 focus:border-cyan-500 focus:outline-none" 
                          : "bg-slate-700 border-slate-600"
                      )}
                    />
                  </div>
<div>
                  <h4 className="text-white font-medium mb-3">Payment Integration</h4>
                  <p className="text-slate-400 text-sm mb-4">Connect payment gateway for accepting online payments</p>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium">Coming Soon</p>
                    <p className="text-slate-400 text-xs mt-1">Razorpay/Stripe integration</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-white font-medium mb-3">Manual Payment Details</h4>
                  <p className="text-slate-400 text-sm mb-3">Share these with customers for offline payments:</p>
                  <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
                    <p className="text-slate-300 text-sm"><span className="text-slate-500">UPI:</span> flowvibe@yesbank</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText('flowvibe@yesbank')}
                      className="text-cyan-400 text-xs hover:text-cyan-300"
                    >
                      Copy UPI
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-8">Recent Leads ({dbLeads.length})</h1>
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Name</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Email</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Phone</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Interest</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No leads found. Leads will appear when users interact with chatbots.
                        </td>
                      </tr>
                    ) : (
                      dbLeads.map((lead, i) => (
                        <tr key={i} className="border-t border-slate-700">
                          <td className="px-6 py-4 text-white">{lead.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-400">{lead.email || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-400">{lead.phone || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-400">{lead.interest || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              lead.status === 'qualified' ? "bg-green-500/20 text-green-400" : 
                              lead.status === 'new' ? "bg-cyan-500/20 text-cyan-400" : 
                              "bg-slate-500/20 text-slate-400"
                            )}>
                              {lead.status || 'new'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(activeTab === 'users' || activeTab === 'revenue') && (
            <div className="text-center py-20">
              <PieChart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
              <p className="text-slate-400">This feature is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}