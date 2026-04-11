import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { 
  Bot, ArrowLeft, CreditCard, Smartphone, Building2, Lock, Check, 
  AlertCircle, Loader2, CheckCircle, Shield, Clock
} from 'lucide-react';

const plans = [
  { id: 'pro', name: 'Pro Plan', price: 499, period: 'month', features: ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 4999, period: 'month', features: ['Unlimited Chatbots', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee'] }
];

const paymentMethods = [
  { id: 'card', name: 'Debit/Credit Card', icon: CreditCard },
  { id: 'upi', name: 'UPI', icon: Smartphone },
  { id: 'netbanking', name: 'Net Banking', icon: Building2 }
];

export default function PaymentGateway() {
  const navigate = useNavigate();
  const { addPayment, user } = useChatbotStore();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');

  const plan = plans.find(p => p.id === selectedPlan) || plans[0];

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, integrate with Razorpay/Stripe API
      const transactionId = `TXN${Date.now()}`;
      
      addPayment({
        id: transactionId,
        userId: user?.id || 'guest',
        amount: plan.price,
        currency: 'INR',
        status: 'completed',
        method: paymentMethod as 'upi' | 'bank_transfer' | 'card',
        plan: plan.id as 'pro' | 'enterprise',
        transactionId,
        createdAt: new Date()
      });

      setSuccess(true);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-6">Welcome to {plan.name}</p>
            
            <div className="bg-slate-700/50 rounded-xl p-4 text-left mb-6">
              <p className="text-slate-400 text-sm mb-2">Transaction ID</p>
              <p className="text-white font-mono">TXN{Date.now()}</p>
            </div>

            <div className="space-y-2 mb-6">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  {f}
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Plan Summary */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20 mb-4">
              <div>
                <p className="text-white font-semibold">{plan.name}</p>
                <p className="text-slate-400 text-sm">Billed monthly</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">₹{plan.price}</p>
                <p className="text-slate-400 text-sm">/month</p>
              </div>
            </div>

            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-white font-semibold mb-4">Change Plan</h3>
            <div className="space-y-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedPlan === p.id 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-cyan-400">₹{p.price}/mo</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <p className="text-slate-400 text-sm">Secure 256-bit SSL encryption</p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Payment Details</h2>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Secure</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-slate-400 mb-2 text-sm">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <method.icon className="w-6 h-6 text-cyan-400" />
                  <span className="text-white text-sm">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-4">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            {paymentMethod === 'card' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-2 text-sm">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                        setExpiry(val);
                      }}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 text-sm">Cardholder Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="Name on card"
                    required
                  />
                </div>
              </>
            )}

            {paymentMethod === 'upi' && (
              <div>
                <label className="block text-slate-400 mb-2 text-sm">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="yourname@upi"
                  required
                />
                <p className="text-slate-500 text-xs mt-2">Example: flowvibe@yesbank</p>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div>
                <label className="block text-slate-400 mb-2 text-sm">Select Bank</label>
                <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                  <option value="">Select your bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Bank</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{plan.price}
                </>
              )}
            </button>

            <p className="text-slate-500 text-xs text-center">
              <Clock className="w-3 h-3 inline mr-1" />
              30-day money-back guarantee • Cancel anytime
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-500 text-xs text-center">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}