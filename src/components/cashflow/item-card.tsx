'use client';

import type { PaymentItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, AlertTriangle, CalendarIcon, DollarSign } from 'lucide-react';
import { PRIORITY_STYLES } from '@/lib/constants';
import { format } from 'date-fns';

interface ItemCardProps {
  item: PaymentItem;
  onEdit: (item: PaymentItem) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (value: number) => {
  const isNegative = value < 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(value));
  return isNegative ? `+${formatted}` : formatted;
};

export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const isIncome = item.amount < 0;
  return (
    <Card className="shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-foreground">{item.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className={`flex items-center font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                <DollarSign className="mr-1 h-4 w-4" />
                {formatCurrency(item.amount)}
              </span>
              <span className="flex items-center">
                 <CalendarIcon className="mr-1 h-4 w-4" />
                {format(new Date(item.dueDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={PRIORITY_STYLES[item.priority]}>
              <AlertTriangle className="mr-1 h-3 w-3" />
              {item.priority}
            </Badge>
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item:
                    <br />
                    <strong>"{item.description}"</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {item.notes && <p className="mt-2 text-sm text-muted-foreground italic">"{item.notes}"</p>}
      </CardContent>
    </Card>
  );
}
