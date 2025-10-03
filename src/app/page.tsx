'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { PaymentItem, CategoryName } from '@/lib/types';
import { useCashflowData } from '@/hooks/use-cashflow-data';
import { CATEGORIES } from '@/lib/constants';
import FinancialOverview from '@/components/cashflow/financial-overview';
import CategoryColumn from '@/components/cashflow/category-column';
import ItemDialog from '@/components/cashflow/item-dialog';
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentItem | null>(null);

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: PaymentItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSaveItem = (item: PaymentItem) => {
    if (editingItem) {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
  };

  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">ROI CashFlow Commander</h1>
          <p className="text-muted-foreground">Loading your financial data...</p>
        </header>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ROI CashFlow Commander</h1>
            <p className="text-muted-foreground">
              Manage your cash flow with precision and confidence.
            </p>
          </div>
          <Button onClick={handleAddNewItem}>
            <PlusCircle className="mr-2" />
            Add New Item
          </Button>
        </header>

        <FinancialOverview
          financials={financials}
          setFinancials={setFinancials}
          totalExpenses={totalExpenses}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map(category => (
            <CategoryColumn
              key={category.id}
              category={category}
              items={items.filter(item => item.category === category.id)}
              onEditItem={handleEditItem}
              onDeleteItem={deleteItem}
              financials={financials}
              updateItem={updateItem}
            />
          ))}
        </div>

        <ItemDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveItem}
          item={editingItem}
        />
      </main>
    </div>
  );
}
