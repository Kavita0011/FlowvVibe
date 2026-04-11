import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Settings, Users, CreditCard, Package, DollarSign, 
  TrendingUp, Calendar, Clock, Plus, X, Edit, Trash2, Check, XCircle,
  Key, Shield, AlertTriangle, Sparkles, Tag, Percent, Gift, Star,
  Save, RefreshCw, Activity, UserCheck, UserX, Search,
  MoreVertical, ChevronDown
} from 'lucide-react';

// Pricing plans with variations
const pricingPlans: { id: string; name: string; price: number; originalPrice: number; period: string; description: string; isOnSale: boolean; saleEnds?: string }[] = [
  { id: 'free', name: 'Free', price: 0, originalPrice: 0, period: 'forever', description: 'For testing', isOnSale: false },
  { id: 'starter', name: 'Starter', price: 999, originalPrice: 1999, period: 'one-time', description: 'One-time payment', isOnSale: true, saleEnds: '2026-04-30' },
  { id: 'pro', name: 'Pro', price: 2499, originalPrice: 4999, period: 'one-time', description: 'Most popular', isOnSale: true, saleEnds: '2026-04-30' },
  { id: 'enterprise', name: 'Enterprise', price: 9999, originalPrice: 19999, period: 'one-time', description: 'For large teams', isOnSale: true, saleEnds: '2026-04-30' }
];

// Festival sales
const festivalSales = [
  { id: 'diwali', name: 'Diwali Sale', discount: 50, startDate: '2025-10-20', endDate: '2025-11-05', active: false },
  { id: 'holi', name: 'Holi Sale', discount: 40, startDate: '2025-03-01', endDate: '2025-03-15', active: false },
  { id: 'newyear', name: 'New Year Sale', discount: 35, startDate: '2025-12-25', endDate: '2025-01-05', active: false },
  { id: 'summer', name: 'Summer Sale', discount: 30, startDate: '2025-04-01', endDate: '2025-04-30', active: false },
  { id: 'founder', name: 'Founder Day', discount: 60, startDate: '2025-06-01', endDate: '2025-06-07', active: true }
];

// Custom pricing tiers
const customTiers = [
  { id: 'starter', name: 'Starter', minUsers: 1, maxUsers: 5, pricePerUser: 399 },
  { id: 'team', name: 'Team', minUsers: 6, maxUsers: 20, pricePerUser: 349 },
  { id: 'business', name: 'Business', minUsers: 21, maxUsers: 50, pricePerUser: 299 },
  { id: 'enterprise_custom', name: 'Enterprise', minUsers: 51, maxUsers: 'unlimited', pricePerUser: 249 }
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
  
  // Form states
  const [editUserForm, setEditUserForm] = useState<any>({});
  const [editPaymentForm, setEditPaymentForm] = useState<any>({});
  const [pricingForm, setPricingForm] = useState(pricingPlans[0]);
  const [festivalForm, setFestivalForm] = useState(festivalSales[0]);
  const [customTierForm, setCustomTierForm] = useState(customTiers[0]);
  const [newPricing, setNewPricing] = useState<Omit<typeof pricingPlans[number], 'id'>>({ name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false });

  const handleEditPricing = (planId: string) => {
    setEditingPricing(planId);
    const plan = customPrices.find(p => p.id === planId);
    if (plan) {
      setPricingForm(plan);
    }
  };

  const handleSavePricing = () => {
    setCustomPrices(customPrices.map(p => p.id === editingPricing ? { ...pricingForm, isOnSale: pricingForm.isOnSale || false, originalPrice: pricingForm.originalPrice || 0 } : p));
    setEditingPricing(null);
    alert('Pricing saved successfully!');
  };

  const handleDeletePricing = (planId: string) => {
    if (confirm('Are you sure you want to delete this pricing plan?')) {
      setCustomPrices(customPrices.filter(p => p.id !== planId));
    }
  };

  const handleAddNewPricing = () => {
    if (!newPricing.name) {
      alert('Please enter Plan Name');
      return;
    }
    const newId = newPricing.name.toLowerCase().replace(/\s+/g, '_');
    setCustomPrices([...customPrices, { ...newPricing, id: newId }]);
    setNewPricing({ name: '', price: 0, originalPrice: 0, period: 'one-time', description: '', isOnSale: false });
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

  const handlePaymentAction = (paymentId: string, action: 'refund' | 'complete' | 'fail') => {
    const status = action === 'complete' ? 'completed' : action === 'fail' ? 'failed' : 'refunded';
    updatePayment(paymentId, { status });
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
              { id: 'festive', label: 'Festival Sales', icon: Gift },
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
                                    onClick={() => handlePaymentAction(payment.id, 'complete')}
                                    className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                                    title="Mark Complete"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handlePaymentAction(payment.id, 'fail')}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                                    title="Mark Failed"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {payment.status === 'completed' && (
                                <button 
                                  onClick={() => handlePaymentAction(payment.id, 'refund')}
                                  className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg"
                                  title="Refund"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
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
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input type="checkbox" checked={pricingForm.isOnSale || false} onChange={(e) => setPricingForm({...pricingForm, isOnSale: e.target.checked})} className="w-4 h-4" />
                            Active Sale
                          </label>
                        </div>
                      </div>
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

          {/* Festival Sales Tab */}
          {activeTab === 'festive' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">Festival Sales</h1>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {festivalSales.map((sale) => (
                  <div key={sale.id} className={cn(
                    "bg-slate-800 rounded-xl p-6 border",
                    sale.active ? "border-green-500" : "border-slate-700"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <h3 className="text-white font-semibold">{sale.name}</h3>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        sale.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                      )}>
                        {sale.active ? 'Active' : 'Scheduled'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-green-400">-{sale.discount}%</span>
                      <span className="text-slate-400"> discount</span>
                    </div>
                    
                    <div className="text-slate-400 text-sm space-y-1">
                      <p>Start: {sale.startDate}</p>
                      <p>End: {sale.endDate}</p>
                    </div>
                    
                    <button className="w-full mt-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/20">
                      Edit Sale
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Create New Festival Sale</h3>
                <div className="grid md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Sale Name</label>
                    <input className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Discount %</label>
                    <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Start Date</label>
                    <input type="date" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">End Date</label>
                    <input type="date" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full py-2 bg-purple-500 text-white rounded-lg">
                      Create Sale
                    </button>
                  </div>
                </div>
              </div>
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
                    {customTiers.map((tier) => (
                      <tr key={tier.id} className="border-t border-slate-700">
                        <td className="px-6 py-4 text-white font-medium">{tier.name}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {tier.minUsers} - {tier.maxUsers === 'unlimited' ? 'Unlimited' : tier.maxUsers} users
                        </td>
                        <td className="px-6 py-4 text-green-400">₹{tier.pricePerUser}/user</td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
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
                    <input className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Min Users</label>
                    <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Max Users</label>
                    <input type="number" placeholder="Leave empty for unlimited" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Price/User</label>
                    <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  Add Tier
                </button>
              </div>
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
                      defaultValue="devappkavita@gmail.com"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Bank Name</label>
                    <input
                      type="text"
                      placeholder="State Bank of India"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Account Number</label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="SBIN0004633"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg">
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Payment Details
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
                      defaultValue="support@flowvibe.ai"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
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