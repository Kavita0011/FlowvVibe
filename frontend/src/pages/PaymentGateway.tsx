import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { 
  ArrowLeft, Smartphone, Loader2, CheckCircle, Shield, Download, Copy, CopyCheck,
  CreditCard, Building, QrCode
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

const getPaymentSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('paymentSettings') || 'null');
  } catch { return null; }
};

const defaultSettings = {
  upi: 'devappkavita@oksbi',
  bankName: 'State Bank of India',
  accountNumber: '',
  ifsc: ''
};

const RAZORPAY_KEY = 'rzp_live_Sgm4nHdmhUAnut';

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPayment, user } = useChatbotStore();
  const razorpayLoaded = useRef(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [PLANS_DATA, setPlansData] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'bank'>('razorpay');

  const paymentSettings = getPaymentSettings() || defaultSettings;

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

    if (!razorpayLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => { razorpayLoaded.current = true; };
      document.body.appendChild(script);
    }
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

  const handleRazorpayPayment = async () => {
    if (!(window as any).Razorpay) {
      alert('Payment gateway loading... please try again');
      return;
    }

    setProcessing(true);

    try {
      const orderData = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: transactionId,
        plan: selectedPlan.id,
        userId: user?.id,
        userEmail: user?.email
      };

      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: 'INR',
        name: 'FlowvVibe',
        description: `${selectedPlan.name} Plan - ${selectedPlan.id.toUpperCase()}`,
        order_id: '',
        handler: async (response: any) => {
          const paymentData = {
            id: transactionId,
            userId: user?.id,
            userEmail: user?.email,
            amount: totalAmount,
            status: 'completed',
            plan: selectedPlan.id,
            utrNumber: response.razorpay_payment_id || transactionId,
            addons: selectedAddons,
            createdAt: new Date().toISOString(),
            approved: true,
            activated: true,
            paymentMethod: 'razorpay',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          };
          
          addPayment(paymentData as any);
          
          const existingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
          localStorage.setItem('pendingPayments', JSON.stringify([...existingPayments, paymentData]));
          
          setPaymentStep('success');
        },
        prefill: {
          name: user?.displayName || 'Customer',
          email: user?.email || '',
          contact: ''
        },
        theme: {
          color: '#06b6d4'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    if (utrNumber.length < 6) return;
    setProcessing(true);
    try {
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
        approved: false,
        activated: false,
        paymentMethod: paymentMethod === 'upi' ? 'upi' : 'bank'
      };
      
      addPayment(paymentData as any);
      
      const existingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
      localStorage.setItem('pendingPayments', JSON.stringify([...existingPayments, paymentData]));
      
      setPaymentStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-400 mb-6">Your plan has been activated. Enjoy FlowvVibe!</p>
          
          <div className="bg-slate-700/50 rounded-xl p-4 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">Transaction ID</span>
              <span className="text-white font-mono">{transactionId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">Plan</span>
              <span className="text-white">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-green-400 font-bold">₹{totalAmount}</span>
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
        <p className="text-slate-400 mb-6">Choose your preferred payment method</p>

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

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setPaymentMethod('razorpay')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'razorpay' 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <span className="text-white text-sm font-medium">Card/Netbanking</span>
          </button>
          <button
            onClick={() => setPaymentMethod('upi')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'upi' 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <QrCode className="w-6 h-6 text-purple-400" />
            <span className="text-white text-sm font-medium">UPI</span>
          </button>
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              paymentMethod === 'bank' 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <Building className="w-6 h-6 text-green-400" />
            <span className="text-white text-sm font-medium">Bank Transfer</span>
          </button>
        </div>

        {paymentMethod === 'razorpay' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Pay via Razorpay</h2>
            <p className="text-slate-400 text-sm mb-4">Secure payment with cards, UPI, netbanking & wallets</p>
            <button 
              onClick={handleRazorpayPayment}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {processing ? 'Processing...' : `Pay ₹${totalAmount} with Razorpay`}
            </button>
            <p className="text-slate-500 text-xs text-center mt-3">Secured by Razorpay</p>
          </div>
        )}

        {paymentMethod === 'upi' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Pay via UPI</h2>
            <div className="bg-slate-700/50 rounded-xl p-4 text-center mb-4">
              <Smartphone className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-2">Scan QR or copy UPI ID</p>
              <div className="flex items-center justify-center gap-2 bg-slate-800 rounded-lg p-3">
                <span className="text-white font-mono text-lg">{paymentSettings.upi}</span>
                <button onClick={() => copyToClipboard(paymentSettings.upi, 'upi')} className="text-cyan-400">
                  {copiedField === 'upi' ? <CopyCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mt-4">
              <h3 className="text-white font-medium mb-3">Verify Payment</h3>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="Enter UTR / Transaction ID"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-3"
              />
              <button 
                onClick={handleManualPayment}
                disabled={utrNumber.length < 6 || processing}
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {processing ? 'Submitting...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        )}

        {paymentMethod === 'bank' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Bank Transfer</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Bank Name</span>
                <span className="text-white">{paymentSettings.bankName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Account No.</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{paymentSettings.accountNumber || 'XXXXXX7890'}</span>
                  {paymentSettings.accountNumber && (
                    <button onClick={() => copyToClipboard(paymentSettings.accountNumber, 'account')} className="text-cyan-400">
                      {copiedField === 'account' ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">IFSC Code</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{paymentSettings.ifsc || 'SBIN0004633'}</span>
                  {paymentSettings.ifsc && (
                    <button onClick={() => copyToClipboard(paymentSettings.ifsc, 'ifsc')} className="text-cyan-400">
                      {copiedField === 'ifsc' ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Amount</span>
                <span className="text-cyan-400 font-bold">₹{totalAmount}</span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-4">
              <h3 className="text-white font-medium mb-3">Verify Payment</h3>
              <p className="text-slate-400 text-xs mb-3">Enter UTR from bank statement after transfer</p>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="Enter UTR / Transaction ID"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-3"
              />
              <button 
                onClick={handleManualPayment}
                disabled={utrNumber.length < 6 || processing}
                className="w-full py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {processing ? 'Submitting...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}