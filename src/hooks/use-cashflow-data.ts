'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PaymentItem, CategoryName } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ITEMS_STORAGE_KEY = 'cashflow_items_v2';
const FINANCIALS_STORAGE_KEY = 'cashflow_financials_v2';

const getInitialItems = (): PaymentItem[] => {
  return [
    {
      id: '1',
      description: 'Office Supplies',
      amount: 150.75,
      dueDate: new Date().toISOString(),
      category: 'Current Week',
      priority: 'medium',
      notes: 'Monthly order from Staples',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      description: 'Liability Insurance',
      amount: 450.0,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      category: 'Next Week',
      priority: 'high',
      notes: 'Quarterly payment',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      description: 'Client Invoice #1023',
      amount: -2500.0,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      category: 'Suspected to Be Paid or Received',
      priority: 'high',
      notes: 'Payment expected via ACH',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      description: 'Vehicle Maintenance',
      amount: 320.5,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
      category: 'Overdue',
      priority: 'critical',
      notes: 'Needs immediate attention',
      createdAt: new Date().toISOString(),
    },
    {
        id: '5',
        description: 'Software Subscription',
        amount: 49.99,
        dueDate: new Date().toISOString(),
        category: 'Current Week',
        priority: 'low',
        notes: 'Recurring monthly charge',
        createdAt: new Date().toISOString(),
    },
  ];
};

export function useCashflowData() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [financials, setFinancials] = useState({
    availableFunds: 10000,
    savingsReserve: 500,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
      const storedFinancials = localStorage.getItem(FINANCIALS_STORAGE_KEY);

      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        setItems(getInitialItems());
      }
      
      if (storedFinancials) {
        setFinancials(JSON.parse(storedFinancials));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      toast({
        title: 'Error loading data',
        description: 'Could not load your saved data. Using default values.',
        variant: 'destructive',
      });
      setItems(getInitialItems());
    } finally {
      setIsLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem(FINANCIALS_STORAGE_KEY, JSON.stringify(financials));
      } catch (error) {
        console.error('Failed to save data to localStorage', error);
        toast({
          title: 'Error saving data',
          description: 'Your changes could not be saved to local storage.',
          variant: 'destructive',
        });
      }
    }
  }, [items, financials, isLoaded, toast]);

  const addItem = useCallback((item: Omit<PaymentItem, 'id' | 'createdAt'>) => {
    const newItem: PaymentItem = {
      ...item,
      id: new Date().getTime().toString(),
      createdAt: new Date().toISOString(),
    };
    setItems(prevItems => [...prevItems, newItem]);
    toast({ title: 'Item Added', description: `"${item.description}" has been added.` });
  }, [toast]);

  const updateItem = useCallback((id: string, updatedItem: Partial<PaymentItem>) => {
    setItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, ...updatedItem } : item))
    );
     toast({ title: 'Item Updated', description: `"${updatedItem.description}" has been updated.` });
  }, [toast]);

  const deleteItem = useCallback((id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    if(itemToDelete) {
        toast({ title: 'Item Deleted', description: `"${itemToDelete.description}" has been deleted.`, variant: 'destructive' });
    }
  }, [items, toast]);

  return {
    items,
    setItems,
    financials,
    setFinancials,
    addItem,
    updateItem,
    deleteItem,
    isLoaded,
  };
}
