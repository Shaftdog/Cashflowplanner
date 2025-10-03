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
      const result = await extractExpenses({ text });
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

  const handleFileProcess = async (text: string) => {
    // This can be the same as handleTextSubmit or have custom logic for files
    await handleTextSubmit(text);
  };
  
  const handleAddSelected = (selectedItems: typeof extractedExpenses) => {
    onAddItems(selectedItems.map(({isRecurring, ...item}) => ({...item, category: isRecurring ? 'Recurring' : item.category})));
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.description === exp.description && item.amount === exp.amount)));
    toast({
        title: 'Expenses Added',
        description: `${selectedItems.length} expenses have been added to your cashflow.`,
    });
  };

  const handleDiscardSelected = (selectedItems: typeof extractedExpenses) => {
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.description === exp.description && item.amount === exp.amount)));
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
