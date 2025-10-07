'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Wallet, PiggyBank, DollarSign } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { PaymentItem } from '@/lib/types';

interface FinancialOverviewProps {
  financials: {
    availableFunds: number;
    savingsReserve: number;
  };
  setFinancials: Dispatch<SetStateAction<{ availableFunds: number; savingsReserve: number }>>;
  items: PaymentItem[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function FinancialOverview({
  financials,
  setFinancials,
  items,
}: FinancialOverviewProps) {
  const totalRevenue = items.filter(item => item.type === 'revenue').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = totalRevenue - totalExpenses;
  const availableToPay = financials.availableFunds - financials.savingsReserve;

  const handleFundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFinancials(prev => ({ ...prev, availableFunds: Number(e.target.value) || 0 }));
  };

  const handleReserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFinancials(prev => ({ ...prev, savingsReserve: Number(e.target.value) || 0 }));
  };

  return (
    <Card className="mb-6 w-full shadow-md">
      <CardContent className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="available-funds" className="flex items-center text-sm font-medium text-muted-foreground">
            <Wallet className="mr-2 h-4 w-4" />
            Available Funds
          </Label>
          <Input
            id="available-funds"
            type="number"
            value={financials.availableFunds}
            onChange={handleFundsChange}
            className="text-2xl font-bold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="savings-reserve" className="flex items-center text-sm font-medium text-muted-foreground">
            <PiggyBank className="mr-2 h-4 w-4" />
            Savings Reserve
          </Label>
          <Input
            id="savings-reserve"
            type="number"
            value={financials.savingsReserve}
            onChange={handleReserveChange}
            className="text-2xl font-bold"
          />
        </div>
        <div className="space-y-2 rounded-lg bg-secondary p-3">
          <h3 className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
            Available to Pay
          </h3>
          <p className={cn('text-2xl font-bold', availableToPay < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
            {formatCurrency(availableToPay)}
          </p>
        </div>
        <div className="space-y-2 rounded-lg bg-secondary p-3">
          <h3 className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
            Total Revenue
          </h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="space-y-2 rounded-lg bg-secondary p-3">
          <h3 className="flex items-center text-sm font-medium text-muted-foreground">
            <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
            Total Expenses
          </h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="space-y-2 rounded-lg bg-secondary p-3">
          <h3 className="flex items-center text-sm font-medium text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4 text-blue-500" />
            Net Cash Flow
          </h3>
          <p className={cn('text-2xl font-bold', netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatCurrency(netCashFlow)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
