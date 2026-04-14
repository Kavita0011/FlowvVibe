import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  ArrowLeft, CreditCard, Smartphone, Building2, Lock, Check, 
  Loader2, CheckCircle, Shield, Download, FileText, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADDONS_DATA = [
  { id: 'bookings', name: 'Booking System', price: 499, features: ['Multiple services', 'Time slots', 'Email confirmations', 'Calendar sync'] },
  { id: 'call', name: 'Voice Calls', price: 699, features: ['Twilio integration', 'Call forwarding', 'Voicemail', 'Call recording'] },
  { id: 'email', name: 'Email Marketing', price: 599, features: ['SMTP integration', 'Email templates', 'Automated sequences', 'Analytics'] },
  { id: 'humanHandoff', name: 'Human Handoff', price: 349, features: ['Agent dashboard', 'Chat routing', 'Canned responses', 'Priority alerts'] },
  { id: 'webhooks', name: 'Webhooks & Zapier', price: 499, features: ['Zapier integration', 'Custom webhooks', '300+ apps', 'Custom actions'] },
  { id: 'crm', name: 'CRM Integration', price: 799, features: ['Salesforce sync', 'HubSpot integration', 'Custom CRM', 'Lead mapping'] }
];

const planFeatures: Record<string, string[]> = {
  'free': ['1 Chatbot', '50 Conversations', 'Basic Widget', 'All Flow Features'],
  'starter': ['2 Chatbots', '500 Conversations', 'Premium Widget', 'Slack Integration'],
  'pro': ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support', 'Advanced Analytics', 'Custom Branding', 'Export Widget'],
  'enterprise': ['Unlimited Chatbots', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'White Label', 'API Access']
};

