'use server';

/**
 * @fileOverview This file defines a Genkit flow to automatically schedule recurring expenses
 * to the appropriate week categories in the cashflow board.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { CATEGORY_NAMES, PRIORITIES, FREQUENCIES } from '@/lib/constants';

const FrequencyConfigSchema = z.object({
  daysOfWeek: z.array(z.number()).optional(),
  dayOfMonth: z.number().optional(),
  month: z.number().optional(),
});

const RecurringExpenseSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  frequency: z.enum(FREQUENCIES),
  frequencyConfig: FrequencyConfigSchema,
  dayOfMonth: z.number().optional(),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

const ScheduleRecurringInputSchema = z.object({
  recurringExpenses: z.array(RecurringExpenseSchema).describe('List of recurring expenses to schedule.'),
  currentDate: z.string().describe('Current date in ISO format to determine which month to schedule.'),
  targetMonth: z.string().optional().describe('Optional target month (YYYY-MM) to schedule expenses for. Defaults to current month.'),
});
export type ScheduleRecurringInput = z.infer<typeof ScheduleRecurringInputSchema>;

const ScheduledPaymentSchema = z.object({
  description: z.string(),
  amount: z.number(),
  dueDate: z.string().describe('ISO date string for when this payment is due'),
  category: z.enum(CATEGORY_NAMES),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
});

const ScheduleRecurringOutputSchema = z.object({
  scheduledPayments: z.array(ScheduledPaymentSchema).describe('List of payment items created from recurring expenses, assigned to appropriate week categories.'),
  summary: z.string().describe('A brief summary of the scheduling operation.'),
});
export type ScheduleRecurringOutput = z.infer<typeof ScheduleRecurringOutputSchema>;

export async function scheduleRecurringExpenses(input: ScheduleRecurringInput): Promise<ScheduleRecurringOutput> {
  return scheduleRecurringFlow(input);
}

const scheduleRecurringPrompt = ai.definePrompt({
  name: 'scheduleRecurringPrompt',
  model: 'googleai/gemini-2.0-flash-exp',
  input: {
    schema: ScheduleRecurringInputSchema,
  },
  output: {
    schema: ScheduleRecurringOutputSchema,
  },
  prompt: `You are an AI assistant helping to schedule recurring expenses into a cashflow planning board.

The user has the following recurring expenses that need to be scheduled:
{{#each recurringExpenses}}
{{#if isActive}}
- Description: {{description}}, Amount: {{amount}}, Frequency: {{frequency}}, Priority: {{priority}}{{#if notes}}, Notes: {{notes}}{{/if}}
  {{#if frequencyConfig.daysOfWeek}}Days of Week: {{frequencyConfig.daysOfWeek}}{{/if}}
  {{#if frequencyConfig.dayOfMonth}}Day of Month: {{frequencyConfig.dayOfMonth}}{{/if}}
  {{#if frequencyConfig.month}}Month: {{frequencyConfig.month}}{{/if}}
{{/if}}
{{/each}}

Current Date: {{currentDate}}
Target Month: {{#if targetMonth}}{{targetMonth}}{{else}}Current Month{{/if}}

The cashflow board has the following week categories:
- Week 1: For days 1-7 of the month
- Week 2: For days 8-14 of the month
- Week 3: For days 15-21 of the month
- Week 4: For days 22-28 of the month
- Week 5: For days 29-31 of the month

FREQUENCY TYPES AND SCHEDULING RULES:

1. WEEKLY: Create a payment for each occurrence on the specified days of week within the target month
   - frequencyConfig.daysOfWeek contains array of days (0=Sunday, 1=Monday, ..., 6=Saturday)
   - Example: If daysOfWeek=[1,3] (Mon, Wed), create a payment for each Monday and Wednesday in the month
   
2. BIWEEKLY: Create a payment every 2 weeks on the specified days of week
   - Similar to weekly but only on alternating weeks
   - Use the first week of the month as reference, then skip every other week
   
3. MONTHLY: Create ONE payment for the specified day of the month
   - frequencyConfig.dayOfMonth specifies which day (1-31)
   - If day doesn't exist in month (e.g., 31 in Feb), use last day of month
   
4. QUARTERLY: Create ONE payment if the target month matches the quarter pattern
   - frequencyConfig has both dayOfMonth and month
   - Only create payment if we're in the right quarter (every 3 months from specified month)
   - Example: If month=1, create payments in Jan, Apr, Jul, Oct
   
5. ANNUALLY: Create ONE payment if the target month matches the specified month
   - Only create payment if target month matches frequencyConfig.month

YOUR TASK:
1. For each ACTIVE recurring expense, determine what payments to create based on its frequency
2. Calculate actual due dates (YYYY-MM-DD format) for each occurrence
3. Assign each payment to the appropriate Week category based on the day of month
4. Create INDEPENDENT payment items - each can be moved/modified separately later
5. Preserve description, amount, priority from the recurring expense
6. Add a note mentioning this was auto-scheduled from recurring expenses (include original notes if any)

Return the scheduled payments as JSON:
{
  "scheduledPayments": [
    {
      "description": string,
      "amount": number,
      "dueDate": "YYYY-MM-DD" (ISO date string),
      "category": "Week 1" | "Week 2" | "Week 3" | "Week 4" | "Week 5",
      "priority": "low" | "medium" | "high" | "critical",
      "notes": string (include original notes + mention it's from recurring)
    }
  ],
  "summary": "Brief summary of how many expenses were scheduled, their frequencies, and to which weeks"
}

IMPORTANT:
- Only schedule ACTIVE recurring expenses (isActive: true)
- Each payment item is independent and can be modified/moved after scheduling
- Handle edge cases (Feb 30, 31st of 30-day months, etc.)
- For weekly/biweekly, create separate payment items for each occurrence
- Make sure all dueDates are valid ISO date strings within the target month`,
});

const scheduleRecurringFlow = ai.defineFlow(
  {
    name: 'scheduleRecurringFlow',
    inputSchema: ScheduleRecurringInputSchema,
    outputSchema: ScheduleRecurringOutputSchema,
  },
  async input => {
    const {output} = await scheduleRecurringPrompt(input);
    return output!;
  }
);

