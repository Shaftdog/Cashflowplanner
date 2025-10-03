'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract payment items from natural language text.
 *
 * - extractExpenses - A function that extracts payment items from a user's message.
 * - ExtractExpensesInput - The input type for the extractExpenses function.
 * - ExtractExpensesOutput - The return type for the extractExpenses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CATEGORY_NAMES, PRIORITIES } from '@/lib/constants';

const PaymentItemSchema = z.object({
  id: z.string().optional().describe('Unique identifier for the extracted expense.'),
  description: z.string().describe('The description of the payment.'),
  amount: z.number().describe('The amount of the payment. Negative for income, positive for expenses.'),
  dueDate: z.string().describe('The due date of the payment in ISO 8601 format.'),
  category: z.enum(CATEGORY_NAMES).describe('The category of the payment.'),
  priority: z.enum(PRIORITIES).describe('The priority of the payment.'),
  notes: z.string().optional().describe('Any notes for the payment.'),
  isRecurring: z.boolean().describe('Whether the payment is recurring.'),
});

const ExtractExpensesInputSchema = z.object({
  text: z.string().describe('The user input text describing expenses.'),
});

export type ExtractExpensesInput = z.infer<typeof ExtractExpensesInputSchema>;

const ExtractExpensesOutputSchema = z.object({
  expenses: z.array(PaymentItemSchema).describe('List of extracted payment items.'),
});
export type ExtractExpensesOutput = z.infer<typeof ExtractExpensesOutputSchema>;


export async function extractExpenses(input: ExtractExpensesInput): Promise<ExtractExpensesOutput> {
  return extractExpensesFlow(input);
}

const extractExpensesPrompt = ai.definePrompt({
  name: 'extractExpensesPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {
    schema: ExtractExpensesInputSchema,
  },
  output: {
    schema: ExtractExpensesOutputSchema,
  },
  prompt: `You are an expert at extracting structured expense data from natural language text.
  Analyze the following text and extract all payment items. Today's date is ${new Date().toDateString()}.

  When determining the category, use your best judgment. For example, if the user mentions something is a "bill" it should likely be in 'Current Week' or 'Next Week'. If it seems like a one-off task, 'Needs Work' is appropriate. If it is recurring, use the 'Recurring' category.

  For the due date, if a specific date is mentioned, use it. If the user says "next friday", calculate the date. If no date is mentioned, use today's date.

  For the amount, if the user doesn't specify an amount, default to 0.

  For priority, infer from the user's language. If they say something is "urgent" or "important", use 'high' or 'critical'. Otherwise, 'medium' is a safe default.

  For isRecurring, set to true if the user mentions words like "monthly", "weekly", "yearly", "recurring", etc.

  Text to analyze:
  "{{text}}"

  Return the extracted expenses as a JSON object. If no expenses are found, return an empty array.
  `,
});


const extractExpensesFlow = ai.defineFlow(
  {
    name: 'extractExpensesFlow',
    inputSchema: ExtractExpensesInputSchema,
    outputSchema: ExtractExpensesOutputSchema,
  },
  async (input) => {
    const { output } = await extractExpensesPrompt(input);
    // Add unique IDs to extracted expenses if not present
    if (output && output.expenses) {
      output.expenses = output.expenses.map(expense => ({
        ...expense,
        id: expense.id || crypto.randomUUID(),
      }));
    }
    return output || { expenses: [] };
  }
);
