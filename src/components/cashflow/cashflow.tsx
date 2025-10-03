'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { PaymentItem, CategoryName } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import FinancialOverview from '@/components/cashflow/financial-overview';
import CategoryColumn from '@/components/cashflow/category-column';
import ItemDialog from '@/components/cashflow/item-dialog';
import ItemCard from '@/components/cashflow/item-card';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PaymentItem) => {
    onEditItem(item);
    setIsDialogOpen(true);
  }

  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeItem = items.find(item => item.id === active.id);
    const newCategory = over.id as CategoryName;

    if (activeItem && activeItem.category !== newCategory) {
      // Update the item's category
      updateItem(activeItem.id, { category: newCategory });
    }

    setActiveId(null);
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
            addItem={addItem}
          />
        ))}
      </div>

      {/* Drag overlay - shows the item being dragged */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80">
            <ItemCard
              item={activeItem}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>

      <ItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={onSaveItem}
        item={editingItem}
      />
    </DndContext>
  );
}
