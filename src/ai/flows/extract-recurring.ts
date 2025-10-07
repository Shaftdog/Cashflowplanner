'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract recurring expenses from natural language text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PRIORITIES, FREQUENCIES } from '@/lib/constants';

const FrequencyConfigSchema = z.object({
  daysOfWeek: z.array(z.number()).optional().describe('Array of day indices (0=Sunday, 6=Saturday) for weekly/biweekly frequencies.'),
  dayOfMonth: z.number().min(1).max(31).optional().describe('Day of month (1-31) for monthly/quarterly/annually frequencies.'),
  month: z.number().min(1).max(12).optional().describe('Month (1-12) for quarterly/annually frequencies.'),
});

const RecurringExpenseItemSchema = z.object({
  id: z.string().optional().describe('Unique identifier for the extracted recurring expense.'),
  description: z.string().describe('The description of the recurring expense.'),
  amount: z.number().describe('The amount of the recurring expense. Always positive.'),
  type: z.enum(['expense', 'revenue']).describe('The type: expense for money going out, revenue for recurring income.'),
  frequency: z.enum(FREQUENCIES).describe('How often the expense recurs: weekly, biweekly, monthly, quarterly, or annually.'),
  frequencyConfig: FrequencyConfigSchema.describe('Configuration specific to the frequency type.'),
  dayOfMonth: z.number().min(1).max(31).optional().describe('Legacy field for backward compatibility.'),
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
  - Amount: The recurring payment amount (always positive)
  - Type: 'expense' for recurring bills/costs, 'revenue' for recurring income/sales (default to 'expense')
  - Frequency: Determine from keywords:
    * "weekly", "every week", "per week" → weekly
    * "bi-weekly", "biweekly", "every two weeks", "every other week" → biweekly
    * "monthly", "every month", "per month", "each month" → monthly
    * "quarterly", "every quarter", "every 3 months" → quarterly
    * "annually", "yearly", "annual", "per year", "each year" → annually
    * Default to "monthly" if not specified
  - Frequency Config: Based on the frequency:
    * Weekly/Biweekly: Extract daysOfWeek as array (0=Sunday, 1=Monday, ..., 6=Saturday)
      Example: "every Monday and Wednesday" → daysOfWeek: [1, 3]
    * Monthly: Extract dayOfMonth (1-31)
      Example: "15th of each month" → dayOfMonth: 15
    * Quarterly/Annually: Extract both dayOfMonth and month (1-12)
      Example: "March 15 each year" → dayOfMonth: 15, month: 3
  - Priority: Infer from language ('critical' for essential/urgent, 'high' for important, 'medium' for normal, 'low' for flexible)
  - Notes: Any additional context
  - Is Active: Default to true unless explicitly mentioned as inactive/paused

  Examples:
  - "Rent is $1500 due on the 1st of each month" → frequency: "monthly", frequencyConfig: {dayOfMonth: 1}
  - "Gym membership $50 weekly every Monday" → frequency: "weekly", frequencyConfig: {daysOfWeek: [1]}
  - "Trash pickup $30 bi-weekly on Tuesdays" → frequency: "biweekly", frequencyConfig: {daysOfWeek: [2]}
  - "Car insurance $600 every 6 months in January and July" → frequency: "annually", frequencyConfig: {dayOfMonth: 1, month: 1} (create two separate entries)
  - "Therapy sessions $120 every Thursday" → frequency: "weekly", frequencyConfig: {daysOfWeek: [4]}

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
- Amount (always positive)
- Type: 'expense' for recurring bills/costs, 'revenue' for recurring income (default to 'expense')
- Frequency: Identify if it's weekly, biweekly, monthly, quarterly, or annually
- Frequency Config: Based on frequency type:
  * Weekly/Biweekly: Days of week (0=Sunday through 6=Saturday)
  * Monthly: Day of month (1-31)
  * Quarterly/Annually: Day of month and month (1-12)
- Priority: 'critical' for essential services, 'high' for important, 'medium' for normal, 'low' for optional/flexible
- Whether it's active (default to true)
- Any additional notes

Important: Only extract expenses that recur on a regular basis. Skip one-time payments.

If the image contains text, also consider: ${input.text}

Return the data as a JSON object with an expenses array following the schema.`;

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
    
    // Add unique IDs, ensure amounts are positive, and set defaults
    if (result && result.expenses) {
      result.expenses = result.expenses.map(expense => ({
        ...expense,
        id: expense.id || crypto.randomUUID(),
        amount: Math.abs(expense.amount),
        type: expense.type || 'expense',
        isActive: expense.isActive ?? true, // Default to active if not specified
      }));
    }
    
    console.log('[DEBUG extractRecurringFlow] Final result:', { expenseCount: result?.expenses?.length || 0 });
    return result || { expenses: [] };
  }
);

