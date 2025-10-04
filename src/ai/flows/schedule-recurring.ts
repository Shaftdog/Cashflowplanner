'use server';

/**
 * @fileOverview This file defines a Genkit flow to automatically schedule recurring expenses
 * to the appropriate week categories in the cashflow board.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { CATEGORY_NAMES, PRIORITIES } from '@/lib/constants';

const RecurringExpenseSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  dayOfMonth: z.number(),
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
  prompt: `You are an AI assistant helping to schedule recurring expenses into a cashflow planning board.\n\nThe user has the following recurring expenses that need to be scheduled:\n{{#each recurringExpenses}}\n{{#if isActive}}\n- Description: {{description}}, Amount: {{amount}}, Day of Month: {{dayOfMonth}}, Priority: {{priority}}{{#if notes}}, Notes: {{notes}}{{/if}}\n{{/if}}\n{{/each}}\n\nCurrent Date: {{currentDate}}\nTarget Month: {{#if targetMonth}}{{targetMonth}}{{else}}Current Month{{/if}}\n\nThe cashflow board has the following week categories:\n- Week 1: For days 1-7 of the month\n- Week 2: For days 8-14 of the month\n- Week 3: For days 15-21 of the month\n- Week 4: For days 22-28 of the month\n- Week 5: For days 29-31 of the month\n\nYour task:\n1. For each ACTIVE recurring expense, create a payment item\n2. Calculate the actual due date based on the day of month and target month\n3. Assign each payment to the appropriate week category based on which day of the month it falls on\n4. Preserve the description, amount, priority, and notes from the recurring expense\n5. Add a note mentioning this was auto-scheduled from recurring expenses\n\nReturn the scheduled payments as JSON in the following format:\n{\n  "scheduledPayments": [\n    {\n      "description": string,\n      "amount": number,\n      "dueDate": "YYYY-MM-DD" (ISO date string),\n      "category": "Week 1" | "Week 2" | "Week 3" | "Week 4" | "Week 5",\n      "priority": "low" | "medium" | "high" | "critical",\n      "notes": string (include original notes + mention it's from recurring)\n    }\n  ],\n  "summary": "Brief summary of how many expenses were scheduled and to which weeks"\n}\n\nImportant:\n- Only schedule ACTIVE recurring expenses (isActive: true)\n- If a day of month doesn't exist in the target month (e.g., day 31 in February), use the last day of that month\n- Make sure the dueDate is a valid ISO date string for the target month`,
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

