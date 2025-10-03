export type Priority = 'low' | 'medium' | 'high' | 'critical';

export const CATEGORY_NAMES = [
  'Needs Work',
  'Week 1',
  'Week 2',
  'Week 3',
  'Week 4',
  'Week 5',
  'Current Week',
  'Next Week',
  'Overdue',
  'In Transit',
  'Suspected to Be Paid or Received',
  'Payment In Transit',
  'Action Required',
  'Processing (Tasks Assigned)',
  'Backlog',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: CategoryName;
  priority: Priority;
  notes: string;
  createdAt: string;
}

export interface CategoryConfig {
  id: CategoryName;
  title: string;
  color: string;
  textColor: string;
}
