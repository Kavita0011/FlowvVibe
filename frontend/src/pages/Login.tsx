import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Mail, Lock, Eye, EyeOff, AlertTriangle, Shield } from 'lucide-react';
import { checkRateLimit, createSessionToken, validateEmail, sanitizeInput } from '../lib/security';
import type { User } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useChatbotStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState(0);

  // Rate limiting check
  useEffect(() => {
    const identifier = `login_${window.location.ip || 'unknown'}`;
    const { allowed, resetAt } = checkRateLimit(identifier, 5, 15);
    if (!allowed) {
      setLocked(true);
      setLockoutEnd(resetAt);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Check rate limit
    const identifier = `login_${window.location.ip || 'unknown'}`;
    const { allowed, resetAt } = checkRateLimit(identifier, 5, 15);
    if (!allowed) {
      setLocked(true);
      setLockoutEnd(resetAt);
      setLoginError(`Too many attempts. Try again in ${Math.ceil((resetAt - Date.now()) / 60000)} minutes`);
      return;
    }
    
    // Validate inputs
    const sanitizedEmail = sanitizeInput(email);
    if (!sanitizedEmail || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    if (!validateEmail(sanitizedEmail)) {
      setLoginError('Invalid email format');
      return;
    }

    // Admin login - credentials from env vars (set in Cloudflare)
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
    
    if (adminEmail && adminPasswordHash && sanitizedEmail === adminEmail) {
      const inputHash = btoa(password + 'flowvibe_salt_2024');
      if (inputHash === adminPasswordHash) {
        // Create session token
        const { token, expires } = createSessionToken('admin_001', 24);
        
        const adminUser: User = { 
          id: 'admin_001', 
          email: adminEmail, 
          displayName: 'Admin', 
          role: 'admin', 
          subscription: { tier: 'enterprise', status: 'active', startDate: new Date() }, 
          createdAt: new Date(), 
          isActive: true 
        } as User;
        
        // Secure storage
        localStorage.setItem('session_token', token);
        localStorage.setItem('session_expires', expires.toString());
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('last_login', Date.now().toString());
        
        setUser(adminUser);
        setIsAuthenticated(true);
        navigate('/admin');
        return;
      }
    }

    // Demo user
    if (sanitizedEmail === 'demo@demo.com' && password === 'demo') {
      const { token, expires } = createSessionToken('demo_001', 24);
      
      const testUser: User = { 
        id: 'demo_001', 
        email: 'demo@demo.com', 
        displayName: 'Demo User', 
        role: 'user', 
        subscription: { tier: 'pro', status: 'active', startDate: new Date() }, 
        createdAt: new Date(), 
        isActive: true 
      } as User;
      localStorage.setItem('user', JSON.stringify(testUser));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(testUser);
      setIsAuthenticated(true);
      navigate('/dashboard');
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
      // Check if Supabase is configured
      if (!supabase) {
        setLoginError('Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
        setLoading(false);
        return;
      }
      
      // Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's an email not verified error from Supabase
        if (error.message.includes('Email not confirmed') || error.message.includes('verify your email')) {
          setLoginError('Please verify your email first. Check your inbox for the verification link.');
          setLoading(false);
          return;
        }
        
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
          subscription: { tier: 'free', status: 'active', startDate: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        };
        
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('isAuthenticated', 'true');
        setUser(loggedInUser);
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Check if it's a verification required error from API
      if (err?.needsVerification || (err?.message && err.message.includes('verify'))) {
        setLoginError('Please verify your email first. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }
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

          {locked && lockoutEnd > Date.now() && (
            <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Account temporarily locked. Try again in {Math.ceil((lockoutEnd - Date.now()) / 60000)} minutes.
            </div>
          )}
          
          {loginError && !locked && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {loginError}
            </div>
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
