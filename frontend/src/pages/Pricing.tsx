import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, ArrowLeft, Check, CreditCard, Smartphone, Sparkles, Shield, Clock } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    originalPrice: 0,
    period: 'forever',
    description: 'Perfect for testing',
    features: ['1 Chatbot', '50 Conversations/month', 'Basic Widget', 'Email Support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    originalPrice: 999,
    period: 'month',
    description: 'Most Popular',
    features: ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support', 'Advanced Analytics', 'Custom Branding'],
    popular: true,
    isOnSale: true,
    saleTitle: 'Festival Sale'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    originalPrice: 9999,
    period: 'month',
    description: 'For large teams',
    features: ['Unlimited Chatbots', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'White Label', 'API Access'],
    popular: false,
    isOnSale: true,
    saleTitle: 'Festival Sale'
  }
];

const addons = [
  { id: 'bookings', name: 'Booking System', price: 199, description: 'Appointment scheduling & calendar integration', icon: '📅', features: ['Multiple services', 'Time slots', 'Email confirmations', 'Calendar sync'] },
  { id: 'call', name: 'Voice Calls', price: 299, description: 'Click-to-call & IVR', icon: '📞', features: ['Twilio integration', 'Call forwarding', 'Voicemail', 'Call recording'] },
  { id: 'email', name: 'Email Marketing', price: 249, description: 'Automated email sequences', icon: '📧', features: ['SMTP integration', 'Email templates', 'Automated sequences', 'Analytics'] },
  { id: 'humanHandoff', name: 'Human Handoff', price: 149, description: 'Live agent transfer', icon: '👤', features: ['Agent dashboard', 'Chat routing', 'Canned responses', 'Priority alerts'] },
  { id: 'webhooks', name: 'Webhooks & Zapier', price: 199, description: 'Connect 1000+ apps', icon: '🔗', features: ['Zapier integration', 'Custom webhooks', '300+ apps', 'Custom actions'] },
  { id: 'crm', name: 'CRM Integration', price: 349, description: 'Salesforce, HubSpot, Zoho', icon: '🔧', features: ['Salesforce sync', 'HubSpot integration', 'Custom CRM', 'Lead mapping'] }
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useChatbotStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]);
  };

  const addonTotal = selectedAddons.reduce((sum, id) => sum + (addons.find(a => a.id === id)?.price || 0), 0);
  const totalPrice = (plans.find(p => p.id === selectedPlan)?.price || 0) + addonTotal;

  const handlePurchase = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md text-center">
          <Clock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">Please login to upgrade your plan</p>
          <button onClick={() => navigate('/login')} className="w-full py-3 bg-cyan-500 text-white rounded-xl font-medium">Login to Continue</button>
          <button onClick={() => navigate('/register')} className="w-full mt-3 py-3 border border-cyan-500 text-cyan-400 rounded-xl font-medium">Create Account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"><ArrowLeft className="w-5 h-5" />Back</button>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-slate-400">Select the perfect plan for your business</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-slate-800 rounded-2xl p-6 border-2 transition-all ${plan.popular ? 'border-cyan-500 relative' : 'border-slate-700 hover:border-slate-600'}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-4 py-1 bg-cyan-500 text-white text-sm font-medium rounded-full">Most Popular</span></div>}
              {plan.isOnSale && <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs"><Sparkles className="w-3 h-3" />{plan.saleTitle}</div>}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                {plan.originalPrice > 0 && <span className="text-slate-500 line-through mr-2">₹{plan.originalPrice}</span>}
                <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                {plan.price > 0 && <span className="text-slate-400">/{plan.period}</span>}
              </div>
              <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
              <ul className="space-y-3 mb-6">{plan.features.map((feature, i) => (<li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><Check className="w-4 h-4 text-green-400 flex-shrink-0" />{feature}</li>))}</ul>
              <button onClick={() => setSelectedPlan(plan.id)} disabled={plan.price === 0} className={`w-full py-3 rounded-xl font-medium transition-all ${plan.popular ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500' : 'border border-cyan-500 text-cyan-400 hover:bg-cyan-500/20'} disabled:opacity-50`}>
                {plan.price === 0 ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Premium Add-ons</h2>
          <p className="text-slate-400 text-center mb-8">Enhance your plan with powerful features</p>
          <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-4">
            {addons.map((addon) => (
              <div key={addon.id} className={`bg-slate-800 rounded-xl p-5 border-2 cursor-pointer transition-all ${selectedAddons.includes(addon.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}`} onClick={() => toggleAddon(addon.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div><span className="text-3xl">{addon.icon}</span>
                    <h4 className="text-lg font-bold text-white mt-2">{addon.name}</h4>
                    <p className="text-slate-400 text-sm">{addon.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAddons.includes(addon.id) ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'}`}>
                    {selectedAddons.includes(addon.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-3"><span className="text-2xl font-bold text-white">₹{addon.price}</span><span className="text-slate-400">/month</span></div>
                <ul className="space-y-1">{addon.features.map((feature, i) => (<li key={i} className="flex items-center gap-2 text-slate-300 text-xs"><Check className="w-3 h-3 text-green-400 flex-shrink-0" />{feature}</li>))}</ul>
              </div>
            ))}
          </div>
        </div>

        {selectedPlan && plans.find(p => p.id === selectedPlan)?.price > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Payment - {plans.find(p => p.id === selectedPlan)?.name}{selectedAddons.length > 0 && <span className="text-cyan-400 text-lg ml-2">+ {selectedAddons.length} addons (₹{addonTotal}/mo)</span>}</h3>
            <div className="mb-6">
              <label className="block text-slate-400 mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPaymentMethod('upi')} className={`p-4 rounded-xl border flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600'}`}><Smartphone className="w-5 h-5 text-cyan-400" /><span className="text-white">UPI</span></button>
                <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-xl border flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600'}`}><CreditCard className="w-5 h-5 text-cyan-400" /><span className="text-white">Card</span></button>
              </div>
            </div>
            {paymentMethod === 'upi' && (
              <div className="mb-6">
                <label className="block text-slate-400 mb-2">Your UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" />
              </div>
            )}
            {paymentMethod === 'card' && (
              <div className="space-y-4 mb-6">
                <div><label className="block text-slate-400 mb-2">Card Number</label><input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-slate-400 mb-2">Expiry</label><input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" /></div>
                  <div><label className="block text-slate-400 mb-2">CVV</label><input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" /></div>
                </div>
                <div><label className="block text-slate-400 mb-2">Name on Card</label><input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white" /></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm"><Shield className="w-4 h-4 text-green-400" />Secure payment powered by Razorpay</div>
            <button onClick={handlePurchase} disabled={processing} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl">
              {processing ? 'Processing...' : `Pay ₹${totalPrice}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}