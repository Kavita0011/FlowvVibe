import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Users, MessageSquare, BarChart3, DollarSign,
  Settings, Key, Copy, Check, ChevronDown, LogOut, TrendingUp,
  MessageCircle, PieChart, Activity, CreditCard, Wallet
} from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '1,234', change: '+12%', icon: Users },
  { label: 'Active Chats', value: '456', change: '+8%', icon: MessageCircle },
  { label: 'Messages Today', value: '12,345', change: '+24%', icon: MessageSquare },
  { label: 'Revenue', value: '₹45,678', change: '+18%', icon: DollarSign }
];

const recentActivity = [
  { user: 'Rahul S.', action: 'Created new bot', time: '2 min ago' },
  { user: 'Priya P.', action: 'Upgraded to Pro', time: '15 min ago' },
  { user: 'Amit K.', action: 'Added FAQ', time: '1 hour ago' },
  { user: 'Sneha R.', action: 'Started free trial', time: '2 hours ago' }
];

const leads = [
  { name: 'Rahul Sharma', email: 'rahul@shopright.in', phone: '+91 98765 43210', plan: 'Pro', date: 'Today' },
  { name: 'Priya Patel', email: 'priya@healthplus.in', phone: '+91 98765 43211', plan: 'Pro', date: 'Today' },
  { name: 'Amit Kumar', email: 'amit@spicegarden.in', phone: '+91 98765 43212', plan: 'Starter', date: 'Yesterday' }
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, setUser } = useChatbotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);

  const adminCredentials = {
    adminId: 'FV_ADMIN_001',
    email: 'devappkavita@gmail.com',
    password: 'kavitabisht2598@sbi',
    apiKey: 'fv_live_sk_1234567890abcdefghijklmnopqrstuvwxyz',
    dashboardUrl: 'https://flowvibe.ai/admin'
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              { id: 'settings', label: 'Credentials', icon: Key }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-8 h-8 text-cyan-400" />
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> {stat.change}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="text-white">{activity.user}</p>
                          <p className="text-slate-400 text-sm">{activity.action}</p>
                        </div>
                        <span className="text-slate-500 text-sm">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Free', value: 800, color: 'bg-slate-500' },
                      { label: 'Pro', value: 350, color: 'bg-cyan-500' },
                      { label: 'Enterprise', value: 84, color: 'bg-purple-500' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-white">{item.value} users</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.color)} style={{ width: `${(item.value / 1234) * 100}%` }} />
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
              <h1 className="text-2xl font-bold text-white mb-8">Admin Credentials</h1>
              
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
                        value={adminCredentials.adminId}
                        readOnly
                        className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
                    <label className="block text-slate-400 mb-2">Admin Email</label>
                    <input
                      type="text"
                      value={adminCredentials.email}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={adminCredentials.password}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
                    value={adminCredentials.apiKey}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm"
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
                      value={adminCredentials.dashboardUrl}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2">Payment UPI</label>
                    <input
                      type="text"
                      value="flowvibe@yesbank"
                      readOnly
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                   <div>
                     <label className="block text-slate-400 mb-2">Bank Transfer Details</label>
                     <div className="p-4 bg-slate-700/50 rounded-lg font-mono text-sm text-slate-300">
                       Account Name: Kavita Bisht<br/>
                       Email: kavitabisht2598@sbi<br/>
                       Account No: 45065191325<br/>
                       IFSC Code: SBIN0004633<br/>
                       Bank: State Bank of India (SBI)
                     </div>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-8">Recent Leads</h1>
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Name</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Email</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Phone</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Plan</th>
                      <th className="px-6 py-3 text-left text-slate-400 text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i} className="border-t border-slate-700">
                        <td className="px-6 py-4 text-white">{lead.name}</td>
                        <td className="px-6 py-4 text-slate-400">{lead.email}</td>
                        <td className="px-6 py-4 text-slate-400">{lead.phone}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            lead.plan === 'Pro' ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-500/20 text-slate-400"
                          )}>
                            {lead.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{lead.date}</td>
                      </tr>
                    ))}
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