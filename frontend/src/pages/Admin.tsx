import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import {
  Bot, ArrowLeft, Users, MessageSquare, BarChart3, DollarSign,
  Settings, Key, Copy, Check, ChevronDown, LogOut, TrendingUp,
  MessageCircle, PieChart, Activity, CreditCard, Wallet, Plus,
  Trash2, Edit2, Eye, X, Search, Filter, Download, RefreshCw,
  MoreHorizontal, Phone, Mail, Building2, MapPin, CheckCircle,
  AlertCircle, PauseCircle, PlayCircle, Archive
} from 'lucide-react';
import {
  fetchUsers,
  fetchChatbots,
  fetchPayments,
  fetchLeads,
  fetchConversations,
  deleteUser,
  updateUser,
  deleteChatbot,
  updateChatbotStatus,
  updatePaymentStatus,
  updateLeadStatus,
  deleteLead,
  getUsersWithStats,
  getAllBotsWithOwners,
  getRevenueReport,
  type User,
  type Chatbot,
  type Payment,
  type Lead,
  type Conversation
} from '../lib/crud';
import { isSupabaseConfigured } from '../lib/supabase-client';

type UserRow = User;
type ChatbotRow = Chatbot;
type PaymentRow = Payment;
type LeadRow = Lead;
type ConversationRow = Conversation;

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

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [botSearch, setBotSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [botFilter, setBotFilter] = useState('all');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  // Form states
  const [editForm, setEditForm] = useState<any>({});

  // Revenue report
  const [revenueReport, setRevenueReport] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      console.log('Loading admin data...');
      try {
        // Fetch all users
        console.log('Fetching users...');
        const { data: users, error: usersError } = await fetchUsers();
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          console.log('Users fetched:', users?.length || 0, users);
          if (users) setDbUsers(users);
        }

        // Fetch all chatbots
        console.log('Fetching chatbots...');
        const { data: chatbots, error: botsError } = await fetchChatbots();
        if (botsError) {
          console.error('Error fetching chatbots:', botsError);
        } else {
          console.log('Chatbots fetched:', chatbots?.length || 0, chatbots);
          if (chatbots) setDbChatbots(chatbots);
        }

        // Fetch all payments
        console.log('Fetching payments...');
        const { data: payments, error: payError } = await fetchPayments();
        if (payError) {
          console.error('Error fetching payments:', payError);
        } else {
          console.log('Payments fetched:', payments?.length || 0, payments);
          if (payments) setDbPayments(payments);
        }

        // Fetch all leads
        console.log('Fetching leads...');
        const { data: leads, error: leadsError } = await fetchLeads();
        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
        } else {
          console.log('Leads fetched:', leads?.length || 0, leads);
          if (leads) setDbLeads(leads);
        }

        // Fetch recent conversations
        console.log('Fetching conversations...');
        const { data: conversations, error: convError } = await fetchConversations();
        if (convError) {
          console.error('Error fetching conversations:', convError);
        } else {
          console.log('Conversations fetched:', conversations?.length || 0);
          if (conversations) setDbConversations(conversations);
        }

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

  // CRUD Helper Functions
  const refreshData = async () => {
    setLoading(true);
    try {
      const { data: users } = await fetchUsers();
      if (users) setDbUsers(users);
      const { data: chatbots } = await fetchChatbots();
      if (chatbots) setDbChatbots(chatbots);
      const { data: payments } = await fetchPayments();
      if (payments) setDbPayments(payments);
      const { data: leads } = await fetchLeads();
      if (leads) setDbLeads(leads);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // User CRUD
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const { error } = await deleteUser(userId);
    if (error) {
      alert('Failed to delete user: ' + error.message);
    } else {
      setDbUsers(prev => prev.filter(u => u.id !== userId));
      setShowDeleteConfirm(null);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const { data, error } = await updateUser(userId, updates);
    if (error) {
      alert('Failed to update user: ' + error.message);
    } else if (data) {
      setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      setShowUserModal(false);
    }
  };

  // Chatbot CRUD
  const handleDeleteChatbot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this chatbot?')) return;
    const { error } = await deleteChatbot(botId);
    if (error) {
      alert('Failed to delete chatbot: ' + error.message);
    } else {
      setDbChatbots(prev => prev.filter(b => b.id !== botId));
    }
  };

  const handleUpdateChatbotStatus = async (botId: string, status: 'active' | 'inactive' | 'archived') => {
    const isPublished = status === 'active';
    const { data, error } = await updateChatbotStatus(botId, isPublished ? 'active' : status);
    if (error) {
      alert('Failed to update chatbot: ' + error.message);
    } else if (data) {
      setDbChatbots(prev => prev.map(b => b.id === botId ? { ...b, is_published: isPublished, is_active: isPublished } : b));
    }
  };

  // Payment CRUD
  const handleUpdatePaymentStatus = async (paymentId: string, status: 'pending' | 'completed' | 'failed' | 'refunded') => {
    const { data, error } = await updatePaymentStatus(paymentId, status);
    if (error) {
      alert('Failed to update payment: ' + error.message);
    } else if (data) {
      setDbPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
    }
  };

  // Lead CRUD
  const handleUpdateLeadStatus = async (leadId: string, status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost') => {
    const { data, error } = await updateLeadStatus(leadId, status);
    if (error) {
      alert('Failed to update lead: ' + error.message);
    } else if (data) {
      setDbLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    const { error } = await deleteLead(leadId);
    if (error) {
      alert('Failed to delete lead: ' + error.message);
    } else {
      setDbLeads(prev => prev.filter(l => l.id !== leadId));
    }
  };

  // Open item modal
  const openItemModal = (item: any, mode: 'view' | 'edit' | 'create', type: string) => {
    setSelectedItem({ ...item, type });
    setModalMode(mode);
    setEditForm(item || {});
    setShowUserModal(true);
  };

  // Filter functions
  const filteredUsers = dbUsers.filter(u => {
    const matchesSearch = !userSearch ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'all' || u.subscription_tier === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredLeads = dbLeads.filter(l => {
    const matchesSearch = !leadSearch ||
      l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.email?.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesFilter = leadFilter === 'all' || l.status === leadFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredPayments = dbPayments.filter(p => {
    const matchesSearch = !paymentSearch ||
      p.transaction_id?.toLowerCase().includes(paymentSearch.toLowerCase());
    const matchesFilter = paymentFilter === 'all' || p.status === paymentFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredChatbots = dbChatbots.filter(b => {
    const matchesSearch = !botSearch ||
      b.name?.toLowerCase().includes(botSearch.toLowerCase());
    const matchesFilter = botFilter === 'all' ||
      (botFilter === 'active' && b.is_published) ||
      (botFilter === 'inactive' && !b.is_published);
    return matchesSearch && matchesFilter;
  });

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

      {/* Supabase Connection Warning */}
      {!isSupabaseConfigured() && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-amber-400 text-sm">
              <strong>Database not connected.</strong> Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. CRUD operations require database connection.
            </p>
          </div>
        </div>
      )}

      <div className="flex">
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'chatbots', label: 'Chatbots', icon: Bot },
              { id: 'leads', label: 'Leads', icon: MessageCircle },
              { id: 'payments', label: 'Payments', icon: CreditCard },
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
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Lead Management ({filteredLeads.length})</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <select
                    value={leadFilter}
                    onChange={(e) => setLeadFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  <button
                    onClick={refreshData}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Name</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Contact</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Interest</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No leads found. Leads will appear when users interact with chatbots.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-t border-slate-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <span className="text-cyan-400 font-medium">{lead.name?.[0] || '?'}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{lead.name || 'Unknown'}</p>
                                <p className="text-slate-400 text-sm">From: {dbChatbots.find(b => b.id === lead.chatbot_id)?.name || 'Chatbot'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{lead.interest || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              lead.status === 'new' ? "bg-cyan-500/20 text-cyan-400" :
                              lead.status === 'contacted' ? "bg-amber-500/20 text-amber-400" :
                              lead.status === 'qualified' ? "bg-purple-500/20 text-purple-400" :
                              lead.status === 'converted' ? "bg-green-500/20 text-green-400" :
                              "bg-slate-500/20 text-slate-400"
                            )}>
                              {lead.status || 'new'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={lead.status || 'new'}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="converted">Converted</option>
                                <option value="lost">Lost</option>
                              </select>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Users Tab with Full CRUD */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">User Management ({filteredUsers.length})</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <button
                    onClick={refreshData}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">User</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Tier</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Created</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-slate-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <span className="text-cyan-400 font-medium">{u.display_name?.[0] || u.email[0]}</span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{u.display_name || 'No name'}</p>
                                <p className="text-slate-400 text-sm">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              u.subscription_tier === 'free' ? "bg-slate-500/20 text-slate-400" :
                              u.subscription_tier === 'pro' ? "bg-cyan-500/20 text-cyan-400" :
                              u.subscription_tier === 'enterprise' ? "bg-purple-500/20 text-purple-400" :
                              "bg-blue-500/20 text-blue-400"
                            )}>
                              {u.subscription_tier}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            )}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openItemModal(u, 'view', 'user')}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openItemModal(u, 'edit', 'user')}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(u.id)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Chatbots Tab with Full CRUD */}
          {activeTab === 'chatbots' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Chatbot Management ({filteredChatbots.length})</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search chatbots..."
                      value={botSearch}
                      onChange={(e) => setBotSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <select
                    value={botFilter}
                    onChange={(e) => setBotFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button
                    onClick={refreshData}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Chatbot</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Industry</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Stats</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChatbots.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No chatbots found
                        </td>
                      </tr>
                    ) : (
                      filteredChatbots.map((b) => (
                        <tr key={b.id} className="border-t border-slate-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{b.name}</p>
                                <p className="text-slate-400 text-sm">{b.user_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{b.industry || 'General'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              b.is_published ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                              {b.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {b.conversations_count || 0} conversations
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/preview?bot=${b.id}`)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {b.is_published ? (
                                <button
                                  onClick={() => handleUpdateChatbotStatus(b.id, 'inactive')}
                                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-400"
                                  title="Unpublish"
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateChatbotStatus(b.id, 'active')}
                                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-green-400"
                                  title="Publish"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteChatbot(b.id)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Payments Tab with Full CRUD */}
          {activeTab === 'payments' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Payment Management ({filteredPayments.length})</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <button
                    onClick={refreshData}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Amount</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => (
                        <tr key={p.id} className="border-t border-slate-700">
                          <td className="px-6 py-4">
                            <span className="text-slate-300 font-mono text-sm">{p.transaction_id || p.id}</span>
                          </td>
                          <td className="px-6 py-4 text-white font-medium">₹{p.amount?.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              p.status === 'completed' ? "bg-green-500/20 text-green-400" :
                              p.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                              p.status === 'refunded' ? "bg-purple-500/20 text-purple-400" :
                              "bg-red-500/20 text-red-400"
                            )}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={p.status}
                              onChange={(e) => handleUpdatePaymentStatus(p.id, e.target.value as any)}
                              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
                <button
                  onClick={async () => {
                    const { data } = await getRevenueReport();
                    if (data) setRevenueReport(data);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Report
                </button>
              </div>

              {revenueReport && (
                <>
                  <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">₹{revenueReport.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-white">₹{revenueReport.monthlyRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">Yearly Revenue</p>
                      <p className="text-3xl font-bold text-white">₹{revenueReport.yearlyRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-1">Growth Rate</p>
                      <p className={cn(
                        "text-3xl font-bold",
                        revenueReport.growthRate >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {revenueReport.growthRate}%
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h3>
                      <div className="space-y-3">
                        {Object.entries(revenueReport.byPlan || {}).map(([plan, amount]: [string, any]) => (
                          <div key={plan} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <span className="text-slate-300 capitalize">{plan}</span>
                            <span className="text-white font-medium">₹{amount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Monthly Trend (Last 12 Months)</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {Object.entries(revenueReport.byMonth || {})
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([month, amount]: [string, any]) => (
                            <div key={month} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                              <span className="text-slate-300">{month}</span>
                              <span className="text-white font-medium">₹{amount?.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!revenueReport && (
                <div className="text-center py-20">
                  <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Click Refresh Report to load revenue data</p>
                </div>
              )}
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                <p className="text-slate-400 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View/Edit Modal */}
          {showUserModal && selectedItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {modalMode === 'view' ? 'View User' : 'Edit User'}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      disabled={modalMode === 'view'}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editForm.display_name || ''}
                      disabled={modalMode === 'view'}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Subscription Tier</label>
                    <select
                      value={editForm.subscription_tier || 'free'}
                      disabled={modalMode === 'view'}
                      onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Status</label>
                    <select
                      value={editForm.is_active ? 'active' : 'inactive'}
                      disabled={modalMode === 'view'}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateUser(selectedItem.id, editForm)}
                      className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}