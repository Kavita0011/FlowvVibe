/**
 * Currency detection and conversion
 * Detects user's country and displays appropriate currency
 */

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to INR
  flag: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1, flag: '🇮🇳' },
  US: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012, flag: '🇺🇸' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095, flag: '🇬🇧' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011, flag: '🇪🇺' },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.016, flag: '🇨🇦' },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.018, flag: '🇦🇺' },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.016, flag: '🇸🇬' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.044, flag: '🇦🇪' },
};

const PRICE_IN_INR = {
  free: 0,
  starter: 999,
  pro: 2499,
  enterprise: 9999,
};

export function getCountryFromGeo(geo: string | undefined): string {
  const geoMap: Record<string, string> = {
    IN: 'IN', GB: 'GB', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU',
    US: 'US', CA: 'CA', AU: 'AU', SG: 'SG', AE: 'AE',
  };
  return geoMap[geo || 'IN'] || 'IN';
}

export function convertPrice(inrAmount: number, currencyCode: string): number {
  const config = CURRENCIES[currencyCode];
  if (!config) return inrAmount;
  return Math.round(inrAmount * config.rate);
}

export function formatPrice(amount: number, currencyCode: string): string {
  const config = CURRENCIES[currencyCode];
  if (!config) return `₹${amount}`;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPricingForCountry(countryCode: string) {
  const currency = CURRENCIES[countryCode] || CURRENCIES.IN;
  const result: Record<string, { inr: number; converted: number; display: string; currency: string }> = {};

  for (const [tier, inr] of Object.entries(PRICE_IN_INR)) {
    const converted = convertPrice(inr, currency.code);
    result[tier] = {
      inr,
      converted,
      display: formatPrice(converted, currency.code),
      currency: currency.code,
    };
  }

  return {
    country: countryCode,
    currency,
    tiers: result,
  };
}

export function detectCurrency(): string {
  if (typeof window === 'undefined') return 'IN';

  const stored = localStorage.getItem('user_currency');
  if (stored && CURRENCIES[stored]) return stored;

  return 'IN';
}

export function setCurrency(countryCode: string) {
  if (CURRENCIES[countryCode]) {
    localStorage.setItem('user_currency', countryCode);
  }
}