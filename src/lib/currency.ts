/**
 * Currency utilities for edunexus system
 * Supports MWK (Malawian Kwacha) and USD currencies
 */

export type Currency = 'MWK' | 'USD';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * Currency configurations for Malawi-based system
 */
export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  MWK: {
    code: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    locale: 'en-MW'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  }
};

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number | string,
  currency: Currency = 'MWK',
  options: Intl.NumberFormatOptions = {}
): string {
  const config = CURRENCY_CONFIGS[currency];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${config.symbol}0.00`;
  }

  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    });

    return formatter.format(numAmount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${config.symbol}${numAmount.toFixed(2)}`;
  }
}

/**
 * Format currency amount without currency symbol (for input fields)
 */
export function formatCurrencyValue(
  amount: number | string,
  currency: Currency = 'MWK'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  const config = CURRENCY_CONFIGS[currency];

  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(numAmount);
  } catch (error) {
    return numAmount.toFixed(2);
  }
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(value: string, currency: Currency = 'MWK'): number {
  if (!value) return 0;

  // Remove currency symbols and commas
  const config = CURRENCY_CONFIGS[currency];
  const cleanValue = value
    .replace(config.symbol, '')
    .replace(/,/g, '')
    .trim();

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'MWK'): string {
  return CURRENCY_CONFIGS[currency].symbol;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency = 'MWK'): string {
  return CURRENCY_CONFIGS[currency].name;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is Currency {
  return currency === 'MWK' || currency === 'USD';
}

/**
 * Get default currency for Malawi
 */
export function getDefaultCurrency(): Currency {
  return 'MWK';
}

/**
 * Convert between currencies (basic implementation)
 * Note: In production, this should use real exchange rates from an API
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate?: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Default exchange rate MWK to USD (this should be fetched from an API in production)
  const defaultRate = 0.0013; // 1 MWK = 0.0013 USD (approximate)
  const rate = exchangeRate || (fromCurrency === 'MWK' && toCurrency === 'USD' ? defaultRate :
                fromCurrency === 'USD' && toCurrency === 'MWK' ? 1 / defaultRate : 1);

  return amount * rate;
}