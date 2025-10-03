'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface FinancialOverviewProps {
  financials: {
    availableFunds: number;
    savingsReserve: number;
  };
  setFinancials: Dispatch<SetStateAction<{ availableFunds: number; savingsReserve: number }>>;
  totalExpenses: number;
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
  totalExpenses,
}: FinancialOverviewProps) {
  const availableToPay = financials.availableFunds - financials.savingsReserve;

  const handleFundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFinancials(prev => ({ ...prev, availableFunds: Number(e.target.value) || 0 }));
  };

  const handleReserveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFinancials(prev => ({ ...prev, savingsReserve: Number(e.target.value) || 0 }));
  };

  return (
    <Card className="mb-6 w-full shadow-md">
      <CardContent className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
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
            <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
            Total Expenses
          </h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
