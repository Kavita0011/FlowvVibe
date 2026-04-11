import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Mail, Lock, Eye, EyeOff, User, AlertCircle, Check, Send, Timer } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useChatbotStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeRef = useRef<string>('');

  const generateCode = () => Math.random().toString().slice(2, 8);

  const sendVerificationCode = async () => {
    if (!email) {
      setRegisterError('Please enter your email first');
      return;
    }
    // Generate code
    const code = generateCode();
    codeRef.current = code;
    setCodeSent(true);
    setCountdown(60);
    
    // In production, send via backend API
    console.log('Verification code:', code);
    console.log('Sending to email:', email);
    alert(`Verification code sent! (Check console for code: ${code})`);
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerification = async () => {
    if (verificationCode !== codeRef.current) {
      setRegisterError('Invalid verification code');
      return;
    }
    // Code correct, proceed with registration
    const success = await register(email, password, name);
    if (success) {
      navigate('/dashboard');
    } else {
      setRegisterError(error || 'Registration failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setRegisterError('Please fill in all fields');
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

    // Ask to verify email first
    setVerificationStep(true);
    await sendVerificationCode();
  };

  const handleFinalSubmit = async () => {
    if (!verificationCode) {
      setRegisterError('Please enter verification code');
      return;
    }
    await handleVerification();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              FlowvVibe
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Create Account</h1>
          <p className="text-slate-400 text-center mb-8">Start building your AI chatbot today</p>

          {(registerError || error) && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{registerError || error}</span>
            </div>
          )}

          <form onSubmit={verificationStep ? handleFinalSubmit : handleSubmit} className="space-y-5">
            {!verificationStep ? (
              <>
                <div>
                  <label className="block text-slate-400 mb-2 text-sm">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 text-sm">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter your email"
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
                      className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-2 text-sm">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-cyan-400 font-medium">Verify your email</p>
                  <p className="text-slate-400 text-sm">We've sent a code to {email}</p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 text-sm">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-center text-2xl tracking-widest font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0}
                  className="w-full py-2 text-cyan-400 text-sm disabled:opacity-50"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Verify & Create Account'}
                </button>
              </>
            )}
          </form>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>Free bot creation</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>Visual flow builder</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>AI-powered responses</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-400">Already have an account?</p>
            <button 
              onClick={() => navigate('/login')}
              className="text-cyan-400 hover:text-cyan-300 font-medium mt-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}