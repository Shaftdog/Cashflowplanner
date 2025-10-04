'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract recurring expenses from natural language text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PRIORITIES } from '@/lib/constants';

const RecurringExpenseItemSchema = z.object({
  id: z.string().optional().describe('Unique identifier for the extracted recurring expense.'),
  description: z.string().describe('The description of the recurring expense.'),
  amount: z.number().describe('The amount of the recurring expense.'),
  dayOfMonth: z.number().min(1).max(31).describe('The day of the month when this expense is due (1-31).'),
  priority: z.enum(PRIORITIES).describe('The priority of the expense.'),
  notes: z.string().optional().describe('Any notes for the expense.'),
  isActive: z.boolean().describe('Whether the recurring expense is active.'),
});

const ExtractRecurringInputSchema = z.object({
  text: z.string().describe('The user input text describing recurring expenses.'),
  imageDataUrl: z.string().optional().describe('Base64 encoded image data URL for image-based extraction.'),
});

export type ExtractRecurringInput = z.infer<typeof ExtractRecurringInputSchema>;

const ExtractRecurringOutputSchema = z.object({
  expenses: z.array(RecurringExpenseItemSchema).describe('List of extracted recurring expense items.'),
});
export type ExtractRecurringOutput = z.infer<typeof ExtractRecurringOutputSchema>;

export async function extractRecurringExpenses(input: ExtractRecurringInput): Promise<ExtractRecurringOutput> {
  return extractRecurringFlow(input);
}

const extractRecurringPrompt = ai.definePrompt({
  name: 'extractRecurringPrompt',
  model: 'googleai/gemini-2.0-flash-exp',
  input: {
    schema: ExtractRecurringInputSchema,
  },
  output: {
    schema: ExtractRecurringOutputSchema,
  },
  prompt: `You are an expert at extracting structured recurring expense data from natural language text.
  Analyze the following text and extract all RECURRING expenses. Today's date is ${new Date().toDateString()}.

  Important: Only extract expenses that are RECURRING (monthly, weekly, yearly, etc.). Do not extract one-time expenses.

  For each recurring expense, determine:
  - Description: What the expense is for
  - Amount: The recurring payment amount
  - Day of Month: Which day of the month the expense is due (1-31). If a day is mentioned like "15th", use 15. If "beginning of month", use 1. If "end of month", use 28. If not specified, use 1.
  - Priority: Infer from language ('critical' for essential/urgent, 'high' for important, 'medium' for normal, 'low' for flexible)
  - Notes: Any additional context
  - Is Active: Default to true unless explicitly mentioned as inactive/paused

  Examples of recurring expenses:
  - "Rent is $1500 due on the 1st of each month"
  - "Netflix subscription $15.99 monthly on the 20th"
  - "Car payment of $400 every month on the 15th"
  - "Utilities average $150, usually charged around the 10th"

  Text to analyze:
  "{{text}}"

  Return the extracted recurring expenses as a JSON object. If no recurring expenses are found, return an empty array.
  `,
});

const extractRecurringFlow = ai.defineFlow(
  {
    name: 'extractRecurringFlow',
    inputSchema: ExtractRecurringInputSchema,
    outputSchema: ExtractRecurringOutputSchema,
  },
  async (input) => {
    console.log('[DEBUG extractRecurringFlow] Input received:', { 
      hasText: !!input.text, 
      textLength: input.text?.length,
      hasImage: !!input.imageDataUrl,
      imageUrlPrefix: input.imageDataUrl?.substring(0, 50)
    });
    
    let result;
    if (input.imageDataUrl) {
      // Use Gemini's vision capabilities for image input
      console.log('[DEBUG] Processing image with Gemini vision for recurring expenses');
      const imagePrompt = `Analyze this image and extract all RECURRING financial information such as subscription bills, monthly invoices, or recurring payment schedules. Today's date is ${new Date().toDateString()}.
      
Extract only RECURRING expenses with the following details:
- Description of each recurring payment/expense
- Amount
- Day of month when it's due (1-31)
- Priority: 'critical' for essential services, 'high' for important, 'medium' for normal, 'low' for optional/flexible
- Whether it's active (default to true)
- Any additional notes

Important: Only extract expenses that recur on a regular basis (monthly, yearly, etc.). Skip one-time payments.

If the image contains text, also consider: ${input.text}

Return the data as a JSON object with an expenses array.`;

      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: [
          { text: imagePrompt },
          { media: { url: input.imageDataUrl } }
        ],
        output: {
          schema: ExtractRecurringOutputSchema,
        },
      });
      
      result = response.output;
      console.log('[DEBUG] Gemini vision response for recurring:', result);
    } else {
      // Use text-based extraction
      const promptResult = await extractRecurringPrompt(input);
      result = promptResult.output;
    }
    
    // Add unique IDs to extracted expenses if not present
    if (result && result.expenses) {
      result.expenses = result.expenses.map(expense => ({
        ...expense,
        id: expense.id || crypto.randomUUID(),
        isActive: expense.isActive ?? true, // Default to active if not specified
      }));
    }
    
    console.log('[DEBUG extractRecurringFlow] Final result:', { expenseCount: result?.expenses?.length || 0 });
    return result || { expenses: [] };
  }
);

