import { CATEGORY_NAMES } from './constants';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export type ItemType = 'expense' | 'revenue';

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface FrequencyConfig {
  daysOfWeek?: number[]; // 0=Sunday, 6=Saturday (for weekly/biweekly)
  dayOfMonth?: number;   // 1-31 (for monthly/quarterly/annually)
  month?: number;        // 1-12 (for quarterly/annually)
}

export interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  type: ItemType;
  dueDate: string;
  category: CategoryName;
  priority: Priority;
  notes?: string;
  createdAt: string;
  isPaid: boolean;
  paidDate?: string;
  recurringExpenseId?: string;
}

export interface CategoryConfig {
  id: CategoryName;
  title: string;
  color: string;
  textColor: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  type: ItemType;
  frequency: Frequency;
  frequencyConfig: FrequencyConfig;
  dayOfMonth?: number; // Kept for backward compatibility
  priority: Priority;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}
