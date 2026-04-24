import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import {
  Bot, ArrowLeft, Settings, Users, CreditCard, Package, DollarSign,
  TrendingUp, Calendar, Clock, Plus, X, Edit, Trash2, Check, XCircle,
  Key, Shield, AlertTriangle, Sparkles, Tag, Percent, Star,
  Save, RefreshCw, Activity, UserCheck, UserX, Search,
  MoreVertical, ChevronDown, CheckCircle, XCircle
} from 'lucide-react';
import { admin } from '../lib/api';

// Pricing plans - Set to Rs.1 for testing
const pricingPlans: { id: string; name: string; price: number; originalPrice: number; period: string; description: string; isOnSale: boolean; saleEnds?: string; saleReason?: string }[] = [
  { id: 'free', name: 'Free', price: 0, originalPrice: 0, period: 'forever', description: 'For testing - 1 chatbot, 50 messages', isOnSale: false },
  { id: 'starter', name: 'Starter', price: 1, originalPrice: 1, period: 'one-time', description: '1 chatbot, 500 messages, all channels', isOnSale: true, saleReason: 'Testing' },
  { id: 'pro', name: 'Pro', price: 1, originalPrice: 1, period: 'one-time', description: '5 chatbots, unlimited messages, all features', isOnSale: true, saleReason: 'Testing' },
  { id: 'enterprise', name: 'Enterprise', price: 1, originalPrice: 1, period: 'one-time', description: 'Unlimited everything, priority support', isOnSale: true, saleReason: 'Testing' }
];

// Addons pricing - Rs.1 for testing
const ADDONS_DATA = [
  { id: 'bookings', name: 'Booking System', price: 1, description: 'Multiple services, time slots, calendar sync' },
  { id: 'call', name: 'Voice Calls', price: 1, description: 'Twilio integration, call forwarding, voicemail' },
  { id: 'email', name: 'Email Marketing', price: 1, description: 'SMTP integration, email templates, automated sequences' },
  { id: 'humanHandoff', name: 'Human Handoff', price: 1, description: 'Agent dashboard, chat routing, canned responses' },
  { id: 'webhooks', name: 'Webhooks & Zapier', price: 1, description: 'Zapier integration, custom webhooks, 300+ apps' },
  { id: 'crm', name: 'CRM Integration', price: 1, description: 'Salesforce sync, HubSpot integration, custom CRM' }
];

// Sale reasons
const saleReasons = [
  { id: 'diwali', name: 'Diwali' },
  { id: 'holi', name: 'Holi' },
  { id: 'eid', name: 'Eid' },
  { id: 'christmas', name: 'Christmas' },
  { id: 'newyear', name: 'New Year' },
  { id: 'birthday', name: 'Birthday' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'summer', name: 'Summer Sale' },
  { id: 'founder', name: 'Founder Day' },
  { id: 'liquidation', name: 'Liquidation Sale' },
  { id: 'clearance', name: 'Clearance' },
  { id: 'other', name: 'Other' }
];

