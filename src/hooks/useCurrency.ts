import { useState, useEffect } from 'react';

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
  'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR',
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP',
  'SN': 'XOF', 'CI': 'XOF', 'BF': 'XOF', 'ML': 'XOF', 'NE': 'XOF', 'TG': 'XOF', 'BJ': 'XOF', 'GW': 'XOF',
  'CM': 'XAF', 'CF': 'XAF', 'TD': 'XAF', 'CG': 'XAF', 'GA': 'XAF', 'GQ': 'XAF',
  'MA': 'MAD', 'TN': 'TND', 'DZ': 'DZD',
  'NG': 'NGN', 'GH': 'GHS', 'KE': 'KES', 'ZA': 'ZAR', 'EG': 'EGP'
};

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES.EUR);
  const [baseRate, setBaseRate] = useState(1); // EUR base rate from admin

  useEffect(() => {
    // Detect user's country and set appropriate currency
    const detectCurrency = async () => {
      try {
        // Try to get country from navigator.language first
        const locale = navigator.language || 'en-US';
        const countryCode = locale.split('-')[1] || 'US';
        
        // Fallback to geolocation API or IP detection
        let detectedCountry = countryCode;
        
        try {
          // This is a simple IP-based detection (you might want to use a proper service)
          const response = await fetch('https://ipapi.co/country/');
          if (response.ok) {
            detectedCountry = await response.text();
          }
        } catch {
          // Use locale-based detection as fallback
        }

        const currencyCode = COUNTRY_CURRENCIES[detectedCountry.toUpperCase()] || 'EUR';
        setCurrency(CURRENCIES[currencyCode]);
      } catch (error) {
        console.warn('Currency detection failed, using EUR:', error);
        setCurrency(CURRENCIES.EUR);
      }
    };

    detectCurrency();
  }, []);

  const convertFromEUR = (amountInEUR: number): number => {
    return (amountInEUR * baseRate * currency.rate);
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
        ...options
      }).format(convertedAmount);
    } catch {
      // Fallback formatting
      return `${currency.symbol}${convertedAmount.toLocaleString('fr-FR')}`;
    }
  };

  return {
    currency,
    setCurrency: (currencyCode: string) => {
      if (CURRENCIES[currencyCode]) {
        setCurrency(CURRENCIES[currencyCode]);
      }
    },
    currencies: CURRENCIES,
    baseRate,
    setBaseRate,
    convertFromEUR,
    convertToEUR,
    formatAmount
  };
}