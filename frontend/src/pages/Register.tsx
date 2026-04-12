import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { supabase } from '../supabase';

export default function Register() {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useChatbotStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!name || !email || !password) {
      setRegisterError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      // Try Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          }
        }
      });

      if (error) {
        // If Supabase fails, use demo mode
        console.log('Supabase error, using demo mode:', error.message);
        
        // Demo mode - create user locally
        const demoUser = {
          id: `user_${Date.now()}`,
          email,
          displayName: name,
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          subscription: { tier: 'free', status: 'active', startDate: new Date() }
        };
        
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('isAuthenticated', 'true');
        setUser(demoUser as any);
        setIsAuthenticated(true);
        navigate('/dashboard');
        return;
      }

      if (data.user) {
        const newUser = {
          id: data.user.id,
          email: data.user.email || email,
          displayName: name,
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          subscription: { tier: 'free', status: 'active', startDate: new Date() }
        };
        
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('isAuthenticated', 'true');
        setUser(newUser as any);
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Fallback to demo mode
      const demoUser = {
        id: `user_${Date.now()}`,
        email,
        displayName: name,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        subscription: { tier: 'free', status: 'active', startDate: new Date() }
      };
      
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(demoUser as any);
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

          <h2 className="text-2xl font-bold text-white text-center mb-2">Create Account</h2>
          <p className="text-slate-400 text-center mb-8">Start building chatbots today</p>

          {registerError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6">{registerError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
              </div>
            </div>

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

            <div>
              <label className="block text-slate-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-cyan-500 focus:outline-none" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-slate-400 text-center mt-6">
            Already have an account? <button onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300">Login</button>
          </p>
        </div>
      </div>
    </div>
  );
}
