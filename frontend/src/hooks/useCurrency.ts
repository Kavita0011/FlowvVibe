import { useState, useEffect } from 'react';
import { getCountryFromGeo } from '../lib/currency';

export function useGeoLocation() {
  const [country, setCountry] = useState<string>('IN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
        if (response.ok) {
          const data = await response.json();
          const countryCode = getCountryFromGeo(data.country_code || data.country);
          setCountry(countryCode);
        }
      } catch {
        setCountry('IN');
      } finally {
        setLoading(false);
      }
    };

    detectCountry();
  }, []);

  return { country, loading };
}

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('INR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user_currency');
    if (stored) {
      setCurrency(stored);
      setLoading(false);
      return;
    }

    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
        if (response.ok) {
          const data = await response.json();
          const countryCode = getCountryFromGeo(data.country_code || data.country);
          const currencyMap: Record<string, string> = {
            IN: 'INR', US: 'USD', GB: 'GBP', EU: 'EUR',
            CA: 'CAD', AU: 'AUD', SG: 'SGD', AE: 'AED',
          };
          setCurrency(currencyMap[countryCode] || 'INR');
        }
      } catch {
        setCurrency('INR');
      } finally {
        setLoading(false);
      }
    };

    detectCountry();
  }, []);

  return { currency, loading, setCurrency };
}