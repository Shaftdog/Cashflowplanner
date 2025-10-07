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
import { Checkbox } from '@/components/ui/checkbox';
import type { RecurringExpense, Priority, Frequency, FrequencyConfig } from '@/lib/types';
import { PRIORITIES, FREQUENCIES, DAYS_OF_WEEK, MONTHS } from '@/lib/constants';

const formSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  type: z.enum(['expense', 'revenue'] as const),
  amount: z.coerce.number().refine(val => val !== 0, 'Amount cannot be zero.').refine(val => val > 0, 'Amount must be positive.'),
  frequency: z.enum(FREQUENCIES),
  daysOfWeek: z.array(z.number()).optional(),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  priority: z.enum(PRIORITIES),
  notes: z.string().optional(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  // Validate based on frequency type
  if (data.frequency === 'weekly' || data.frequency === 'biweekly') {
    if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one day of the week.',
        path: ['daysOfWeek'],
      });
    }
  } else if (data.frequency === 'monthly') {
    if (!data.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Day of month is required for monthly frequency.',
        path: ['dayOfMonth'],
      });
    }
  } else if (data.frequency === 'quarterly' || data.frequency === 'annually') {
    if (!data.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Day of month is required.',
        path: ['dayOfMonth'],
      });
    }
    if (!data.month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Month is required.',
        path: ['month'],
      });
    }
  }
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
      type: 'expense',
      amount: 0,
      frequency: 'monthly',
      daysOfWeek: [],
      dayOfMonth: 1,
      month: 1,
      priority: 'medium',
      notes: '',
      isActive: true,
    },
  });

  const selectedFrequency = form.watch('frequency');

  useEffect(() => {
    if (expense) {
      form.reset({
        description: expense.description,
        type: expense.type || 'expense',
        amount: Math.abs(expense.amount),
        frequency: expense.frequency,
        daysOfWeek: expense.frequencyConfig.daysOfWeek || [],
        dayOfMonth: expense.frequencyConfig.dayOfMonth || expense.dayOfMonth || 1,
        month: expense.frequencyConfig.month || 1,
        priority: expense.priority,
        notes: expense.notes || '',
        isActive: expense.isActive,
      });
    } else {
      form.reset({
        description: '',
        type: 'expense',
        amount: 0,
        frequency: 'monthly',
        daysOfWeek: [],
        dayOfMonth: 1,
        month: 1,
        priority: 'medium',
        notes: '',
        isActive: true,
      });
    }
  }, [expense, form]);

  const onSubmit = (values: FormValues) => {
    // Build frequencyConfig based on frequency type
    const frequencyConfig: FrequencyConfig = {};
    
    if (values.frequency === 'weekly' || values.frequency === 'biweekly') {
      frequencyConfig.daysOfWeek = values.daysOfWeek || [];
    } else if (values.frequency === 'monthly') {
      frequencyConfig.dayOfMonth = values.dayOfMonth;
    } else if (values.frequency === 'quarterly' || values.frequency === 'annually') {
      frequencyConfig.dayOfMonth = values.dayOfMonth;
      frequencyConfig.month = values.month;
    }

    const savedExpense: RecurringExpense = {
      ...expense,
      id: expense?.id || '',
      description: values.description,
      type: values.type,
      amount: Math.abs(values.amount),
      frequency: values.frequency,
      frequencyConfig,
      dayOfMonth: values.frequency === 'monthly' ? values.dayOfMonth : undefined,
      priority: values.priority,
      notes: values.notes,
      isActive: values.isActive,
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
            {expense ? 'Update the details of your recurring expense.' : 'Add a new recurring expense with your preferred frequency.'}
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
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f} value={f}>
                          <span className="capitalize">{f}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional fields based on frequency */}
            {(selectedFrequency === 'weekly' || selectedFrequency === 'biweekly') && (
              <FormField
                control={form.control}
                name="daysOfWeek"
                render={() => (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name="daysOfWeek"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={index}
                                className="flex flex-row items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(index)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const updated = checked
                                        ? [...current, index]
                                        : current.filter((value) => value !== index);
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {day}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedFrequency === 'monthly' && (
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
            )}

            {(selectedFrequency === 'quarterly' || selectedFrequency === 'annually') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((month, index) => (
                            <SelectItem key={index} value={(index + 1).toString()}>
                              {month}
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
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
                      This expense will be tracked {selectedFrequency === 'monthly' ? 'every month' : selectedFrequency === 'weekly' ? 'every week' : selectedFrequency === 'biweekly' ? 'every two weeks' : selectedFrequency === 'quarterly' ? 'every quarter' : 'every year'}.
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

