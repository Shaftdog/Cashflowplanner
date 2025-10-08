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
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Edit, Trash2, AlertTriangle, CalendarIcon, TrendingUp, TrendingDown, GripVertical, CheckCircle2 } from 'lucide-react';
import { PRIORITY_STYLES } from '@/lib/constants';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItemCardProps {
  item: PaymentItem;
  onEdit: (item: PaymentItem) => void;
  onDelete: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  isDragging?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(value));
};

export default function ItemCard({ item, onEdit, onDelete, onMarkPaid, isDragging }: ItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isRevenue = item.type === 'revenue';

  // Handle click on the card itself for editing
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on the dropdown menu, drag handle, or checkbox
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('[data-dropdown]') || 
       e.target.closest('[data-drag-handle]') || 
       e.target.closest('[data-checkbox]'))
    ) {
      return;
    }
    onEdit(item);
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    if (onMarkPaid) {
      onMarkPaid(item.id);
    }
  };

  // Calculate if item is overdue
  const isOverdue = !item.isPaid && new Date(item.dueDate) < new Date();
  const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`shadow-sm transition-all hover:shadow-md cursor-pointer relative ${item.isPaid ? 'opacity-60' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Drag handle */}
          <div 
            {...attributes} 
            {...listeners}
            data-drag-handle
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2 ml-8">
            <div className="flex items-center gap-2">
              {/* Checkbox for marking as paid */}
              {onMarkPaid && (
                <div data-checkbox onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={item.isPaid} 
                    onCheckedChange={handleCheckboxChange}
                    className="h-5 w-5"
                  />
                </div>
              )}
              <p className={`font-semibold text-foreground truncate break-words ${item.isPaid ? 'line-through' : ''}`}>
                {item.description}
              </p>
              {item.isPaid && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Paid
                </Badge>
              )}
              <Badge variant="outline" className={isRevenue ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                {isRevenue ? 'Revenue' : 'Expense'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className={`flex items-center font-bold ${isRevenue ? 'text-green-600' : 'text-red-600'}`}>
                {isRevenue ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {formatCurrency(item.amount)}
              </span>
              <span className="flex items-center">
                 <CalendarIcon className="mr-1 h-4 w-4" />
                {format(new Date(item.dueDate), 'MMM dd, yyyy')}
              </span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                </Badge>
              )}
              {item.isPaid && item.paidDate && (
                <span className="text-xs text-muted-foreground">
                  Paid: {format(new Date(item.paidDate), 'MMM dd')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={PRIORITY_STYLES[item.priority]}>
              <AlertTriangle className="mr-1 h-3 w-3" />
              {item.priority}
            </Badge>
            <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown>
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
