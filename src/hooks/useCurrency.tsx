import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CurrencyConfig,
  SUPPORTED_CURRENCIES,
  SupportedCurrencyCode,
  getCurrencyConfig,
  convertCurrency,
  formatCurrencyAmount,
  inferDefaultCurrency,
  getResponsibleGamblingResource,
  ResponsibleGamblingResource,
} from '@/services/currencyService';
import { useGeoRegion } from './useGeoRegion';

interface CurrencyContextType {
  currency: SupportedCurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: SupportedCurrencyCode) => void;
  allCurrencies: CurrencyConfig[];
  convert: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  format: (amount: number | string, options?: { compact?: boolean; includeCode?: boolean; customDecimals?: number }) => string;
  formatWithCurrency: (amount: number | string, currencyCode: string, options?: { compact?: boolean; includeCode?: boolean; customDecimals?: number }) => string;
  responsibleGambling: ResponsibleGamblingResource;
}

const STORAGE_KEY = 'predictpro_currency_code_v1';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { regionId } = useGeoRegion();

  const [currency, setCurrencyState] = useState<SupportedCurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
        return saved as SupportedCurrencyCode;
      }
    } catch (e) {
      console.warn('Failed to load currency from storage:', e);
    }
    return inferDefaultCurrency(regionId);
  });

  const currencyConfig = getCurrencyConfig(currency);

  const setCurrency = (code: SupportedCurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      console.warn('Failed to save currency to storage:', e);
    }
  };

  const convert = (amount: number, fromCurrency: string = 'USD', toCurrency?: string): number => {
    const target = toCurrency || currency;
    return convertCurrency(amount, fromCurrency, target);
  };

  const format = (
    amount: number | string,
    options?: { compact?: boolean; includeCode?: boolean; customDecimals?: number }
  ): string => {
    return formatCurrencyAmount(amount, currency, options);
  };

  const formatWithCurrency = (
    amount: number | string,
    currencyCode: string,
    options?: { compact?: boolean; includeCode?: boolean; customDecimals?: number }
  ): string => {
    return formatCurrencyAmount(amount, currencyCode, options);
  };

  const responsibleGambling = getResponsibleGamblingResource(currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig,
        setCurrency,
        allCurrencies: SUPPORTED_CURRENCIES,
        convert,
        format,
        formatWithCurrency,
        responsibleGambling,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
