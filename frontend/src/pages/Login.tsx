import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import type { User } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useChatbotStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    // Check for saved admin credentials
    const savedCreds = localStorage.getItem('adminCredentials');
    let adminEmail = 'devappkavita@gmail.com';
    let adminPass = 'kavitabisht2598@sbi';
    
    if (savedCreds) {
      try {
        const parsed = JSON.parse(savedCreds);
        adminEmail = parsed.email || adminEmail;
        adminPass = parsed.password || adminPass;
      } catch {
        // Use defaults if parse fails
      }
    }
    
    // Demo mode - admin login
    if (email === adminEmail && password === adminPass) {
      const adminUser: User = { 
        id: 'admin_001', 
        email: adminEmail, 
        displayName: 'Admin', 
        role: 'admin', 
        subscription: { tier: 'enterprise', status: 'active', startDate: new Date() }, 
        createdAt: new Date(), 
        isActive: true 
      } as User;
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(adminUser);
      setIsAuthenticated(true);
      navigate('/admin');
      return;
    }

    // Demo user login
    if (email === 'demo@flowvibe.ai' && password === 'demo123') {
      const demoUser: User = { 
        id: 'demo_001', 
        email: 'demo@flowvibe.ai', 
        displayName: 'Demo User', 
        role: 'user', 
        subscription: { tier: 'pro', status: 'active', startDate: new Date() }, 
        createdAt: new Date(), 
        isActive: true 
      } as User;
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(demoUser);
      setIsAuthenticated(true);
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    
    try {
      // Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Supabase login failed, trying demo mode');
        // Demo mode fallback for any email/password
        const demoUser: User = { 
          id: `user_${Date.now()}`, 
          email, 
          displayName: email.split('@')[0], 
          role: 'user', 
          subscription: { tier: 'free', status: 'active', startDate: new Date() }, 
          createdAt: new Date(), 
          isActive: true 
        } as User;
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('isAuthenticated', 'true');
        setUser(demoUser);
        setIsAuthenticated(true);
        navigate('/dashboard');
        return;
      }

      if (data.user) {
        const loggedInUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          displayName: data.user.user_metadata?.display_name || email.split('@')[0],
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          subscription: { tier: 'free', status: 'active', startDate: new Date() }
        };
        
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('isAuthenticated', 'true');
        setUser(loggedInUser);
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback to demo mode
      const demoUser: User = { 
        id: `user_${Date.now()}`, 
        email, 
        displayName: email.split('@')[0], 
        role: 'user', 
        subscription: { tier: 'free', status: 'active', startDate: new Date() }, 
        createdAt: new Date(), 
        isActive: true 
      } as User;
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(demoUser);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5" />Back to Home
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">FlowvVibe</span>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-center mb-8">Login to your account</p>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">{loginError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-slate-400 text-center mt-6">
            Don't have an account? <button onClick={() => navigate('/register')} className="text-cyan-400 hover:text-cyan-300">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
