'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PrioritizePaymentsOutput } from '@/ai/flows/prioritize-payments';
import type { PaymentItem } from '@/lib/types';
import { Badge } from '../ui/badge';
import { PRIORITY_STYLES } from '@/lib/constants';

interface AiPriorityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  result: PrioritizePaymentsOutput;
}

const formatCurrency = (value: number) => {
    const isNegative = value < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
    return isNegative ? `+${formatted}` : formatted;
  };

const ItemList = ({ title, items }: { title: string; items: PaymentItem[] }) => (
  <div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <ScrollArea className="h-64 rounded-md border p-2">
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 rounded-md bg-secondary">
              <div>
                <p className="font-medium">{item.description}</p>
                <Badge variant="outline" className={`mt-1 text-xs ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</Badge>
              </div>
              <p className="font-mono">{formatCurrency(item.amount)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground p-4 text-center">No items to display.</p>
      )}
    </ScrollArea>
  </div>
);

export default function AiPriorityDialog({ isOpen, onOpenChange, result }: AiPriorityDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Payment Prioritization</DialogTitle>
          <DialogDescription>
            Based on priority and available funds, here is the recommended payment plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <ItemList title="Recommended Payments" items={result.recommendedPayments} />
          <ItemList title="Full Prioritized List" items={result.prioritizedPayments} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
