'use client';

import { useState } from 'react';
import { useCashflowData } from '@/hooks/use-cashflow-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Cashflow from '@/components/cashflow/cashflow';
import Capture from '@/components/capture/capture';
import type { PaymentItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const {
    financials,
    setFinancials,
    items,
    addItem,
    updateItem,
    deleteItem,
    isLoaded,
  } = useCashflowData();

  const [editingItem, setEditingItem] = useState<PaymentItem | null>(null);

  const handleEditItem = (item: PaymentItem) => {
    setEditingItem(item);
  };

  const handleSaveItem = (item: PaymentItem) => {
    if (item.id) {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">ROI CashFlow Commander</h1>
          <p className="text-muted-foreground">Loading your financial data...</p>
        </header>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue="capture" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
        </TabsList>
        <TabsContent value="capture">
          <Capture
            onAddItems={(newItems) => newItems.forEach(addItem)}
          />
        </TabsContent>
        <TabsContent value="cashflow">
          <Cashflow
            financials={financials}
            setFinancials={setFinancials}
            items={items}
            addItem={addItem}
            updateItem={updateItem}
            deleteItem={deleteItem}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            onEditItem={handleEditItem}
            onSaveItem={handleSaveItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
