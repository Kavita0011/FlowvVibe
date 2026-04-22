import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  ArrowLeft, Smartphone, Loader2, CheckCircle, Shield, Download, Copy, CopyCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADDONS_DATA = [
  { id: 'bookings', name: 'Booking System', price: 499 },
  { id: 'call', name: 'Voice Calls', price: 699 },
  { id: 'email', name: 'Email Marketing', price: 599 },
  { id: 'humanHandoff', name: 'Human Handoff', price: 349 },
  { id: 'webhooks', name: 'Webhooks & Zapier', price: 499 },
  { id: 'crm', name: 'CRM Integration', price: 799 }
];

// Admin payment settings - load from localStorage (set in admin panel)
const getPaymentSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('paymentSettings') || 'null');
  } catch { return null; }
};

const defaultSettings = {
  upi: 'devappkavita@oksbi',
  bankName: 'FlowvVibe',
  accountNumber: '',
  ifsc: ''
};

const paymentSettings = getPaymentSettings() || defaultSettings;

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPayment, user } = useChatbotStore();
  const [paymentStep, setPaymentStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [PLANS_DATA, setPlansData] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (data && data.length > 0) {
          setPlansData(data.map((tier: any) => ({
            id: tier.tier_key || tier.id,
            name: tier.name,
            price: tier.price,
            features: tier.metadata?.features || []
          })));
        }
      } catch (err) {
        console.log('Using default pricing');
      }
    }
    fetchPlans();
  }, []);

  const locationState = location.state as { plan?: string; addons?: string[] } | null;
  const selectedPlanId = locationState?.plan || 'pro';
  const selectedPlan = PLANS_DATA.find(p => p.id === selectedPlanId) || PLANS_DATA[1] || { id: 'pro', name: 'Pro', price: 2499 };
  const addonTotal = ADDONS_DATA.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const totalAmount = selectedPlan.price + addonTotal;
  const transactionId = `FV${Date.now()}`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleConfirm = async () => {
    if (utrNumber.length < 6) return;
    setProcessing(true);
    try {
      // Save payment as PENDING - requires admin approval
      const paymentData = {
        id: transactionId,
        userId: user?.id,
        userEmail: user?.email,
        amount: totalAmount,
        status: 'pending',
        plan: selectedPlan.id,
        utrNumber: utrNumber,
        addons: selectedAddons,
        createdAt: new Date().toISOString(),
        approved: false, // requires admin approval
        activated: false // requires admin approval
      };
      
      // Save to store
      addPayment(paymentData as any);
      
      // Also save to localStorage for persistence
      const existingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
      localStorage.setItem('pendingPayments', JSON.stringify([...existingPayments, paymentData]));
      
      setPaymentStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (paymentStep === 'success' || success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-slate-400 mb-6">We'll verify your payment & activate your plan within 24 hours.</p>
          
          <div className="bg-slate-700/50 rounded-xl p-4 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">Transaction ID</span>
              <span className="text-white font-mono">{transactionId}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-white font-bold">₹{totalAmount}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <Shield className="w-5 h-5 text-green-400" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Complete Payment</h1>
        <p className="text-slate-400 mb-6">Pay via UPI or Bank Transfer</p>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">Plan</span>
            <span className="text-white">{selectedPlan.name}</span>
          </div>
          {selectedAddons.length > 0 && (
            <div className="flex justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Add-ons</span>
              <span className="text-white">₹{addonTotal}</span>
            </div>
          )}
          <div className="flex justify-between py-3">
            <span className="text-white font-bold">Total</span>
            <span className="text-cyan-400 font-bold text-xl">₹{totalAmount}</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Pay to UPI</h2>
          <div className="bg-slate-700/50 rounded-xl p-4 text-center mb-4">
            <Smartphone className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-2">Scan QR or copy UPI ID</p>
            <div className="flex items-center justify-center gap-2 bg-slate-800 rounded-lg p-3">
              <span className="text-white font-mono text-lg">{paymentSettings.upi}</span>
              <button onClick={() => copyToClipboard(ADMIN_UPI, 'upi')} className="text-cyan-400">
                {copiedField === 'upi' ? <CopyCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Or Pay via Bank</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400">Bank</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{paymentSettings.bankName}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-400">Account No.</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{ADMIN_ACCOUNT}</span>
                <button onClick={() => copyToClipboard(ADMIN_ACCOUNT, 'account')} className="text-cyan-400">
                  {copiedField === 'account' ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">IFSC</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{ADMIN_IFSC}</span>
                <button onClick={() => copyToClipboard(ADMIN_IFSC, 'ifsc')} className="text-cyan-400">
                  {copiedField === 'ifsc' ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Verify Payment</h2>
          <p className="text-slate-400 text-sm mb-4">Enter the UTR/Transaction ID from your payment app or bank statement after completing the payment.</p>
          <input
            type="text"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
            placeholder="Enter UTR / Transaction ID"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-4"
          />
          <button 
            onClick={handleConfirm}
            disabled={utrNumber.length < 6 || processing}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {processing ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}