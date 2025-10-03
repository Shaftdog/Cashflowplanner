import type { CategoryConfig, CategoryName, Priority } from './types';

export const CATEGORIES: CategoryConfig[] = [
  // Initial & Planning
  { id: 'Needs Work', title: 'Needs Work', color: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-600 dark:text-slate-300' },
  { id: 'Week 1', title: 'Week 1', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-300' },
  { id: 'Week 2', title: 'Week 2', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-300' },
  { id: 'Week 3', title: 'Week 3', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-300' },
  { id: 'Week 4', title: 'Week 4', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-300' },
  { id: 'Week 5', title: 'Week 5', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-300' },
  // Immediate Attention
  { id: 'Current Week', title: 'Current Week', color: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-600 dark:text-yellow-300' },
  { id: 'Next Week', title: 'Next Week', color: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-600 dark:text-green-300' },
  // Status Tracking
  { id: 'Overdue', title: 'Overdue', color: 'bg-red-100 dark:bg-red-900', textColor: 'text-red-600 dark:text-red-300' },
  { id: 'In Transit', title: 'In Transit', color: 'bg-purple-100 dark:bg-purple-900', textColor: 'text-purple-600 dark:text-purple-300' },
  { id: 'Suspected to Be Paid or Received', title: 'Suspected to Be Paid', color: 'bg-pink-100 dark:bg-pink-900', textColor: 'text-pink-600 dark:text-pink-300' },
  { id: 'Payment In Transit', title: 'Payment In Transit', color: 'bg-pink-100 dark:bg-pink-900', textColor: 'text-pink-600 dark:text-pink-300' },
  // Action
  { id: 'Action Required', title: 'Action Required', color: 'bg-orange-100 dark:bg-orange-900', textColor: 'text-orange-600 dark:text-orange-300' },
  { id: 'Processing (Tasks Assigned)', title: 'Processing', color: 'bg-cyan-100 dark:bg-cyan-900', textColor: 'text-cyan-600 dark:text-cyan-300' },
  { id: 'Recurring', title: 'Recurring', color: 'bg-teal-100 dark:bg-teal-900', textColor: 'text-teal-600 dark:text-teal-300' },
  { id: 'Backlog', title: 'Backlog', color: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-300' },
];

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  high: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};
