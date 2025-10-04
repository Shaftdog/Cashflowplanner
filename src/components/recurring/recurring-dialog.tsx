'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { RecurringExpense, Priority } from '@/lib/types';
import { PRIORITIES } from '@/lib/constants';

const formSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().refine(val => val !== 0, 'Amount cannot be zero.'),
  dayOfMonth: z.coerce.number().min(1, 'Day must be between 1 and 31.').max(31, 'Day must be between 1 and 31.'),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecurringDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: RecurringExpense) => void;
  expense: RecurringExpense | null;
}

export default function RecurringDialog({ isOpen, onOpenChange, onSave, expense }: RecurringDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dayOfMonth: 1,
      priority: 'medium',
      notes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        dayOfMonth: expense.dayOfMonth,
        priority: expense.priority,
        notes: expense.notes || '',
        isActive: expense.isActive,
      });
    } else {
      form.reset({
        description: '',
        amount: 0,
        dayOfMonth: 1,
        priority: 'medium',
        notes: '',
        isActive: true,
      });
    }
  }, [expense, form]);

  const onSubmit = (values: FormValues) => {
    const savedExpense = {
      ...expense,
      id: expense?.id || '',
      ...values,
      createdAt: expense?.createdAt || '',
    };
    onSave(savedExpense);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Update the details of your recurring expense.' : 'Add a new recurring expense that happens monthly.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rent Payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Month</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p} value={p}>
                          <span className="capitalize">{p}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      This expense will be tracked every month.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

