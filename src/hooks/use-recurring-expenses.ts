'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RecurringExpense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useRecurringExpenses(user: User | null) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Load data from Supabase
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('recurring_expenses')
          .select('*')
          .order('day_of_month', { ascending: true });

        if (error) throw error;

        // Transform DB format to app format
        const transformedExpenses: RecurringExpense[] = (data || []).map(expense => ({
          id: expense.id,
          description: expense.description,
          amount: Number(expense.amount),
          dayOfMonth: expense.day_of_month,
          priority: expense.priority,
          notes: expense.notes || undefined,
          isActive: expense.is_active,
          createdAt: expense.created_at,
        }));

        setExpenses(transformedExpenses);
      } catch (error) {
        console.error('Failed to load recurring expenses', error);
        toast({
          title: 'Error loading data',
          description: 'Could not load your recurring expenses.',
          variant: 'destructive',
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [user, supabase, toast]);

  const addExpense = useCallback(async (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add recurring expenses.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user.id,
          description: expense.description,
          amount: expense.amount,
          day_of_month: expense.dayOfMonth,
          priority: expense.priority,
          notes: expense.notes || null,
          is_active: expense.isActive,
        })
        .select()
        .single();

      if (error) throw error;

      const newExpense: RecurringExpense = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        dayOfMonth: data.day_of_month,
        priority: data.priority,
        notes: data.notes || undefined,
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      setExpenses(prevExpenses => [...prevExpenses, newExpense]);
      toast({ title: 'Expense Added', description: `"${expense.description}" has been added.` });
    } catch (error) {
      console.error('Failed to add expense', error);
      toast({
        title: 'Error',
        description: 'Could not add recurring expense.',
        variant: 'destructive',
      });
    }
  }, [user, supabase, toast]);

  const updateExpense = useCallback(async (id: string, updatedExpense: Partial<RecurringExpense>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updatedExpense.description !== undefined) updateData.description = updatedExpense.description;
      if (updatedExpense.amount !== undefined) updateData.amount = updatedExpense.amount;
      if (updatedExpense.dayOfMonth !== undefined) updateData.day_of_month = updatedExpense.dayOfMonth;
      if (updatedExpense.priority !== undefined) updateData.priority = updatedExpense.priority;
      if (updatedExpense.notes !== undefined) updateData.notes = updatedExpense.notes;
      if (updatedExpense.isActive !== undefined) updateData.is_active = updatedExpense.isActive;

      const { error } = await supabase
        .from('recurring_expenses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setExpenses(prevExpenses =>
        prevExpenses.map(expense => (expense.id === id ? { ...expense, ...updatedExpense } : expense))
      );
      toast({ title: 'Expense Updated', description: `"${updatedExpense.description}" has been updated.` });
    } catch (error) {
      console.error('Failed to update expense', error);
      toast({
        title: 'Error',
        description: 'Could not update recurring expense.',
        variant: 'destructive',
      });
    }
  }, [user, supabase, toast]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const expenseToDelete = expenses.find(e => e.id === id);
      
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
      
      if (expenseToDelete) {
        toast({
          title: 'Expense Deleted',
          description: `"${expenseToDelete.description}" has been deleted.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast({
        title: 'Error',
        description: 'Could not delete recurring expense.',
        variant: 'destructive',
      });
    }
  }, [user, expenses, supabase, toast]);

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    isLoaded,
  };
}

