import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './AlertDialog';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MessageDialog({ open, onOpenChange, title, message, type = 'success' }) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : AlertCircle;
  const iconColor = type === 'success' 
    ? 'text-green-500' 
    : type === 'error' 
    ? 'text-red-500' 
    : 'text-yellow-500';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={cn("h-6 w-6", iconColor)} />
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