// Custom pricing tiers - Rs.1 for testing
const customTiers: { id: string; name: string; minUsers: number; maxUsers: string; pricePerUser: number }[] = [
  { id: 'starter', name: 'Starter', minUsers: 1, maxUsers: '5', pricePerUser: 1 },
  { id: 'team', name: 'Team', minUsers: 6, maxUsers: '20', pricePerUser: 1 },
  { id: 'business', name: 'Business', minUsers: 21, maxUsers: '50', pricePerUser: 1 },
  { id: 'enterprise_custom', name: 'Enterprise', minUsers: 51, maxUsers: 'unlimited', pricePerUser: 1 }
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { users, updateUser, deleteUser, payments, updatePayment, addPayment } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('users');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const defaultPricing: typeof pricingPlans[number] = { id: '', name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false };
  const [customPrices, setCustomPrices] = useState<typeof pricingPlans>(pricingPlans);
  const [backendLoading, setBackendLoading] = useState(false);
  
  // Payment settings
  const [upiId, setUpiId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('paymentSettings') || '{}').upi || ''; } 
    catch { return ''; }
  });
  const [bankName, setBankName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('paymentSettings') || '{}').bankName || ''; } 
    catch { return ''; }
  });
  const [accountNumber, setAccountNumber] = useState(() => {
    try { return JSON.parse(localStorage.getItem('paymentSettings') || '{}').accountNumber || ''; } 
    catch { return ''; }
  });
  const [ifscCode, setIfscCode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('paymentSettings') || '{}').ifsc || ''; } 
    catch { return ''; }
  });
  const [saveSettingsMsg, setSaveSettingsMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const savePaymentSettings = async () => {
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@flowvibe.com';
    const settings = { upi: upiId, bankName, accountNumber, ifsc: ifscCode, supportEmail };

    const token = localStorage.getItem('token');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL && token) {
        const response = await fetch(`${API_URL}/api/admin/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }
      }
    } catch (e) {
      console.log('Could not save to database, using localStorage');
    }

    localStorage.setItem('paymentSettings', JSON.stringify(settings));
    toast.success('Payment settings saved!');
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters');
      return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordMsg('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      setPasswordMsg('Password must contain at least one number');
      return;
    }
    
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          email: adminEmail
        })
      });
      
      if (response.ok) {
        setPasswordMsg('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg('Failed to update password');
      }
    } catch (err) {
      setPasswordMsg('Error updating password. Use wrangler secret put NEW_ADMIN_PASSWORD');
    }
    
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const fetchPricingFromBackend = async () => {
    try {
      setBackendLoading(true);
      const data = await admin.getSettings();
      if (data?.pricingPlans && data.pricingPlans.length > 0) {
        setCustomPrices(data.pricingPlans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.original_price,
          period: plan.period,
          description: plan.description,
          isOnSale: plan.is_on_sale,
          saleReason: plan.sale_reason,
          saleEnds: plan.sale_ends
        })));
      }
    } catch (e) {
      console.error('Failed to fetch pricing:', e);
    } finally {
      setBackendLoading(false);
    }
  };

  const fetchTiersFromBackend = async () => {
    try {
      const data = await admin.getSettings();
      if (data?.customTiers && data.customTiers.length > 0) {
        setCustomTiersList(data.customTiers.map((tier: any) => ({
          id: tier.id,
          name: tier.name,
          minUsers: tier.min_users,
          maxUsers: tier.max_users,
          pricePerUser: tier.price_per_user
        })));
      }
    } catch (e) {
      console.error('Failed to fetch tiers:', e);
    }
  };

  const savePricingToBackend = async () => {
    try {
      for (const plan of customPrices) {
        await admin.savePricingPlan({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.originalPrice,
          period: plan.period,
          description: plan.description,
          isOnSale: plan.isOnSale,
          saleReason: plan.saleReason
        });
      }
      alert('Pricing saved successfully!');
    } catch (e) {
      console.error('Error saving pricing:', e);
      alert('Error saving pricing');
    }
  };

  const saveTiersToBackend = async () => {
    try {
      for (const tier of customTiersList) {
        await admin.saveSettings({ customTier: tier });
      }
      alert('Tiers saved successfully!');
    } catch (e) {
      console.error('Error saving tiers:', e);
      alert('Error saving tiers');
    }
  };

  useEffect(() => {
    fetchPricingFromBackend();
    fetchTiersFromBackend();
  }, []);
  
  // Form states
  const [editUserForm, setEditUserForm] = useState<any>({});
  const [editPaymentForm, setEditPaymentForm] = useState<any>({});
  const [pricingForm, setPricingForm] = useState(pricingPlans[0]);
  const [customTierForm, setCustomTierForm] = useState(customTiers[0]);
  const [customTiersList, setCustomTiersList] = useState(customTiers);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [newPricing, setNewPricing] = useState<Omit<typeof pricingPlans[number], 'id'>>({ name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false, saleReason: '' });
  const [newTier, setNewTier] = useState({ name: '', minUsers: 1, maxUsers: '10', pricePerUser: 399 });

  const handleEditTier = (tierId: string) => {
    setEditingTier(tierId);
    const tier = customTiersList.find(t => t.id === tierId);
    if (tier) setCustomTierForm(tier);
  };

  const handleSaveTier = () => {
    setCustomTiersList(customTiersList.map(t => t.id === editingTier ? { ...customTierForm } : t));
    setEditingTier(null);
    alert('Tier saved!');
  };

  const handleDeleteTier = (tierId: string) => {
    if (confirm('Delete this tier?')) setCustomTiersList(customTiersList.filter(t => t.id !== tierId));
  };

  const handleAddTier = () => {
    if (!newTier.name) return alert('Enter tier name');
    setCustomTiersList([...customTiersList, { ...newTier, id: newTier.name.toLowerCase().replace(/\s+/g, '_') }]);
    setNewTier({ name: '', minUsers: 1, maxUsers: '10', pricePerUser: 399 });
  };

  const handleEditPricing = (planId: string) => {
    setEditingPricing(planId);
    const plan = customPrices.find(p => p.id === planId);
    if (plan) {
      setPricingForm(plan);
    }
};

  const handleSavePricing = async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    const updatedPlan = { ...pricingForm, isOnSale: pricingForm.isOnSale || false, originalPrice: pricingForm.originalPrice || 0 };

    try {
      if (API_URL) {
        const response = await fetch(`${API_URL}/api/admin/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPricing,
            name: pricingForm.name,
            price: pricingForm.price,
            originalPrice: pricingForm.originalPrice || pricingForm.price,
            period: pricingForm.period,
            description: pricingForm.description,
            isOnSale: pricingForm.isOnSale || false,
            saleReason: pricingForm.saleReason || ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }
      }

      setCustomPrices(customPrices.map(p => p.id === editingPricing ? updatedPlan : p));
      setEditingPricing(null);
      toast.success('Pricing saved successfully!');
    } catch (err) {
      console.error('Error saving pricing:', err);
      toast.error('Failed to save pricing to database');
      setCustomPrices(customPrices.map(p => p.id === editingPricing ? updatedPlan : p));
      setEditingPricing(null);
    }
  };

  const handleDeletePricing = (planId: string) => {
    if (confirm('Are you sure you want to delete this pricing plan?')) {
      setCustomPrices(customPrices.filter(p => p.id !== planId));
      toast.success('Pricing plan removed');
    }
  };

  const handleAddNewPricing = async () => {
    if (!newPricing.name) {
      toast.error('Please enter Plan Name');
      return;
    }

    const newId = newPricing.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      if (API_URL) {
        await fetch(`${API_URL}/api/admin/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newId,
            name: newPricing.name,
            price: newPricing.price,
            originalPrice: newPricing.originalPrice || newPricing.price,
            period: newPricing.period,
            description: newPricing.description,
            isOnSale: newPricing.isOnSale || false,
            saleReason: newPricing.saleReason || ''
          })
        });
      }

      setCustomPrices([...customPrices, { ...newPricing, id: newId }]);
      setNewPricing({ name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false, saleReason: '' });
      toast.success('New pricing plan added!');
    } catch (err) {
      console.error('Error adding pricing:', err);
      setCustomPrices([...customPrices, { ...newPricing, id: newId }]);
      setNewPricing({ name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false, saleReason: '' });
      toast.success('New pricing plan added locally!');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (userId: string, action: 'disable' | 'enable' | 'delete') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (action === 'disable') {
      updateUser(userId, { isActive: false });
    } else if (action === 'enable') {
      updateUser(userId, { isActive: true });
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this user?')) {
        deleteUser(userId);
      }
    }
  };

  const handlePaymentAction = (paymentId: string, action: 'approve' | 'reject' | 'refund') => {
    const newStatus = action === 'approve' ? 'completed' : action === 'reject' ? 'rejected' : 'refunded';
    const approved = action === 'approve';
    const activated = action === 'approve';
    
    updatePayment(paymentId, { status: newStatus, approved, activated });
    
    // If approved, update user's subscription
    if (action === 'approve') {
      const payment = payments.find((p: any) => p.id === paymentId);
      if (payment) {
        const store = useChatbotStore?.getState();
        if (store?.setUser) {
          const currentUser = store.user;
          if (currentUser) {
            store.setUser({
              ...currentUser,
              subscription: {
                tier: payment.plan,
                status: 'active',
                startDate: new Date()
              }
            });
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Settings className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Settings & Management</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-1">
            {[
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'pricing', label: 'Pricing Plans', icon: DollarSign },
              { id: 'tiers', label: 'Custom Tiers', icon: Package },
              { id: 'admin', label: 'Admin Profile', icon: Key },
              { id: 'activity', label: 'Activity Log', icon: Activity }
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

        {/* Content */}
        <div className="flex-1 p-8">
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <button 
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              </div>

              <div className="mb-4 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">User</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Role</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Joined</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-slate-700">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{user.displayName}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            user.role === 'admin' ? "bg-yellow-500/20 text-yellow-400" : "bg-cyan-500/20 text-cyan-400"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {user.isActive ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleUserAction(user.id, user.isActive ? 'disable' : 'enable')}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                user.isActive ? "text-red-400 hover:bg-red-500/20" : "text-green-400 hover:bg-green-500/20"
                              )}
                              title={user.isActive ? 'Block User' : 'Enable User'}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleUserAction(user.id, 'delete')}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Total Users: {users.length} | Active: {users.filter(u => u.isActive).length} | Blocked: {users.filter(u => !u.isActive).length}
                </p>
              </div>
            </>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Payment Management</h1>
                <button 
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Payment
                </button>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">₹{payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">₹{payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Refunded</p>
                  <p className="text-2xl font-bold text-red-400">₹{payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-green-400">₹{payments.filter(p => p.status === 'completed' && new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">User</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Plan</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Amount</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Status</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const user = users.find(u => u.id === payment.userId);
                      return (
                        <tr key={payment.id} className="border-t border-slate-700">
                          <td className="px-6 py-4 text-white font-mono text-sm">{payment.transactionId}</td>
                          <td className="px-6 py-4 text-slate-400">{user?.displayName || 'Unknown'}</td>
                          <td className="px-6 py-4 text-white capitalize">{payment.plan}</td>
                          <td className="px-6 py-4 text-white">₹{payment.amount}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs capitalize",
                              payment.status === 'completed' && "bg-green-500/20 text-green-400",
                              payment.status === 'pending' && "bg-yellow-500/20 text-yellow-400",
                              payment.status === 'failed' && "bg-red-500/20 text-red-400",
                              payment.status === 'refunded' && "bg-purple-500/20 text-purple-400"
                            )}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
<td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {payment.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handlePaymentAction(payment.id, 'approve')}
                                    className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                                    title="Approve & Activate"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handlePaymentAction(payment.id, 'reject')}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {payment.status === 'completed' && (
                                <>
                                  <button 
                                    onClick={() => handlePaymentAction(payment.id, 'refund')}
                                    className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg"
                                    title="Refund"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pricing Plans Tab */}
          {activeTab === 'pricing' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">Pricing Plans</h1>
              
              <div className="grid md:grid-cols-3 gap-6">
                {customPrices.map((plan) => (
                  <div key={plan.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      {plan.isOnSale && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Sale
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      {plan.originalPrice && (
                        <span className="text-slate-500 line-through mr-2">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                      <span className="text-slate-400">/{plan.period}</span>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>

                    {plan.isOnSale && plan.saleEnds && (
                      <p className="text-yellow-400 text-sm mb-4">
                        Sale ends: {plan.saleEnds}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => handleEditPricing(plan.id)} className="flex-1 py-2 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/20">
                        Edit
                      </button>
                      <button onClick={() => handleDeletePricing(plan.id)} className="px-3 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Add New Pricing Plan</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Plan Name</label>
                    <input value={newPricing.name} onChange={(e) => setNewPricing({...newPricing, name: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Pro" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Price (₹)</label>
                    <input type="number" value={newPricing.price} onChange={(e) => setNewPricing({...newPricing, price: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleAddNewPricing} className="w-full py-2 bg-cyan-500 text-white rounded-lg">
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Pricing Modal */}
              {editingPricing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-bold text-lg">Edit {pricingForm.name}</h3>
                      <button onClick={() => setEditingPricing(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Name</label>
                          <input value={pricingForm.name} onChange={(e) => setPricingForm({...pricingForm, name: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Period</label>
                          <select value={pricingForm.period} onChange={(e) => setPricingForm({...pricingForm, period: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                            <option value="one-time">One-time</option>
                            <option value="month">Monthly</option>
                            <option value="year">Yearly</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Original Price (₹)</label>
                          <input type="number" value={pricingForm.originalPrice || 0} onChange={(e) => setPricingForm({...pricingForm, originalPrice: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Sale Price (₹)</label>
                          <input type="number" value={pricingForm.price} onChange={(e) => setPricingForm({...pricingForm, price: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Discount %</label>
                          <input type="number" value={pricingForm.isOnSale ? Math.round((1 - pricingForm.price / (pricingForm.originalPrice || 1)) * 100) : 0} onChange={(e) => {
                            const discount = Number(e.target.value);
                            if (discount > 0 && discount <= 100) {
                              setPricingForm({...pricingForm, isOnSale: true, price: Math.round(pricingForm.originalPrice * (1 - discount / 100)) });
                            }
                          }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="0" />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input type="checkbox" checked={pricingForm.isOnSale || false} onChange={(e) => setPricingForm({...pricingForm, isOnSale: e.target.checked, saleReason: e.target.checked ? pricingForm.saleReason || 'other' : ''})} className="w-4 h-4" />
                            Enable Sale
                          </label>
                        </div>
                      </div>
                      {pricingForm.isOnSale && (
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Sale Reason</label>
                          <select value={pricingForm.saleReason || ''} onChange={(e) => setPricingForm({...pricingForm, saleReason: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                            <option value="">Select reason...</option>
                            {saleReasons.map(reason => (
                              <option key={reason.id} value={reason.id}>{reason.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-400 mb-2 text-sm">Description</label>
                        <input value={pricingForm.description} onChange={(e) => setPricingForm({...pricingForm, description: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button onClick={handleSavePricing} className="flex-1 py-2 bg-cyan-500 text-white rounded-lg">
                        Save Changes
                      </button>
                      <button onClick={() => setEditingPricing(null)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          

          {/* Custom Tiers Tab */}
          {activeTab === 'tiers' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">Custom Enterprise Tiers</h1>
              
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Tier Name</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Users Range</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Price/User</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customTiersList.map((tier) => (
                      <tr key={tier.id} className="border-t border-slate-700">
                        <td className="px-6 py-4 text-white font-medium">{tier.name}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {tier.minUsers} - {tier.maxUsers === 'unlimited' ? 'Unlimited' : tier.maxUsers} users
                        </td>
                        <td className="px-6 py-4 text-green-400">₹{tier.pricePerUser}/user</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditTier(tier.id)} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTier(tier.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Add Custom Tier</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Tier Name</label>
                    <input value={newTier.name} onChange={(e) => setNewTier({...newTier, name: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="Enterprise" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Min Users</label>
                    <input type="number" value={newTier.minUsers} onChange={(e) => setNewTier({...newTier, minUsers: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Max Users (leave empty for unlimited)</label>
                    <input type="text" value={newTier.maxUsers} onChange={(e) => setNewTier({...newTier, maxUsers: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="50 or unlimited" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Price/User</label>
                    <input type="number" value={newTier.pricePerUser} onChange={(e) => setNewTier({...newTier, pricePerUser: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                </div>
                <button onClick={handleAddTier} className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  Add Tier
                </button>
              </div>

              {/* Edit Tier Modal */}
              {editingTier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-bold text-lg">Edit {customTierForm.name}</h3>
                      <button onClick={() => setEditingTier(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-400 mb-2 text-sm">Tier Name</label>
                        <input value={customTierForm.name} onChange={(e) => setCustomTierForm({...customTierForm, name: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Min Users</label>
                          <input type="number" value={customTierForm.minUsers} onChange={(e) => setCustomTierForm({...customTierForm, minUsers: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-2 text-sm">Max Users</label>
                          <input type="text" value={customTierForm.maxUsers} onChange={(e) => setCustomTierForm({...customTierForm, maxUsers: e.target.value || 'unlimited'})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="unlimited" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-2 text-sm">Price per User (₹)</label>
                        <input type="number" value={customTierForm.pricePerUser} onChange={(e) => setCustomTierForm({...customTierForm, pricePerUser: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button onClick={handleSaveTier} className="flex-1 py-2 bg-cyan-500 text-white rounded-lg">Save</button>
                      <button onClick={() => setEditingTier(null)} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin Profile Tab */}
          {activeTab === 'admin' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">Admin Profile</h1>
              
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  Admin Credentials
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Admin Email</label>
                    <input
                      type="email"
                      defaultValue={import.meta.env.VITE_ADMIN_EMAIL || ''}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Admin Name</label>
                    <input
                      type="text"
                      defaultValue="Admin"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  <Save className="w-4 h-4 inline mr-2" />
                  Update Password
                </button>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Payment Settings
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="State Bank of India"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="SBIN0004633"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button onClick={savePaymentSettings} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Payment Details
                  {saveSettingsMsg && <span className="text-green-400 ml-2">{saveSettingsMsg}</span>}
                </button>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  Platform Settings
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Platform Name</label>
                    <input
                      type="text"
                      defaultValue="FlowvVibe"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Support Email</label>
                    <input
                      type="email"
                      defaultValue={import.meta.env.VITE_SUPPORT_EMAIL || 'support@flowvibe.com'}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                {/* Admin Password Change */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4 text-yellow-400" />
                    Change Admin Password
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <button onClick={changePassword} className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Update Password
                  </button>
                  {passwordMsg && (
                    <span className={`ml-4 ${passwordMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordMsg}
                    </span>
                  )}
                </div>
                
                <button className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Settings
                </button>
              </div>
            </>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">Activity Log</h1>
              
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <p className="text-slate-400 text-center">
                  Activity logging will track all user actions including:
                </p>
                <ul className="mt-4 space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" /> User login/logout
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" /> Chatbot creation/editing/deletion
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" /> Payment made/refunded
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" /> Lead captured
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" /> Settings changes
                  </li>
                </ul>
                <p className="mt-6 text-yellow-400 text-sm text-center">
                  Backend integration required for full activity logging
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
