'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { PaymentItem } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import FinancialOverview from '@/components/cashflow/financial-overview';
import CategoryColumn from '@/components/cashflow/category-column';
import ItemDialog from '@/components/cashflow/item-dialog';

interface CashflowProps {
  financials: { availableFunds: number; savingsReserve: number };
  setFinancials: React.Dispatch<React.SetStateAction<{ availableFunds: number; savingsReserve: number }>>;
  items: PaymentItem[];
  addItem: (item: Omit<PaymentItem, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, item: Partial<PaymentItem>) => void;
  deleteItem: (id: string) => void;
  editingItem: PaymentItem | null;
  setEditingItem: (item: PaymentItem | null) => void;
  onEditItem: (item: PaymentItem) => void;
  onSaveItem: (item: PaymentItem) => void;
}

export default function Cashflow({
  financials,
  setFinancials,
  items,
  addItem,
  updateItem,
  deleteItem,
  editingItem,
  setEditingItem,
  onEditItem,
  onSaveItem,
}: CashflowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PaymentItem) => {
    onEditItem(item);
    setIsDialogOpen(true);
  }

  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <header className="mb-6 mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cashflow Board</h1>
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

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CATEGORIES.map(category => (
          <CategoryColumn
            key={category.id}
            category={category}
            items={items.filter(item => item.category === category.id)}
            onEditItem={handleEdit}
            onDeleteItem={deleteItem}
            financials={financials}
            updateItem={updateItem}
            addItem={addItem}
          />
        ))}
      </div>

      <ItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={onSaveItem}
        item={editingItem}
      />
    </>
  );
}
