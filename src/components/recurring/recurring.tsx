'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar } from 'lucide-react';
import type { RecurringExpense } from '@/lib/types';
import RecurringDialog from '@/components/recurring/recurring-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRIORITY_STYLES } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface RecurringProps {
  expenses: RecurringExpense[];
  addExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<RecurringExpense>) => void;
  deleteExpense: (id: string) => void;
}

export default function Recurring({
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
}: RecurringProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSave = (expense: RecurringExpense) => {
    if (expense.id) {
      updateExpense(expense.id, expense);
    } else {
      addExpense(expense);
    }
  };

  const totalMonthly = expenses
    .filter(e => e.isActive)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      <header className="mb-6 mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recurring Expenses</h1>
          <p className="text-muted-foreground">
            Manage your monthly recurring expenses and track payment schedules.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Add Recurring Expense
        </Button>
      </header>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Total active recurring expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${totalMonthly.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {expenses.filter(e => e.isActive).length} active expense
            {expenses.filter(e => e.isActive).length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {expenses.map(expense => (
          <Card key={expense.id} className={!expense.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{expense.description}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      Day {expense.dayOfMonth} of each month
                    </div>
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(expense)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteExpense(expense.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">${expense.amount.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={PRIORITY_STYLES[expense.priority]}>
                    {expense.priority}
                  </Badge>
                  {!expense.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                {expense.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {expense.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring expenses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first recurring expense to get started tracking monthly payments.
            </p>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Expense
            </Button>
          </CardContent>
        </Card>
      )}

      <RecurringDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        expense={editingExpense}
      />
    </div>
  );
}

