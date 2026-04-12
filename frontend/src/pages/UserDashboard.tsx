import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import type { PRD } from '../types';
import { cn } from '../utils/cn';

const planFeatures: Record<string, string[]> = {
  'free': ['1 Chatbot', '50 Conversations/month', 'Basic Analytics', 'Email Support'],
  'starter': ['2 Chatbots', '500 Conversations', 'Premium Widget', 'Slack Integration'],
  'pro': ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support', 'Advanced Analytics', 'Custom Branding', 'Export Widget'],
  'enterprise': ['Unlimited Chatbots', 'All Integrations', 'Dedicated Support', 'Custom Development', 'SLA Guarantee', 'White Label']
};
import { 
  Bot, ArrowLeft, Plus, Settings, CreditCard, Users, MessageSquare,
  TrendingUp, Calendar, Clock, LogOut, Copy, ExternalLink, MoreVertical,
  ChevronRight, Zap, Star, Check, AlertCircle, Play, Pause, Trash2,
  Mail, Phone, Building2, MapPin, User
} from 'lucide-react';

const stats = [
  { label: 'Total Bots', value: '3', icon: Bot, change: '+1' },
  { label: 'Conversations', value: '1,234', icon: MessageSquare, change: '+24%' },
  { label: 'Leads Collected', value: '567', icon: Users, change: '+12%' },
  { label: 'Avg Rating', value: '4.8', icon: Star, change: '+0.2' }
];

const demoBots = [
  { id: '1', name: 'Customer Support Bot', industry: 'E-commerce', status: 'active', conversations: 450, leads: 120 },
  { id: '2', name: 'Sales Assistant', industry: 'Real Estate', status: 'active', conversations: 320, leads: 89 },
  { id: '3', name: 'HR Bot', industry: 'Healthcare', status: 'paused', conversations: 180, leads: 45 }
];

const subscriptionPlans = [
  { 
    id: 'free', 
    name: 'Free', 
    price: 0, 
    features: ['1 Chatbot', '50 Conversations/month', 'Basic Analytics', 'Email Support'],
    popular: false
  },
  { 
    id: 'starter', 
    name: 'Starter', 
    price: 999, 
    features: ['2 Chatbots', '500 Conversations', 'Premium Widget', 'Slack Integration'],
    popular: false
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: 2499, 
    features: ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support', 'Advanced Analytics', 'Custom Branding', 'Export Widget'],
    popular: true
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    price: 9999, 
    features: ['Unlimited Chatbots', 'All Integrations', 'Dedicated Support', 'Custom Development', 'SLA Guarantee', 'White Label'],
    popular: false
  }
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout, payments, chatbots, setPRD } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('bots');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const upgradeClicked = () => navigate('/pricing');

  useEffect(() => {
    fetch('http://localhost:3001/api/psadmin/pricing')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSubscriptionPlans(data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            features: planFeatures[plan.id] || [],
            popular: plan.id === 'pro'
          })));
        }
      })
      .catch(() => console.log('Using fallback pricing'));
  }, []);

  const userPayments = payments.filter(p => p.userId === user?.id);
  const userChatbots = chatbots.filter(c => c.userId === user?.id);

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
                      companyName: '',
                      industry: '',
                      services: [],
                      targetAudience: '',
                      tone: 'friendly',
                      faq: [],
                      escalationRules: ''
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
                {demoBots.map((bot) => (
                  <div key={bot.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Bot className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        bot.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                      )}>
                        {bot.status}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">{bot.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{bot.industry}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{bot.conversations} convos</span>
                      <span className="text-slate-400">{bot.leads} leads</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => navigate('/flow')}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => navigate('/preview')}
                        className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm transition-colors"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: 'Create Bot', action: () => {
                      const newPRD: PRD = {
                        companyName: '',
                        industry: '',
                        services: [],
                        targetAudience: '',
                        tone: 'friendly',
                        faq: [],
                        escalationRules: ''
                      };
                      setPRD(newPRD);
                      navigate('/prd');
                    }, icon: Plus },
                    { label: 'View Analytics', action: () => {}, icon: TrendingUp },
                    { label: 'Export Data', action: () => {}, icon: Copy },
                    { label: 'Get Help', action: () => {}, icon: MessageSquare }
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
                    {userPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-slate-700">
                        <td className="px-6 py-4 text-white">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-white capitalize">{payment.plan}</td>
                        <td className="px-6 py-4 text-white">₹{payment.amount}</td>
                        <td className="px-6 py-4 text-slate-400 capitalize">{payment.method}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">
                          {payment.transactionId}
                        </td>
                      </tr>
                    ))}
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
                      defaultValue={user.companyName || ''}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Location</label>
                    <input
                      type="text"
                      defaultValue={user.location || ''}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg">
                  Save Changes
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
                    <p className="text-white font-medium">Pro Plan</p>
                    <p className="text-slate-400 text-sm">₹499/month • Renews on Jan 1, 2026</p>
                  </div>
                  <button 
onClick={upgradeClicked}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                  >
                    Upgrade
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
                      placeholder="Enter current password"
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
                  <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-slate-800 rounded-xl p-6 border border-red-500/20">
                <h3 className="text-red-400 font-semibold mb-4">Danger Zone</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg">
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
              {subscriptionPlans.map((plan) => (
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
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}