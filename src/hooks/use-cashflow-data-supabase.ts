'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PaymentItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useCashflowDataSupabase() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [financials, setFinancials] = useState({
    availableFunds: 10000,
    savingsReserve: 500,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Check authentication and load user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load data from Supabase
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      try {
        // Load payment items
        const { data: itemsData, error: itemsError } = await supabase
          .from('payment_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;

        // Transform DB format to app format
        const transformedItems: PaymentItem[] = (itemsData || []).map(item => ({
          id: item.id,
          description: item.description,
          amount: Number(item.amount),
          type: item.type || 'expense',
          dueDate: item.due_date,
          category: item.category as any,
          priority: item.priority,
          notes: item.notes || undefined,
          createdAt: item.created_at,
          isPaid: item.is_paid || false,
          paidDate: item.paid_date || undefined,
          recurringExpenseId: item.recurring_expense_id || undefined,
        }));

        setItems(transformedItems);

        // Note: We no longer auto-move items to Overdue on load
        // This respects user's manual category assignments
        // The overdue badge on item cards still provides visual indication

        // Load financials
        const { data: financialsData, error: financialsError } = await supabase
          .from('user_financials')
          .select('*')
          .single();

        if (financialsError && financialsError.code !== 'PGRST116') {
          throw financialsError;
        }

        if (financialsData) {
          setFinancials({
            availableFunds: Number(financialsData.available_funds),
            savingsReserve: Number(financialsData.savings_reserve),
          });
        }
      } catch (error) {
        console.error('Failed to load data from Supabase', error);
        toast({
          title: 'Error loading data',
          description: 'Could not load your saved data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [user, supabase, toast]);

  // Update financials in Supabase
  useEffect(() => {
    if (!user || !isLoaded) return;

    const updateFinancials = async () => {
      try {
        const { error } = await supabase
          .from('user_financials')
          .upsert({
            user_id: user.id,
            available_funds: financials.availableFunds,
            savings_reserve: financials.savingsReserve,
          });

        if (error) throw error;
      } catch (error) {
        console.error('Failed to save financials', error);
      }
    };

    updateFinancials();
  }, [financials, user, isLoaded, supabase]);

  const addItem = useCallback(async (item: Omit<PaymentItem, 'id' | 'createdAt'>) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add items.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_items')
        .insert({
          user_id: user.id,
          description: item.description,
          amount: item.amount,
          type: item.type || 'expense',
          due_date: item.dueDate,
          category: item.category,
          priority: item.priority,
          notes: item.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: PaymentItem = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        type: data.type || 'expense',
        dueDate: data.due_date,
        category: data.category as any,
        priority: data.priority,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        isPaid: data.is_paid || false,
        paidDate: data.paid_date || undefined,
        recurringExpenseId: data.recurring_expense_id || undefined,
      };

      setItems(prevItems => [...prevItems, newItem]);
      toast({ title: 'Item Added', description: `"${item.description}" has been added.` });
    } catch (error) {
      console.error('Failed to add item', error);
      toast({
        title: 'Error',
        description: 'Could not add item.',
        variant: 'destructive',
      });
    }
  }, [user, supabase, toast]);

  const updateItem = useCallback(async (id: string, updatedItem: Partial<PaymentItem>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updatedItem.description !== undefined) updateData.description = updatedItem.description;
      if (updatedItem.amount !== undefined) updateData.amount = updatedItem.amount;
      if (updatedItem.type !== undefined) updateData.type = updatedItem.type;
      if (updatedItem.dueDate !== undefined) updateData.due_date = updatedItem.dueDate;
      if (updatedItem.category !== undefined) updateData.category = updatedItem.category;
      if (updatedItem.priority !== undefined) updateData.priority = updatedItem.priority;
      if (updatedItem.notes !== undefined) updateData.notes = updatedItem.notes;
      if (updatedItem.isPaid !== undefined) updateData.is_paid = updatedItem.isPaid;
      if (updatedItem.paidDate !== undefined) updateData.paid_date = updatedItem.paidDate;
      if (updatedItem.recurringExpenseId !== undefined) updateData.recurring_expense_id = updatedItem.recurringExpenseId;

      const { error } = await supabase
        .from('payment_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setItems(prevItems =>
        prevItems.map(item => (item.id === id ? { ...item, ...updatedItem } : item))
      );
      toast({ title: 'Item Updated', description: `"${updatedItem.description}" has been updated.` });
    } catch (error) {
      console.error('Failed to update item', error);
      toast({
        title: 'Error',
        description: 'Could not update item.',
        variant: 'destructive',
      });
    }
  }, [user, supabase, toast]);

  const deleteItem = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const itemToDelete = items.find(i => i.id === id);
      
      const { error } = await supabase
        .from('payment_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      if (itemToDelete) {
        toast({
          title: 'Item Deleted',
          description: `"${itemToDelete.description}" has been deleted.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete item', error);
      toast({
        title: 'Error',
        description: 'Could not delete item.',
        variant: 'destructive',
      });
    }
  }, [user, items, supabase, toast]);

  // Function to check and move overdue items
  const checkOverdueItems = useCallback(async (itemsToCheck?: PaymentItem[]) => {
    if (!user) return;

    const itemsArray = itemsToCheck || items;
    const now = new Date();
    const overdueItems = itemsArray.filter(item => 
      !item.isPaid && 
      new Date(item.dueDate) < now && 
      item.category !== 'Overdue'
    );

    if (overdueItems.length === 0) return;

    try {
      // Batch update overdue items
      for (const item of overdueItems) {
        await supabase
          .from('payment_items')
          .update({ category: 'Overdue' })
          .eq('id', item.id);
      }

      // Update local state
      setItems(prevItems =>
        prevItems.map(item =>
          overdueItems.find(oi => oi.id === item.id)
            ? { ...item, category: 'Overdue' as any }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to update overdue items', error);
    }
  }, [user, items, supabase]);

  // Mark item as paid
  const markAsPaid = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const paidDate = new Date().toISOString();

      const { error } = await supabase
        .from('payment_items')
        .update({ 
          is_paid: true, 
          paid_date: paidDate 
        })
        .eq('id', id);

      if (error) throw error;

      setItems(prevItems =>
        prevItems.map(i => 
          i.id === id 
            ? { ...i, isPaid: true, paidDate } 
            : i
        )
      );

      toast({ 
        title: 'Marked as Paid', 
        description: `"${item.description}" has been marked as paid.` 
      });

      // If this is a recurring item, schedule the next occurrence
      if (item.recurringExpenseId) {
        await scheduleNextRecurrence(id);
      }
    } catch (error) {
      console.error('Failed to mark item as paid', error);
      toast({
        title: 'Error',
        description: 'Could not mark item as paid.',
        variant: 'destructive',
      });
    }
  }, [user, items, supabase, toast]);

  // Unmark item as paid
  const unmarkAsPaid = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('payment_items')
        .update({ 
          is_paid: false, 
          paid_date: null 
        })
        .eq('id', id);

      if (error) throw error;

      setItems(prevItems =>
        prevItems.map(i => 
          i.id === id 
            ? { ...i, isPaid: false, paidDate: undefined } 
            : i
        )
      );

      toast({ 
        title: 'Unmarked as Paid', 
        description: `"${item.description}" has been unmarked as paid.` 
      });
    } catch (error) {
      console.error('Failed to unmark item as paid', error);
      toast({
        title: 'Error',
        description: 'Could not unmark item as paid.',
        variant: 'destructive',
      });
    }
  }, [user, items, supabase, toast]);

  // Schedule next occurrence for recurring items
  const scheduleNextRecurrence = useCallback(async (paidItemId: string) => {
    if (!user) return;

    try {
      const paidItem = items.find(i => i.id === paidItemId);
      if (!paidItem || !paidItem.recurringExpenseId) return;

      // Fetch the recurring expense template
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('id', paidItem.recurringExpenseId)
        .single();

      if (recurringError) throw recurringError;
      if (!recurringData || !recurringData.is_active) return;

      // Calculate next due date based on frequency
      const currentDueDate = new Date(paidItem.dueDate);
      let nextDueDate = new Date(currentDueDate);

      switch (recurringData.frequency) {
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDueDate.setDate(nextDueDate.getDate() + 14);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          break;
        case 'annually':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }

      // Check if next occurrence already exists
      const { data: existingItems } = await supabase
        .from('payment_items')
        .select('id')
        .eq('recurring_expense_id', paidItem.recurringExpenseId)
        .eq('is_paid', false)
        .gte('due_date', nextDueDate.toISOString());

      if (existingItems && existingItems.length > 0) {
        // Next occurrence already scheduled
        return;
      }

      // Create new payment item for next occurrence
      const { data: newItemData, error: insertError } = await supabase
        .from('payment_items')
        .insert({
          user_id: user.id,
          description: recurringData.description,
          amount: recurringData.amount,
          type: recurringData.type || 'expense',
          due_date: nextDueDate.toISOString(),
          category: 'Needs Work', // Start in Needs Work for user to categorize
          priority: recurringData.priority,
          notes: recurringData.notes || null,
          recurring_expense_id: paidItem.recurringExpenseId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newItem: PaymentItem = {
        id: newItemData.id,
        description: newItemData.description,
        amount: Number(newItemData.amount),
        type: newItemData.type || 'expense',
        dueDate: newItemData.due_date,
        category: newItemData.category as any,
        priority: newItemData.priority,
        notes: newItemData.notes || undefined,
        createdAt: newItemData.created_at,
        isPaid: false,
        paidDate: undefined,
        recurringExpenseId: newItemData.recurring_expense_id || undefined,
      };

      setItems(prevItems => [...prevItems, newItem]);

      toast({ 
        title: 'Next Payment Scheduled', 
        description: `Next "${recurringData.description}" scheduled for ${nextDueDate.toLocaleDateString()}.`,
      });
    } catch (error) {
      console.error('Failed to schedule next recurrence', error);
      // Don't show error toast to avoid bothering user - this is a background operation
    }
  }, [user, items, supabase, toast]);

  const exportData = useCallback(() => {
    const data = {
      items,
      financials,
      exportDate: new Date().toISOString(),
      version: 'v2',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cashflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Data Exported', description: 'Your data has been exported successfully.' });
  }, [items, financials, toast]);

  const importData = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to import data.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.items && Array.isArray(data.items)) {
          // Import items to Supabase
          for (const item of data.items) {
            await addItem(item);
          }
        }
        
        if (data.financials) {
          setFinancials(data.financials);
        }
        
        toast({
          title: 'Data Imported',
          description: `Successfully imported ${data.items?.length || 0} items.`,
        });
      } catch (error) {
        console.error('Failed to import data', error);
        toast({
          title: 'Import Failed',
          description: 'The file could not be read. Please check the format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, [user, addItem, toast]);

  return {
    items,
    setItems,
    financials,
    setFinancials,
    addItem,
    updateItem,
    deleteItem,
    markAsPaid,
    unmarkAsPaid,
    checkOverdueItems,
    isLoaded,
    exportData,
    importData,
    user,
  };
}


