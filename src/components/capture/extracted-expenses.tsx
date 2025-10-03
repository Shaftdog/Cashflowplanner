'use client';

import { useState } from 'react';
import type { ExtractExpensesOutput } from '@/ai/flows/extract-expenses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

type ExtractedExpense = ExtractExpensesOutput['expenses'][0];

interface ExtractedExpensesProps {
  expenses: ExtractedExpense[];
  onAdd: (selected: ExtractedExpense[]) => void;
  onDiscard: (selected: ExtractedExpense[]) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function ExtractedExpenses({ expenses, onAdd, onDiscard }: ExtractedExpensesProps) {
  const [selected, setSelected] = useState<ExtractedExpense[]>([]);

  const handleSelect = (expense: ExtractedExpense) => {
    setSelected(prev =>
      prev.some(item => item.description === expense.description && item.amount === expense.amount)
        ? prev.filter(item => item.description !== expense.description || item.amount !== expense.amount)
        : [...prev, expense]
    );
  };
  
  const handleSelectAll = () => {
    if (selected.length === expenses.length) {
      setSelected([]);
    } else {
      setSelected(expenses);
    }
  };

  const isSelected = (expense: ExtractedExpense) => {
    return selected.some(item => item.description === expense.description && item.amount === expense.amount);
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
        <p>No tasks extracted yet</p>
        <p className="text-sm">Upload a file or describe your tasks in the chat</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selected.length === expenses.length && expenses.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={() => onAdd(selected)} disabled={selected.length === 0}>
                    <Check className="mr-2" /> Add Selected
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDiscard(selected)} disabled={selected.length === 0}>
                    <Trash2 className="mr-2" /> Discard
                </Button>
            </div>
      </div>
      <ScrollArea className="h-[60vh]">
        <div className="space-y-3 pr-4">
        {expenses.map((expense, index) => (
          <Card key={index} className={`p-4 transition-colors ${isSelected(expense) ? 'bg-secondary' : ''}`}>
            <div className="flex items-start gap-4">
              <Checkbox
                checked={isSelected(expense)}
                onCheckedChange={() => handleSelect(expense)}
                className="mt-1"
              />
              <div className="flex-grow">
                <p className="font-semibold">{expense.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span>Amount: <span className="font-mono">{formatCurrency(expense.amount)}</span></span>
                  <span>Due: <span className="font-mono">{format(new Date(expense.dueDate), 'MMM dd, yyyy')}</span></span>
                  <span>Category: <Badge variant="outline">{expense.category}</Badge></span>
                  <span>Priority: <Badge variant="outline">{expense.priority}</Badge></span>
                   {expense.isRecurring && <span><Badge>Recurring</Badge></span>}
                </div>
                 {expense.notes && <p className="text-xs italic text-muted-foreground mt-2">Notes: {expense.notes}</p>}
              </div>
            </div>
          </Card>
        ))}
        </div>
      </ScrollArea>
    </div>
  );
}
