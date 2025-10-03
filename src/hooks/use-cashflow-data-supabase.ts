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
          dueDate: item.due_date,
          category: item.category as any,
          priority: item.priority,
          notes: item.notes || undefined,
          createdAt: item.created_at,
        }));

        setItems(transformedItems);

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
        dueDate: data.due_date,
        category: data.category as any,
        priority: data.priority,
        notes: data.notes || undefined,
        createdAt: data.created_at,
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
      if (updatedItem.dueDate !== undefined) updateData.due_date = updatedItem.dueDate;
      if (updatedItem.category !== undefined) updateData.category = updatedItem.category;
      if (updatedItem.priority !== undefined) updateData.priority = updatedItem.priority;
      if (updatedItem.notes !== undefined) updateData.notes = updatedItem.notes;

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
    isLoaded,
    exportData,
    importData,
    user,
  };
}


