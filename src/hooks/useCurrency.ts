import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to BDT
}

const currencies: Currency[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.0091 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.0084 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0072 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 0.76 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.033 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 0.034 },
];

interface CurrencyStore {
  selectedCurrency: Currency;
  currencies: Currency[];
  setCurrency: (code: string) => void;
  convert: (amount: number) => number;
  format: (amount: number) => string;
}

export const useCurrency = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: currencies[0],
      currencies,

      setCurrency: (code: string) => {
        const currency = currencies.find(c => c.code === code);
        if (currency) {
          set({ selectedCurrency: currency });
        }
      },

      convert: (amount: number) => {
        const { selectedCurrency } = get();
        return Math.round(amount * selectedCurrency.rate * 100) / 100;
      },

      format: (amount: number) => {
        const { selectedCurrency, convert } = get();
        const converted = convert(amount);
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: selectedCurrency.code,
          minimumFractionDigits: selectedCurrency.code === 'BDT' ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(converted);
      },
    }),
    {
      name: 'almans-currency',
    }
  )
);
