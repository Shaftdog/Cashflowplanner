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
  amount: z.number().describe('The amount of the payment. Always positive.'),
  type: z.enum(['expense', 'revenue']).describe('The type of transaction: expense for money going out, revenue for money coming in.'),
  dueDate: z.string().describe('The due date of the payment in ISO 8601 format.'),
  category: z.enum(CATEGORY_NAMES).describe('The category of the payment.'),
  priority: z.enum(PRIORITIES).describe('The priority of the payment.'),
  notes: z.string().optional().describe('Any notes for the payment.'),
  isRecurring: z.boolean().describe('Whether the payment is recurring.'),
});

const ExtractExpensesInputSchema = z.object({
  text: z.string().describe('The user input text describing expenses.'),
  imageDataUrl: z.string().optional().describe('Base64 encoded image data URL for image-based extraction.'),
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
  model: 'googleai/gemini-2.0-flash-exp',
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

  For the amount, if the user doesn't specify an amount, default to 0. IMPORTANT: Always use positive values for amounts.

  For the type, determine if this is an 'expense' (money going out) or 'revenue' (money coming in, income, sales, etc.). Default to 'expense' unless clearly stated as income or revenue.

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
    console.log('[DEBUG extractExpensesFlow] Input received:', { 
      hasText: !!input.text, 
      textLength: input.text?.length,
      hasImage: !!input.imageDataUrl,
      imageUrlPrefix: input.imageDataUrl?.substring(0, 50)
    });
    
    let result;
    if (input.imageDataUrl) {
      // Use Gemini's vision capabilities for image input
      console.log('[DEBUG] Processing image with Gemini vision');
      const imagePrompt = `Analyze this image and extract all financial information including bills, invoices, receipts, or any payment-related information. Today's date is ${new Date().toDateString()}.
      
Extract structured expense data with the following details:
- Description of each payment/expense
- Amount (default to 0 if not visible, always positive)
- Type: 'expense' for money going out, 'revenue' for money coming in (income, sales, etc.)
- Due date (use today's date if not specified)
- Category: Use 'Current Week' for bills due soon, 'Next Week' for later bills, 'Needs Work' for unclear items, 'Recurring' if it appears to be a recurring payment
- Priority: 'critical' for urgent/overdue, 'high' for important, 'medium' for normal, 'low' for flexible
- Whether it's recurring
- Any additional notes

If the image contains text, also extract: ${input.text}

Return the data as a JSON object with an expenses array.`;

      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: [
          { text: imagePrompt },
          { media: { url: input.imageDataUrl } }
        ],
        output: {
          schema: ExtractExpensesOutputSchema,
        },
      });
      
      result = response.output;
      console.log('[DEBUG] Gemini vision response:', result);
    } else {
      // Use text-based extraction
      const promptResult = await extractExpensesPrompt(input);
      result = promptResult.output;
    }
    
    // Add unique IDs and ensure amounts are positive
    if (result && result.expenses) {
      result.expenses = result.expenses.map(expense => ({
        ...expense,
        id: expense.id || crypto.randomUUID(),
        amount: Math.abs(expense.amount),
        type: expense.type || 'expense',
      }));
    }
    
    console.log('[DEBUG extractExpensesFlow] Final result:', { expenseCount: result?.expenses?.length || 0 });
    return result || { expenses: [] };
  }
);
