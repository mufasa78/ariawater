import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatKes = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('Ksh', 'KES');
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'received': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'dispatched': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
