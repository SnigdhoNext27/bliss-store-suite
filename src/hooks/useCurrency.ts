import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to BDT
}

// Default rates (fallback if API fails)
const defaultCurrencies: Currency[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.0091 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.0084 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0072 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 0.76 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.033 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 0.034 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.014 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 144.5 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 0.31 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 227.5 },
];

interface CurrencyStore {
  selectedCurrency: Currency;
  currencies: Currency[];
  lastUpdated: string | null;
  setCurrency: (code: string) => void;
  updateRates: (rates: Record<string, number>) => void;
  convert: (amount: number) => number;
  format: (amount: number) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: defaultCurrencies[0],
      currencies: defaultCurrencies,
      lastUpdated: null,

      setCurrency: (code: string) => {
        const { currencies } = get();
        const currency = currencies.find(c => c.code === code);
        if (currency) {
          set({ selectedCurrency: currency });
        }
      },

      updateRates: (rates: Record<string, number>) => {
        const { currencies, selectedCurrency } = get();
        // BDT rate from the API (we need to convert all rates relative to BDT)
        const bdtRate = rates['BDT'] || 1;
        
        const updatedCurrencies = currencies.map(currency => {
          if (currency.code === 'BDT') return { ...currency, rate: 1 };
          const apiRate = rates[currency.code];
          if (apiRate) {
            // Convert rate relative to BDT
            return { ...currency, rate: apiRate / bdtRate };
          }
          return currency;
        });

        // Update selected currency with new rate
        const updatedSelected = updatedCurrencies.find(c => c.code === selectedCurrency.code) || selectedCurrency;

        set({ 
          currencies: updatedCurrencies, 
          selectedCurrency: updatedSelected,
          lastUpdated: new Date().toISOString()
        });
      },

      convert: (amount: number) => {
        const { selectedCurrency } = get();
        return Math.round(amount * selectedCurrency.rate * 100) / 100;
      },

      format: (amount: number) => {
        const { selectedCurrency, convert } = get();
        const converted = convert(amount);
        
        // For currencies with high values like IDR and VND, don't show decimals
        const noDecimalCurrencies = ['BDT', 'IDR', 'VND', 'INR'];
        const minFractionDigits = noDecimalCurrencies.includes(selectedCurrency.code) ? 0 : 2;
        const maxFractionDigits = noDecimalCurrencies.includes(selectedCurrency.code) ? 0 : 2;
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: selectedCurrency.code,
          minimumFractionDigits: minFractionDigits,
          maximumFractionDigits: maxFractionDigits,
        }).format(converted);
      },
    }),
    {
      name: 'almans-currency',
    }
  )
);

// Fetch live exchange rates from a free API
const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    // Using exchangerate-api.com free tier (no API key needed for basic usage)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

// Hook that combines store with live rate updates
export const useCurrency = () => {
  const store = useCurrencyStore();
  
  // Fetch rates on mount and cache for 24 hours
  const { data: rates } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: fetchExchangeRates,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Update store when rates are fetched
  useEffect(() => {
    if (rates) {
      store.updateRates(rates);
    }
  }, [rates]);

  return {
    selectedCurrency: store.selectedCurrency,
    currencies: store.currencies,
    lastUpdated: store.lastUpdated,
    setCurrency: store.setCurrency,
    convert: store.convert,
    format: store.format,
  };
};
