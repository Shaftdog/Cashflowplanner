/**
 * Utility helper functions for date and currency formatting
 */

import type { RecurringExpense } from './types';
import { DAYS_OF_WEEK, MONTHS } from './constants';

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

/**
 * Converts a day index to day name
 * @param dayIndex Day index (0=Sunday, 6=Saturday)
 * @returns Day name
 */
export const getDayOfWeekName = (dayIndex: number): string => {
  return DAYS_OF_WEEK[dayIndex] || '';
};

/**
 * Formats a recurring expense's frequency into a human-readable string
 * @param expense The recurring expense
 * @returns Formatted frequency string
 */
export const formatFrequency = (expense: RecurringExpense): string => {
  const { frequency, frequencyConfig } = expense;

  switch (frequency) {
    case 'weekly':
      if (frequencyConfig.daysOfWeek && frequencyConfig.daysOfWeek.length > 0) {
        const dayNames = frequencyConfig.daysOfWeek
          .sort((a, b) => a - b)
          .map(day => getDayOfWeekName(day));
        if (dayNames.length === 7) {
          return 'Every day';
        } else if (dayNames.length === 1) {
          return `Every ${dayNames[0]}`;
        } else {
          return `Every ${dayNames.join(', ')}`;
        }
      }
      return 'Weekly';

    case 'biweekly':
      if (frequencyConfig.daysOfWeek && frequencyConfig.daysOfWeek.length > 0) {
        const dayNames = frequencyConfig.daysOfWeek
          .sort((a, b) => a - b)
          .map(day => getDayOfWeekName(day));
        if (dayNames.length === 1) {
          return `Every other ${dayNames[0]}`;
        } else {
          return `Bi-weekly on ${dayNames.join(', ')}`;
        }
      }
      return 'Bi-weekly';

    case 'monthly':
      if (frequencyConfig.dayOfMonth) {
        return `Day ${frequencyConfig.dayOfMonth} each month`;
      }
      return 'Monthly';

    case 'quarterly':
      if (frequencyConfig.dayOfMonth && frequencyConfig.month) {
        return `Day ${frequencyConfig.dayOfMonth}, ${MONTHS[frequencyConfig.month - 1]} (quarterly)`;
      }
      return 'Quarterly';

    case 'annually':
      if (frequencyConfig.dayOfMonth && frequencyConfig.month) {
        return `${MONTHS[frequencyConfig.month - 1]} ${frequencyConfig.dayOfMonth} each year`;
      }
      return 'Annually';

    default:
      return 'Unknown frequency';
  }
};

/**
 * Calculate all occurrence dates for a recurring expense within a date range
 * @param expense The recurring expense
 * @param startDate Start of the date range
 * @param endDate End of the date range
 * @returns Array of dates when this expense occurs
 */
export const getNextOccurrences = (
  expense: RecurringExpense,
  startDate: Date,
  endDate: Date
): Date[] => {
  const occurrences: Date[] = [];
  const { frequency, frequencyConfig } = expense;

  switch (frequency) {
    case 'weekly': {
      if (!frequencyConfig.daysOfWeek || frequencyConfig.daysOfWeek.length === 0) {
        break;
      }
      
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (frequencyConfig.daysOfWeek.includes(dayOfWeek)) {
          occurrences.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case 'biweekly': {
      if (!frequencyConfig.daysOfWeek || frequencyConfig.daysOfWeek.length === 0) {
        break;
      }

      // For bi-weekly, we need a reference date. Use the start date's week.
      const current = new Date(startDate);
      let weekCount = 0;
      
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        
        // Only add if it's an even week (0, 2, 4...) and matches day of week
        if (weekCount % 2 === 0 && frequencyConfig.daysOfWeek.includes(dayOfWeek)) {
          occurrences.push(new Date(current));
        }
        
        // Move to next day
        current.setDate(current.getDate() + 1);
        
        // Increment week counter on Sundays
        if (dayOfWeek === 6) { // Saturday to Sunday transition
          weekCount++;
        }
      }
      break;
    }

    case 'monthly': {
      if (!frequencyConfig.dayOfMonth) {
        break;
      }

      const current = new Date(startDate);
      current.setDate(1); // Start from first of month
      
      while (current <= endDate) {
        // Get the last day of this month
        const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(frequencyConfig.dayOfMonth, lastDayOfMonth);
        
        const occurrenceDate = new Date(current.getFullYear(), current.getMonth(), targetDay);
        
        if (occurrenceDate >= startDate && occurrenceDate <= endDate) {
          occurrences.push(occurrenceDate);
        }
        
        // Move to next month
        current.setMonth(current.getMonth() + 1);
      }
      break;
    }

    case 'quarterly': {
      if (!frequencyConfig.dayOfMonth || frequencyConfig.month === undefined) {
        break;
      }

      // Quarterly means every 3 months starting from the specified month
      const targetMonth = (frequencyConfig.month - 1) % 12;
      const current = new Date(startDate);
      current.setMonth(0); // Start from January
      
      for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        for (let quarter = 0; quarter < 4; quarter++) {
          const month = (targetMonth + quarter * 3) % 12;
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const targetDay = Math.min(frequencyConfig.dayOfMonth, lastDayOfMonth);
          
          const occurrenceDate = new Date(year, month, targetDay);
          
          if (occurrenceDate >= startDate && occurrenceDate <= endDate) {
            occurrences.push(occurrenceDate);
          }
        }
      }
      break;
    }

    case 'annually': {
      if (!frequencyConfig.dayOfMonth || frequencyConfig.month === undefined) {
        break;
      }

      const targetMonth = frequencyConfig.month - 1;
      
      for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        const lastDayOfMonth = new Date(year, targetMonth + 1, 0).getDate();
        const targetDay = Math.min(frequencyConfig.dayOfMonth, lastDayOfMonth);
        
        const occurrenceDate = new Date(year, targetMonth, targetDay);
        
        if (occurrenceDate >= startDate && occurrenceDate <= endDate) {
          occurrences.push(occurrenceDate);
        }
      }
      break;
    }
  }

  return occurrences.sort((a, b) => a.getTime() - b.getTime());
};