const defaultPlans = [
  { id: 'free', name: 'Free', price: 0, features: planFeatures['free'] },
  { id: 'starter', name: 'Starter', price: 999, features: planFeatures['starter'] },
  { id: 'pro', name: 'Pro', price: 2499, features: planFeatures['pro'] },
  { id: 'enterprise', name: 'Enterprise', price: 9999, features: planFeatures['enterprise'] }
];

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPayment, user } = useChatbotStore();
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [PLANS_DATA, setPlansData] = useState<any[]>(defaultPlans);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase.from('pricing_plans').select('*').order('price', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          setPlansData(data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            features: planFeatures[plan.id] || []
          })));
        }
      } catch (err) {
        console.log('Using default pricing');
      }
    }
    fetchPlans();
  }, []);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'bank'>('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  
  const [selectedPlanId] = useState(location.state?.plan || 'pro');
  const [selectedAddons] = useState<string[]>(location.state?.addons || []);

  const plan = PLANS_DATA.length > 0 ? PLANS_DATA.find(p => p.id === selectedPlanId) || PLANS_DATA.find(p => p.id === 'pro') || PLANS_DATA[0] : { id: 'pro', name: 'Pro', price: 2499, features: [] };
  const selectedAddonData = ADDONS_DATA.filter(a => selectedAddons.includes(a.id));
  const addonTotal = selectedAddonData.reduce((sum, a) => sum + a.price, 0);
  const totalAmount = plan.price + addonTotal;
  const transactionId = `FVTXN${Date.now()}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      addPayment({
        id: transactionId,
        userId: user?.id || 'guest',
        amount: totalAmount,
        currency: 'INR',
        status: 'completed',
        method: selectedMethod === 'bank' ? 'bank_transfer' : selectedMethod,
        plan: plan.id as 'pro' | 'enterprise',
        transactionId,
        createdAt: new Date()
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const canSubmit = () => {
    if (selectedMethod === 'card') {
      return cardNumber.length >= 16 && cardExpiry && cardCvv && cardName;
    } else if (selectedMethod === 'upi') {
      return utrNumber.length >= 6;
    } else if (selectedMethod === 'bank') {
      return utrNumber.length >= 6;
    }
    return false;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-6">Welcome to {plan.name} Plan</p>
            
            <div className="bg-slate-700/50 rounded-xl p-4 text-left mb-6">
              <div className="flex justify-between py-2 border-b border-slate-600">
                <span className="text-slate-400">Invoice ID</span>
                <span className="text-white font-mono">{transactionId}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-white font-bold">₹{totalAmount}</span>
              </div>
            </div>

            <div className="text-left mb-6">
              <p className="text-slate-400 text-xs mb-2">Plan Includes:</p>
              {plan.features.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  {f}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const blob = new Blob([`INVOICE\nInvoice: ${transactionId}\nAmount: ₹${totalAmount}\nPlan: ${plan.name}\nDate: ${new Date().toLocaleDateString()}`, { type: 'text/plain' }]);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `invoice-${transactionId}.txt`; a.click();
                }}
                className="flex-1 py-3 border border-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Invoice
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", paymentStep === 'method' ? "bg-cyan-500" : "bg-green-500")} />
            <div className={cn("w-8 h-0.5", paymentStep === 'method' ? "bg-slate-600" : "bg-green-500")} />
            <div className={cn("w-3 h-3 rounded-full", paymentStep === 'details' ? "bg-cyan-500" : paymentStep === 'confirm' ? "bg-green-500" : "bg-slate-600")} />
            <div className={cn("w-8 h-0.5", paymentStep === 'confirm' ? "bg-green-500" : "bg-slate-600")} />
            <div className={cn("w-3 h-3 rounded-full", paymentStep === 'confirm' ? "bg-green-500" : "bg-slate-600")} />
          </div>
          <Shield className="w-5 h-5 text-green-400" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              {paymentStep === 'method' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Select Payment Method</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => { setSelectedMethod('card'); setPaymentStep('details'); }}
                      className="p-6 rounded-xl border-2 border-slate-600 hover:border-cyan-500 transition-all flex flex-col items-center gap-3"
                    >
                      <CreditCard className="w-8 h-8 text-cyan-400" />
                      <span className="text-white font-medium">Card</span>
                    </button>
                    <button
                      onClick={() => { setSelectedMethod('upi'); setPaymentStep('details'); }}
                      className="p-6 rounded-xl border-2 border-slate-600 hover:border-cyan-500 transition-all flex flex-col items-center gap-3"
                    >
                      <Smartphone className="w-8 h-8 text-purple-400" />
                      <span className="text-white font-medium">UPI</span>
                    </button>
                    <button
                      onClick={() => { setSelectedMethod('bank'); setPaymentStep('details'); }}
                      className="p-6 rounded-xl border-2 border-slate-600 hover:border-cyan-500 transition-all flex flex-col items-center gap-3"
                    >
                      <Building2 className="w-8 h-8 text-green-400" />
                      <span className="text-white font-medium">Bank</span>
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'details' && (
                <div className="p-6">
                  <button onClick={() => setPaymentStep('method')} className="text-slate-400 text-sm mb-4 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Change method
                  </button>
                  
                  {selectedMethod === 'card' && (
                    <form onSubmit={handlePayment} className="space-y-4">
                      <h2 className="text-xl font-bold text-white">Card Details</h2>
                      <div>
                        <label className="text-slate-400 text-sm">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="1234 5678 9012 3456"
                          className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-400 text-sm">Expiry</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-sm">CVV</label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-400 text-sm">Name on Card</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="JOHN DOE"
                          className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!canSubmit() || processing}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {processing ? 'Processing...' : `Pay ₹${totalAmount}`}
                      </button>
                    </form>
                  )}

                  {selectedMethod === 'upi' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-white">UPI Payment</h2>
                      <div className="bg-slate-700/50 rounded-xl p-6 text-center">
                        <Smartphone className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <p className="text-white text-lg font-bold mb-2">₹{totalAmount}</p>
                        <p className="text-slate-400 text-sm mb-4">Open your UPI app & pay to:</p>
                        <div className="bg-slate-800 rounded-lg p-3 inline-block">
                          <span className="text-white font-mono">kavitabisht2598@sbi</span>
                          <button onClick={() => copyToClipboard('kavitabisht2598@sbi')} className="ml-2 text-cyan-400">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-400 text-sm">Enter UTR / Reference Number</label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="XXXXXXXXXXXX"
                          className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        />
                        <p className="text-slate-500 text-xs mt-2">Find in your UPI app after payment</p>
                      </div>
                      <button 
                        onClick={handlePayment}
                        disabled={!canSubmit() || processing}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {processing ? 'Verifying...' : 'Confirm Payment'}
                      </button>
                    </div>
                  )}

                  {selectedMethod === 'bank' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-white">Bank Transfer</h2>
                      <div className="bg-slate-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-400">Bank</span>
                          <span className="text-white">State Bank of India</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-400">Account No.</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">45065191325</span>
                            <button onClick={() => copyToClipboard('45065191325')} className="text-cyan-400">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-400">IFSC</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">SBIN0004633</span>
                            <button onClick={() => copyToClipboard('SBIN0004633')} className="text-cyan-400">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                          <span className="text-slate-400">Amount</span>
                          <span className="text-cyan-400 font-bold text-xl">₹{totalAmount}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-400 text-sm">UTR / Reference Number</label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="Enter UTR from bank statement"
                          className="w-full mt-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        />
                      </div>
                      <button 
                        onClick={handlePayment}
                        disabled={!canSubmit() || processing}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {processing ? 'Verifying...' : 'Confirm Payment'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold">Order Summary</h3>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg mb-4">
                <div>
                  <p className="text-white font-medium">{plan.name} Plan</p>
                  <p className="text-slate-400 text-sm">Lifetime access</p>
                </div>
                <p className="text-white font-bold">₹{plan.price}</p>
              </div>
              {selectedAddonData.length > 0 && (
                <div className="space-y-2 mb-4">
                  {selectedAddonData.map(addon => (
                    <div key={addon.id} className="flex justify-between text-sm">
                      <span className="text-slate-400">{addon.name}</span>
                      <span className="text-white">₹{addon.price}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-600">
                <span className="text-white font-bold">Total</span>
                <span className="text-cyan-400 font-bold text-xl">₹{totalAmount}</span>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">256-bit SSL encryption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}