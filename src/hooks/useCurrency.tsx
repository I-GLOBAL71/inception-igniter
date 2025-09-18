import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Rate against EUR
  name: string;
}

const CURRENCIES: Record<string, Currency> = {
  EUR: { code: 'EUR', symbol: '€', rate: 1, name: 'Euro' },
  USD: { code: 'USD', symbol: '$', rate: 1.1, name: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.85, name: 'British Pound' },
  CAD: { code: 'CAD', symbol: 'C$', rate: 1.5, name: 'Canadian Dollar' },
  XOF: { code: 'XOF', symbol: 'FCFA', rate: 655.96, name: 'CFA Franc BCEAO' },
  XAF: { code: 'XAF', symbol: 'FCFA', rate: 655.96, name: 'CFA Franc BEAC' },
  MAD: { code: 'MAD', symbol: 'DH', rate: 10.5, name: 'Moroccan Dirham' },
  TND: { code: 'TND', symbol: 'د.ت', rate: 3.1, name: 'Tunisian Dinar' },
  DZD: { code: 'DZD', symbol: 'د.ج', rate: 135, name: 'Algerian Dinar' },
  NGN: { code: 'NGN', symbol: '₦', rate: 460, name: 'Nigerian Naira' },
  GHS: { code: 'GHS', symbol: '₵', rate: 12, name: 'Ghanaian Cedi' },
  KES: { code: 'KES', symbol: 'KSh', rate: 115, name: 'Kenyan Shilling' },
  ZAR: { code: 'ZAR', symbol: 'R', rate: 18, name: 'South African Rand' },
  EGP: { code: 'EGP', symbol: '£E', rate: 31, name: 'Egyptian Pound' },
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  // Europe
  'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR',
  'AT': 'EUR', 'PT': 'EUR', 'IE': 'EUR', 'GR': 'EUR', 'FI': 'EUR', 'LU': 'EUR',
  'SI': 'EUR', 'SK': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'MT': 'EUR', 'CY': 'EUR',
  
  // North America
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP',
  
  // West Africa (CFA Franc BCEAO - XOF)
  'SN': 'XOF', 'CI': 'XOF', 'BF': 'XOF', 'ML': 'XOF', 'NE': 'XOF', 'TG': 'XOF', 'BJ': 'XOF', 'GW': 'XOF',
  
  // Central Africa (CFA Franc BEAC - XAF)
  'CM': 'XAF', 'CF': 'XAF', 'TD': 'XAF', 'CG': 'XAF', 'GA': 'XAF', 'GQ': 'XAF',
  
  // North Africa
  'MA': 'MAD', 'TN': 'TND', 'DZ': 'DZD', 'EG': 'EGP',
  
  // Sub-Saharan Africa
  'NG': 'NGN', 'GH': 'GHS', 'KE': 'KES', 'ZA': 'ZAR',
  'UG': 'KES', 'TZ': 'KES', 'RW': 'KES', // East Africa often uses similar currencies
  'BW': 'ZAR', 'NA': 'ZAR', 'SZ': 'ZAR', 'LS': 'ZAR', // Southern Africa
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  currencies: Record<string, Currency>;
  baseRate: number;
  setBaseRate: (rate: number) => void;
  convertFromEUR: (amountInEUR: number) => number;
  convertToEUR: (amount: number) => number;
  formatAmount: (amountInEUR: number, options?: Intl.NumberFormatOptions) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES.XAF);
  const [baseRate, setBaseRate] = useState(1);

  useEffect(() => {
    const detectCurrencyByLocation = async () => {
      try {
        // First try to detect country by IP geolocation
        const response = await fetch('https://ipapi.co/country_code/', {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
          },
        });
        
        if (response.ok) {
          const countryCode = (await response.text()).trim().toUpperCase();
          
          if (countryCode && COUNTRY_CURRENCIES[countryCode]) {
            const currencyCode = COUNTRY_CURRENCIES[countryCode];
            console.log(`Country detected via IP: ${countryCode}, Currency: ${currencyCode}`);
            setCurrency(CURRENCIES[currencyCode]);
            return;
          }
        }
      } catch (error) {
        console.warn('IP-based country detection failed, falling back to locale detection:', error);
      }

      // Fallback to browser locale detection
      try {
        const locale = navigator.language || 'en-US';
        const countryCode = (locale.split('-')[1] || 'CM').toUpperCase();
        const currencyCode = COUNTRY_CURRENCIES[countryCode] || 'XAF';
        console.log(`Country detected via locale: ${countryCode}, Currency: ${currencyCode}`);
        setCurrency(CURRENCIES[currencyCode]);
      } catch (error) {
        console.warn('All currency detection methods failed, using XAF as default:', error);
        setCurrency(CURRENCIES.XAF);
      }
    };

    detectCurrencyByLocation();
  }, []);

  const handleSetCurrency = (currencyCode: string) => {
    if (CURRENCIES[currencyCode]) {
      setCurrency(CURRENCIES[currencyCode]);
    }
  };

  const convertFromEUR = (amountInEUR: number): number => {
    return amountInEUR * baseRate * currency.rate;
  };

  const convertToEUR = (amount: number): number => {
    return amount / (baseRate * currency.rate);
  };

  const formatAmount = (amountInEUR: number, options?: Intl.NumberFormatOptions): string => {
    const convertedAmount = convertFromEUR(amountInEUR);
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2,
        maximumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2,
        ...options,
      }).format(convertedAmount);
    } catch {
      return `${currency.symbol}${convertedAmount.toLocaleString('fr-FR')}`;
    }
  };

  const value = {
    currency,
    setCurrency: handleSetCurrency,
    currencies: CURRENCIES,
    baseRate,
    setBaseRate,
    convertFromEUR,
    convertToEUR,
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}