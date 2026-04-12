export type Plan = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period?: string;
  description?: string;
  features?: string[];
  popular?: boolean;
  isOnSale?: boolean;
  saleTitle?: string;
  validFor?: string;
};

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['1 Chatbot', '50 Conversations', 'Basic Analytics', 'Email Support'],
    validFor: 'Forever'
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    features: ['2 Chatbots', '500 Conversations', 'Premium Widget', 'Slack Integration'],
    validFor: 'Lifetime'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2499,
    features: ['5 Chatbots', 'Unlimited Conversations', 'All Channels', 'Priority Support', 'Advanced Analytics', 'Custom Branding', 'Export Widget'],
    popular: true,
    validFor: 'Lifetime'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    features: ['Unlimited Chatbots', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'White Label', 'API Access'],
    validFor: 'Lifetime'
  }
];

export function loadPricingPlans(): Plan[] {
  const raw = localStorage.getItem('vf_pricing_plans');
  if (raw) {
    try { return JSON.parse(raw) as Plan[]; } catch { /* ignore */ }
  }
  return DEFAULT_PLANS;
}

export function savePricingPlans(plans: Plan[]): void {
  localStorage.setItem('vf_pricing_plans', JSON.stringify(plans));
}

export function resetPricingPlans(): void {
  localStorage.setItem('vf_pricing_plans', JSON.stringify(DEFAULT_PLANS));
}

export const getCurrentPlans = (): Plan[] => loadPricingPlans();
