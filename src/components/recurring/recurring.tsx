'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Sparkles } from 'lucide-react';
import type { RecurringExpense, PaymentItem } from '@/lib/types';
import RecurringDialog from '@/components/recurring/recurring-dialog';
import RecurringChat from '@/components/recurring/recurring-chat';
import RecurringFileUpload from '@/components/recurring/recurring-file-upload';
import ExtractedRecurring from '@/components/recurring/extracted-recurring';
import { extractRecurringExpenses, ExtractRecurringOutput } from '@/ai/flows/extract-recurring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRIORITY_STYLES } from '@/lib/constants';
import { formatFrequency } from '@/lib/utils-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scheduleRecurringExpenses } from '@/ai/flows/schedule-recurring';

interface RecurringProps {
  expenses: RecurringExpense[];
  addExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<RecurringExpense>) => void;
  deleteExpense: (id: string) => void;
  onScheduleToCashflow?: (items: Omit<PaymentItem, 'id' | 'createdAt'>[]) => void;
}

export default function Recurring({
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
  onScheduleToCashflow,
}: RecurringProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractRecurringOutput['expenses']>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSave = (expense: RecurringExpense) => {
    if (expense.id) {
      updateExpense(expense.id, expense);
    } else {
      addExpense(expense);
    }
  };

  const handleTextSubmit = async (text: string) => {
    setIsExtracting(true);
    try {
      console.log('[DEBUG] Extracting recurring expenses from text:', { text: text.substring(0, 100) + '...' });
      const result = await extractRecurringExpenses({ text });
      console.log('[DEBUG] API Response:', result);
      console.log('[DEBUG] Recurring expenses extracted:', result.expenses.length);
      setExtractedExpenses(prev => [...prev, ...result.expenses]);
      
      if (result.expenses.length === 0) {
        toast({
          title: 'No Recurring Expenses Found',
          description: 'Could not find any recurring expenses in your text. Make sure to mention recurring patterns like "monthly" or "every month".',
        });
      }
    } catch (error) {
      console.error('Failed to extract recurring expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract recurring expenses from text.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileProcess = async (text: string, imageDataUrl?: string) => {
    setIsExtracting(true);
    try {
      console.log('[DEBUG handleFileProcess] Processing file for recurring expenses:', { 
        text: text.substring(0, 100), 
        hasImage: !!imageDataUrl,
        imageLength: imageDataUrl?.length 
      });
      const result = await extractRecurringExpenses({ text, imageDataUrl });
      console.log('[DEBUG handleFileProcess] API Response:', result);
      console.log('[DEBUG handleFileProcess] Recurring expenses extracted:', result.expenses.length);
      setExtractedExpenses(prev => [...prev, ...result.expenses]);
      
      if (result.expenses.length === 0) {
        toast({
          title: 'No Recurring Expenses Found',
          description: 'Could not extract any recurring expenses from the uploaded file. Please try a different image or describe your recurring bills in the chat.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to extract recurring expenses from file:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract recurring expenses from file.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddExtracted = (selectedItems: typeof extractedExpenses) => {
    selectedItems.forEach(({ id, ...item }) => {
      addExpense(item);
    });
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.id === exp.id)));
    toast({
      title: 'Recurring Expenses Added',
      description: `${selectedItems.length} recurring expense${selectedItems.length !== 1 ? 's' : ''} have been added.`,
    });
  };

  const handleDiscardExtracted = (selectedItems: typeof extractedExpenses) => {
    setExtractedExpenses(prev => prev.filter(exp => !selectedItems.some(item => item.id === exp.id)));
    toast({
      title: 'Expenses Discarded',
      description: `${selectedItems.length} extracted expense${selectedItems.length !== 1 ? 's' : ''} have been discarded.`,
      variant: 'destructive'
    });
  };

  const handleScheduleToCashflow = async () => {
    if (!onScheduleToCashflow) {
      toast({
        title: 'Feature Not Available',
        description: 'Scheduling function is not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsScheduling(true);
    try {
      const result = await scheduleRecurringExpenses({
        recurringExpenses: expenses,
        currentDate: new Date().toISOString(),
      });

      // Convert scheduled payments to payment items
      const paymentItems = result.scheduledPayments.map(payment => ({
        description: payment.description,
        amount: payment.amount,
        type: payment.type,
        dueDate: payment.dueDate,
        category: payment.category,
        priority: payment.priority,
        notes: payment.notes,
      }));

      // Add all items to cashflow
      onScheduleToCashflow(paymentItems);

      toast({
        title: 'Expenses Scheduled! ✨',
        description: result.summary,
      });
    } catch (error) {
      console.error('Failed to schedule recurring expenses', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Could not schedule recurring expenses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const totalMonthly = expenses
    .filter(e => e.isActive)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      <header className="mb-6 mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recurring Expenses</h1>
          <p className="text-muted-foreground">
            Manage your recurring expenses and track payment schedules.
          </p>
        </div>
        <div className="flex gap-2">
          {expenses.filter(e => e.isActive).length > 0 && onScheduleToCashflow && (
            <Button 
              onClick={handleScheduleToCashflow} 
              disabled={isScheduling}
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isScheduling ? 'Scheduling...' : 'AI Schedule to Cashflow'}
            </Button>
          )}
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2" />
            Add Recurring Expense
          </Button>
        </div>
      </header>

      {/* AI Extraction Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Recurring Expense Extraction</CardTitle>
            <CardDescription>Upload files or describe your recurring bills in natural language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RecurringFileUpload onProcessFile={handleFileProcess} />
            <RecurringChat onSendMessage={handleTextSubmit} isSending={isExtracting} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Extracted Recurring Expenses</CardTitle>
            <CardDescription>{extractedExpenses.length} expense{extractedExpenses.length !== 1 ? 's' : ''} found</CardDescription>
          </CardHeader>
          <CardContent>
            <ExtractedRecurring
              expenses={extractedExpenses}
              onAdd={handleAddExtracted}
              onDiscard={handleDiscardExtracted}
            />
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
          <CardDescription>Total active recurring expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${totalMonthly.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {expenses.filter(e => e.isActive).length} active expense
            {expenses.filter(e => e.isActive).length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map(expense => (
          <Card key={expense.id} className={!expense.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{expense.description}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatFrequency(expense)}
                    </div>
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(expense)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteExpense(expense.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">${expense.amount.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={PRIORITY_STYLES[expense.priority]}>
                    {expense.priority}
                  </Badge>
                  {!expense.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                {expense.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {expense.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring expenses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first recurring expense to get started tracking monthly payments.
            </p>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Expense
            </Button>
          </CardContent>
        </Card>
      )}

      <RecurringDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        expense={editingExpense}
      />
    </div>
  );
}

