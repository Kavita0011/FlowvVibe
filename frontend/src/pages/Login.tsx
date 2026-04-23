import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Mail, Lock, Eye, EyeOff, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { validateEmail, sanitizeInput } from '../lib/security';
import { auth } from '../lib/api';
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
    
    if (!validateEmail(email)) {
      setLoginError('Invalid email format');
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password;
    setLoading(true);

    try {
      const response = await auth.login(sanitizedEmail, sanitizedPassword);
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        displayName: response.user.displayName,
        role: response.user.role,
        subscription: response.user.subscription || { tier: 'free', status: 'active' },
        createdAt: new Date(),
        isActive: response.user.isActive,
        emailVerified: response.user.emailVerified,
      } as User;
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      setUser(userData);
      setIsAuthenticated(true);
      
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message?.includes('not verified')) {
        setLoginError('Email not verified. Please check your inbox.');
      } else {
        setLoginError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };
    
    if (!validateEmail(email)) {
      setLoginError('Invalid email format');
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    setLoading(true);

    // 1. ADMIN LOGIN (devappkavita@gmail.com)
    if (sanitizedEmail === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        const { token, expires } = createSessionToken('admin_001', 24);
        const adminUser: User = { 
          id: 'admin_001', 
          email: ADMIN_EMAIL, 
          displayName: 'Admin', 
          role: 'admin', 
          subscription: { tier: 'enterprise', status: 'active', startDate: new Date() }, 
          createdAt: new Date(), 
          isActive: true 
        } as User;
        
        localStorage.setItem('session_token', token);
        localStorage.setItem('session_expires', expires.toString());
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('isAuthenticated', 'true');
        
        setUser(adminUser);
        setIsAuthenticated(true);
        navigate('/admin');
        return;
      } else {
        setLoginError('Incorrect admin password');
        setLoading(false);
        return;
      }
    }

    // 2. DEMO USER LOGIN
    const isDemoUser = DEMO_EMAILS.includes(sanitizedEmail.toLowerCase()) && 
                       DEMO_PASSWORDS.includes(password);
    
    if (isDemoUser) {
      const demoUser: User = { 
        id: 'demo_001', 
        email: sanitizedEmail, 
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

    // 3. REGULAR USER - Try Supabase Auth
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed') || error.message.includes('verify')) {
            setLoginError('Please verify your email first. Check your inbox.');
          } else {
            setLoginError('Invalid email or password');
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          const loggedInUser: User = {
            id: data.user.id,
            email: data.user.email || sanitizedEmail,
            displayName: data.user.user_metadata?.display_name || sanitizedEmail.split('@')[0],
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
          return;
        }
      } catch (err) {
        console.error('Supabase error:', err);
        setLoginError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    // No auth method available
    setLoginError('Please login with admin email or register a new account');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5" />Back to Home
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400 mt-2">Login to your FlowvVibe account</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 mb-2 text-sm">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-2 text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Don't have an account? <button onClick={() => navigate('/register')} className="text-cyan-400 hover:text-cyan-300">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}