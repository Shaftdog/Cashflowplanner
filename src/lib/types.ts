import { CATEGORY_NAMES } from './constants';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: CategoryName;
  priority: Priority;
  notes?: string;
  createdAt: string;
}

export interface CategoryConfig {
  id: CategoryName;
  title: string;
  color: string;
  textColor: string;
}
