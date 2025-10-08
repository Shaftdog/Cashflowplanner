'use client';

import { useState, useEffect, useRef } from 'react';
import { useCashflowDataSupabase } from '@/hooks/use-cashflow-data-supabase';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Cashflow from '@/components/cashflow/cashflow';
import Capture from '@/components/capture/capture';
import Recurring from '@/components/recurring/recurring';
import type { PaymentItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, Upload, MoreVertical } from 'lucide-react';
import { AuthButton } from '@/components/auth/auth-button';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const {
    financials,
    setFinancials,
    items,
    addItem,
    updateItem,
    deleteItem,
    isLoaded,
    exportData,
    importData,
    user,
  } = useCashflowDataSupabase();

  const {
    expenses: recurringExpenses,
    addExpense: addRecurringExpense,
    updateExpense: updateRecurringExpense,
    deleteExpense: deleteRecurringExpense,
    isLoaded: recurringLoaded,
  } = useRecurringExpenses(user);

  const [editingItem, setEditingItem] = useState<PaymentItem | null>(null);
  const [activeTab, setActiveTab] = useState('capture');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle sidebar tab switching
  useEffect(() => {
    const handleTabSwitch = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-tab-trigger]');
      if (button) {
        const tabName = button.getAttribute('data-tab-trigger');
        if (tabName) {
          setActiveTab(tabName);
        }
      }
    };

    document.addEventListener('click', handleTabSwitch);
    return () => document.removeEventListener('click', handleTabSwitch);
  }, []);

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

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isLoaded || !recurringLoaded) {
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
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ROI CashFlow Commander</h1>
        <div className="flex items-center gap-2">
          <AuthButton user={user} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import data file"
          />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
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
        <TabsContent value="recurring">
          <Recurring
            expenses={recurringExpenses}
            addExpense={addRecurringExpense}
            updateExpense={updateRecurringExpense}
            deleteExpense={deleteRecurringExpense}
            onScheduleToCashflow={(newItems) => {
              // Check for duplicates by matching description + dueDate + amount
              let addedCount = 0;
              
              newItems.forEach(newItem => {
                const isDuplicate = items.some(existingItem => 
                  existingItem.description === newItem.description &&
                  existingItem.dueDate === newItem.dueDate &&
                  existingItem.amount === newItem.amount
                );
                
                if (!isDuplicate) {
                  addItem(newItem);
                  addedCount++;
                }
              });
              
              setActiveTab('cashflow');
              
              // Show toast with info about skipped duplicates
              if (addedCount < newItems.length) {
                const skipped = newItems.length - addedCount;
                toast({
                  title: 'Scheduled with duplicates skipped',
                  description: `Added ${addedCount} item${addedCount !== 1 ? 's' : ''}, skipped ${skipped} duplicate${skipped !== 1 ? 's' : ''}.`,
                });
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
