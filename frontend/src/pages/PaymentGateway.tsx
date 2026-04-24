import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { payments } from '../lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Smartphone, Loader2, CheckCircle, Shield, Download, Copy,
  CreditCard, Building, QrCode, Clock, AlertCircle, ExternalLink
} from 'lucide-react';

const ADDONS_DATA = [
  { id: 'bookings', name: 'Booking System', price: 1 },
  { id: 'call', name: 'Voice Calls', price: 1 },
  { id: 'email', name: 'Email Marketing', price: 1 },
  { id: 'humanHandoff', name: 'Human Handoff', price: 1 },
  { id: 'webhooks', name: 'Webhooks & Zapier', price: 1 },
  { id: 'crm', name: 'CRM Integration', price: 1 }
];

const PLANS_DEFAULT = [
  { id: 'free', name: 'Free', price: 0 },
  { id: 'starter', name: 'Starter', price: 1 },
  { id: 'pro', name: 'Pro', price: 1 },
  { id: 'enterprise', name: 'Enterprise', price: 1 }
];

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, addPayment } = useChatbotStore();
  const razorpayLoaded = useRef(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'pending'>('details');
  const [processing, setProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'bank'>('upi');
  const [paymentSettings, setPaymentSettings] = useState({
    upi: 'support@flowvibe',
    bankName: 'FlowvVibe',
    accountNumber: '',
    ifsc: ''
  });

  useEffect(() => {
    fetchPaymentSettings();

    if (!razorpayLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => { razorpayLoaded.current = true; };
      document.body.appendChild(script);
    }
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/settings`);
      if (res.ok) {
        const data = await res.json();
        setPaymentSettings(data);
      }
    } catch {
      // Use default
    }
  };

  const locationState = location.state as { plan?: string; addons?: string[] } | null;
  const selectedPlanId = locationState?.plan || 'pro';
  const selectedPlan = PLANS_DEFAULT.find(p => p.id === selectedPlanId) || PLANS_DEFAULT[2];
  const addonTotal = ADDONS_DATA.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const totalAmount = selectedPlan.price + addonTotal;
  const transactionId = `FV${Date.now()}`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleManualPayment = async () => {
    if (utrNumber.length < 12 || utrNumber.length > 18) {
      toast.error('UTR must be 12-18 digits');
      return;
    }

    if (!/^\d+$/.test(utrNumber)) {
      toast.error('UTR must contain only numbers');
      return;
    }

    setProcessing(true);
    try {
      const paymentData = {
        amount: totalAmount,
        plan: selectedPlan.id,
        utr_number: utrNumber,
        method: paymentMethod
      };

      const result = await payments.create(paymentData);

      if (result.success || result.transaction_id) {
        const paymentRecord = {
          id: result.transaction_id || transactionId,
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

        addPayment(paymentRecord as any);
        setPaymentStep('pending');
      } else {
        toast.error(result.error || 'Failed to submit payment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment submission failed');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentStep === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h2>
          <p className="text-slate-400 mb-6">
            Your payment is under review. This usually takes 24-48 hours.
            You'll receive an email once approved.
          </p>

          <div className="bg-slate-700/50 rounded-xl p-4 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">Transaction ID</span>
              <span className="text-white font-mono">{transactionId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">UTR Number</span>
              <span className="text-white font-mono">{utrNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-600">
              <span className="text-slate-400">Plan</span>
              <span className="text-white">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-yellow-400 font-bold">₹{totalAmount}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Your plan will be activated after admin verifies your payment.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-semibold text-white">Complete Payment</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Plan</span>
              <span className="text-white font-medium">{selectedPlan.name}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Add-ons ({selectedAddons.length})</span>
                <span className="text-white">+₹{addonTotal}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-700">
              <span className="text-white font-bold">Total</span>
              <span className="text-cyan-400 font-bold text-xl">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex-1 py-3 rounded-lg border-2 transition-colors ${paymentMethod === 'upi' ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-600 hover:border-slate-500'}`}
            >
              <QrCode className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <span className="text-sm text-white">UPI / QR</span>
            </button>
            <button
              onClick={() => setPaymentMethod('bank')}
              className={`flex-1 py-3 rounded-lg border-2 transition-colors ${paymentMethod === 'bank' ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-600 hover:border-slate-500'}`}
            >
              <Building className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <span className="text-sm text-white">Bank Transfer</span>
            </button>
          </div>

          {paymentMethod === 'upi' ? (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm mb-2">Scan QR or pay to UPI ID</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📱</span>
                  <span className="text-xl text-white font-mono">{paymentSettings.upi}</span>
                  <button
                    onClick={() => copyToClipboard(paymentSettings.upi, 'upi')}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {copiedField === 'upi' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">After payment, enter UTR below</span>
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                  placeholder="Enter 12-digit UTR"
                  maxLength={18}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-slate-500 text-xs mt-2">
                  UTR is the 12-18 digit reference from your payment app/bank
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Name</span>
                <span className="text-white">{paymentSettings.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number</span>
                <span className="text-white font-mono">
                  {paymentSettings.accountNumber || 'XXXX1234'}
                  <button onClick={() => copyToClipboard(paymentSettings.accountNumber, 'acc')} className="ml-2">
                    <Copy className="w-4 h-4 inline text-slate-400" />
                  </button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC Code</span>
                <span className="text-white font-mono">
                  {paymentSettings.ifsc || 'XXXX0000'}
                  <button onClick={() => copyToClipboard(paymentSettings.ifsc, 'ifsc')} className="ml-2">
                    <Copy className="w-4 h-4 inline text-slate-400" />
                  </button>
                </span>
              </div>

              <div className="pt-3 border-t border-slate-600">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">After payment, enter UTR below</span>
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                  placeholder="Enter 12-digit UTR"
                  maxLength={18}
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleManualPayment}
          disabled={processing || utrNumber.length < 12}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Payment (UTR: {utrNumber || '—'})
            </>
          )}
        </button>

        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-medium">Payment Verification</p>
              <p className="text-yellow-400/70 text-sm mt-1">
                After you submit, our team verifies the payment within 24-48 hours.
                You'll receive an email when your plan is activated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}