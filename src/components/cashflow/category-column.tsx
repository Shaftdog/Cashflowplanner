'use client';

import { useState } from 'react';
import type { PaymentItem, CategoryConfig, CategoryName } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import ItemCard from './item-card';
import { PRIORITY_ORDER } from '@/lib/constants';
import { prioritizePayments } from '@/ai/flows/prioritize-payments';
import type { PrioritizePaymentsOutput } from '@/ai/flows/prioritize-payments';
import AiPriorityDialog from './ai-priority-dialog';
import { Sparkles } from 'lucide-react';

interface CategoryColumnProps {
  category: CategoryConfig;
  items: PaymentItem[];
  onEditItem: (item: PaymentItem) => void;
  onDeleteItem: (id: string) => void;
  financials: {
    availableFunds: number;
    savingsReserve: number;
  };
  updateItem: (id: string, updatedFields: Partial<PaymentItem>) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function CategoryColumn({
  category,
  items,
  onEditItem,
  onDeleteItem,
  financials,
}: CategoryColumnProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<PrioritizePaymentsOutput | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const sortedItems = [...items].sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
  const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0);

  const handleRunAiPrioritization = async () => {
    setIsAiLoading(true);
    try {
      const result = await prioritizePayments({
        payments: items,
        availableFunds: financials.availableFunds,
        savingsReserve: financials.savingsReserve,
      });
      setAiResult(result);
      setIsAiDialogOpen(true);
    } catch (error) {
      console.error('AI Prioritization failed', error);
      // Optionally show a toast notification
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      <Card className={`flex flex-col ${category.color}`}>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b p-4">
          <div className="grid gap-1">
            <CardTitle className={`text-lg font-semibold ${category.textColor}`}>{category.title}</CardTitle>
            <CardDescription className={`${category.textColor}/80`}>
              {items.length} items | {formatCurrency(categoryTotal)}
            </CardDescription>
          </div>
          {category.id === 'Current Week' && (
            <Button size="sm" onClick={handleRunAiPrioritization} disabled={isAiLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isAiLoading ? 'Analyzing...' : 'AI Analyze'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-80 w-full">
            <div className="p-4 space-y-3">
              {sortedItems.length > 0 ? (
                sortedItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                  />
                ))
              ) : (
                <div className="flex h-full min-h-24 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No items in this category.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {aiResult && (
        <AiPriorityDialog
          isOpen={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          result={aiResult}
        />
      )}
    </>
  );
}
