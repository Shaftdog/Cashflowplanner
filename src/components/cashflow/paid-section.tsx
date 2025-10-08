'use client';

import { useState } from 'react';
import type { PaymentItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import ItemCard from '@/components/cashflow/item-card';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface PaidSectionProps {
  items: PaymentItem[];
  onEditItem: (item: PaymentItem) => void;
  onDeleteItem: (id: string) => void;
  onUnmarkPaid: (id: string) => void;
}

export default function PaidSection({
  items,
  onEditItem,
  onDeleteItem,
  onUnmarkPaid,
}: PaidSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'paid-section',
  });

  // Sort paid items by paid date (most recent first)
  const sortedItems = [...items].sort((a, b) => {
    if (!a.paidDate) return 1;
    if (!b.paidDate) return -1;
    return new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime();
  });

  const totalPaidAmount = items.reduce((sum, item) => {
    return item.type === 'revenue' ? sum + item.amount : sum - item.amount;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
  };

  return (
    <div ref={setNodeRef} className={`mt-8 ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">
                Paid ({items.length} {items.length === 1 ? 'item' : 'items'})
              </CardTitle>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Total: <span className={totalPaidAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(totalPaidAmount)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No paid items yet.</p>
                <p className="text-sm mt-1">Check off items to mark them as paid.</p>
              </div>
            ) : (
              <SortableContext
                items={sortedItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      onMarkPaid={onUnmarkPaid}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

