/**
 * Utility helper functions for date and currency formatting
 */

/**
 * Formats a number as USD currency
 * @param value The numeric value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Calculates which week of the month a date falls into
 * @param date The date to calculate
 * @returns Week number (1-5)
 */
export const getWeekOfMonth = (date: Date): number => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDay) / 7);
};

/**
 * Generates a unique ID using crypto API
 * @returns A unique identifier string
 */
export const generateId = (): string => {
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};




