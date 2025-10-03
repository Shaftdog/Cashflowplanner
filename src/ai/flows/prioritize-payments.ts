'use server';

/**
 * @fileOverview This file defines a Genkit flow to automatically prioritize payments in the 'Current Week' category based on their urgency level.
 *
 * - prioritizePayments - A function that prioritizes payments based on urgency level.
 * - PrioritizePaymentsInput - The input type for the prioritizePayments function.
 * - PrioritizePaymentsOutput - The return type for the prioritizePayments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { CATEGORY_NAMES, PRIORITIES } from '@/lib/constants';

const PaymentItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  category: z.enum(CATEGORY_NAMES),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
  createdAt: z.string(),
});

const PrioritizePaymentsInputSchema = z.object({
  payments: z.array(PaymentItemSchema).describe('List of payments in the Current Week category.'),
  availableFunds: z.number().describe('The total available funds.'),
  savingsReserve: z.number().describe('The amount reserved for savings.'),
});
export type PrioritizePaymentsInput = z.infer<typeof PrioritizePaymentsInputSchema>;

const PrioritizePaymentsOutputSchema = z.object({
  prioritizedPayments: z.array(PaymentItemSchema).describe('List of payments prioritized by urgency level.'),
  recommendedPayments: z.array(PaymentItemSchema).describe('List of payments recommended to be paid based on available funds.'),
});
export type PrioritizePaymentsOutput = z.infer<typeof PrioritizePaymentsOutputSchema>;

export async function prioritizePayments(input: PrioritizePaymentsInput): Promise<PrioritizePaymentsOutput> {
  return prioritizePaymentsFlow(input);
}

const prioritizePaymentsPrompt = ai.definePrompt({
  name: 'prioritizePaymentsPrompt',
  model: 'googleai/gemini-2.0-flash-exp',
  input: {
    schema: PrioritizePaymentsInputSchema,
  },
  output: {
    schema: PrioritizePaymentsOutputSchema,
  },
  prompt: `You are an AI assistant helping to prioritize payments for a user's weekly cash flow analysis.\n\n  The user has the following payments in the 'Current Week' category:\n  {{#each payments}}\n  - Description: {{description}}, Amount: {{amount}}, Due Date: {{dueDate}}, Priority: {{priority}}\n  {{/each}}\n\n  The user has available funds of {{availableFunds}} and a savings reserve of {{savingsReserve}}.\n  Therefore, the available amount to pay is {{subtract availableFunds savingsReserve}}.\n\n  Based on the priority of each payment, create a prioritized list of payments, and a list of recommended payments based on the available funds.\n  Return the lists as JSON in the following format:\n  {
    "prioritizedPayments": [
      {
        "id": string,
        "description": string,
        "amount": number,
        "dueDate": string,
        "category": string,
        "priority": 'low' | 'medium' | 'high' | 'critical',
        "notes": string | null,
        "createdAt": string
      }
    ],
    "recommendedPayments": [
      {
        "id": string,
        "description": string,
        "amount": number,
        "dueDate": string,
        "category": string,
        "priority": 'low' | 'medium' | 'high' | 'critical',
        "notes": string | null,
        "createdAt": string
      }
    ]
  }`,
  config: {
    helpers: {
      subtract: (a: number, b: number) => a - b,
    },
    knownHelpersOnly: false,
  },
});

const prioritizePaymentsFlow = ai.defineFlow(
  {
    name: 'prioritizePaymentsFlow',
    inputSchema: PrioritizePaymentsInputSchema,
    outputSchema: PrioritizePaymentsOutputSchema,
  },
  async input => {
    const {output} = await prioritizePaymentsPrompt(input);
    return output!;
  }
);
