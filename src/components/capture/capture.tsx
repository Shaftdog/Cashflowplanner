'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ExpenseChat from './expense-chat';
import ExtractedExpenses from './extracted-expenses';
import FileUpload from './file-upload';
import { extractExpenses, ExtractExpensesOutput } from '@/ai/flows/extract-expenses';
import type { PaymentItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


interface CaptureProps {
    onAddItems: (items: Omit<PaymentItem, 'id' | 'createdAt'>[]) => void;
}

export default function Capture({ onAddItems }: CaptureProps) {
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractExpensesOutput['expenses']>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleTextSubmit = async (text: string) => {
    setIsExtracting(true);
    try {
      console.log('[DEBUG] Sending to API:', { text: text.substring(0, 100) + '...' });
      const result = await extractExpenses({ text });
      console.log('[DEBUG] API Response:', result);
      console.log('[DEBUG] Tasks extracted:', result.expenses.length);
      setExtractedExpenses(prev => [...prev, ...result.expenses]);
    } catch (error) {
      console.error('Failed to extract expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract expenses from text.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileProcess = async (text: string, imageDataUrl?: string) => {
    setIsExtracting(true);
    try {
      console.log('[DEBUG handleFileProcess] Processing file:', { 
        text: text.substring(0, 100), 
        hasImage: !!imageDataUrl,
        imageLength: imageDataUrl?.length 
      });
      const result = await extractExpenses({ text, imageDataUrl });
      console.log('[DEBUG handleFileProcess] API Response:', result);
      console.log('[DEBUG handleFileProcess] Tasks extracted:', result.expenses.length);
      setExtractedExpenses(prev => [...prev, ...result.expenses]);
      
      if (result.expenses.length === 0) {
        toast({
          title: 'No Tasks Found',
          description: 'Could not extract any tasks from the uploaded file. Please try a different image or describe your expenses in the chat.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to extract expenses from file:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract expenses from file.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };
  
  const handleAddSelected = (selectedItems: typeof extractedExpenses) => {
    onAddItems(selectedItems.map(({isRecurring, id, ...item}) => ({...item, category: isRecurring ? 'Recurring' : item.category, isPaid: false})));
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.id === exp.id)));
    toast({
        title: 'Expenses Added',
        description: `${selectedItems.length} expenses have been added to your cashflow.`,
    });
  };

  const handleDiscardSelected = (selectedItems: typeof extractedExpenses) => {
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.id === exp.id)));
     toast({
        title: 'Expenses Discarded',
        description: `${selectedItems.length} extracted expenses have been discarded.`,
        variant: 'destructive'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Task Extraction</CardTitle>
          <CardDescription>Upload files or describe your tasks in natural language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload onProcessFile={handleFileProcess} />
          <ExpenseChat onSendMessage={handleTextSubmit} isSending={isExtracting} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Extracted Tasks</CardTitle>
           <CardDescription>{extractedExpenses.length} tasks found</CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractedExpenses
            expenses={extractedExpenses}
            onAdd={handleAddSelected}
            onDiscard={handleDiscardSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
