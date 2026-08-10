import React, { useState, useRef } from 'react';
import { useListOrders, getListOrdersQueryKey, useUpdateOrderStatus, OrderStatusUpdateStatus } from '@workspace/api-client-react';
import { formatKes, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams: { page: number; limit: number; status?: 'received' | 'processing' | 'dispatched' | 'delivered' } = {
    page,
    limit,
    ...(statusFilter !== 'all' ? { status: statusFilter as 'received' | 'processing' | 'dispatched' | 'delivered' } : {})
  };

  const { data: orderResponse, isLoading } = useListOrders(queryParams, {
    query: { queryKey: getListOrdersQueryKey(queryParams) }
  });

  const orders = orderResponse?.orders || [];
  
  // Client-side search filtering
  const filteredOrders = React.useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const lowerQuery = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.id.toLowerCase().includes(lowerQuery) ||
      order.customerName?.toLowerCase().includes(lowerQuery) ||
      order.phone?.toLowerCase().includes(lowerQuery) ||
      order.deliveryAddress?.toLowerCase().includes(lowerQuery) ||
      order.ticketNumber?.toLowerCase().includes(lowerQuery)
    );
  }, [orders, searchQuery]);
  
  const total = orderResponse?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500">Process and track customer orders.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search orders..." 
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Total & Payment</th>
                <th className="px-6 py-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                  {searchQuery ? `No orders found matching "${searchQuery}"` : 'No orders found matching your criteria.'}
                </td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-900 mb-1">#{order.ticketNumber || order.id}</div>
                      <div className="text-xs text-slate-500 mb-2">{formatDate(order.createdAt)}</div>
                      <Badge variant="outline" className={`${getStatusColor(order.status)} border-0 text-xs`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-slate-600 mt-1">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-xs">
                      <div className="text-slate-700 leading-snug">{order.deliveryAddress}</div>
                      {order.notes && <div className="text-xs text-slate-500 mt-2 italic">Note: {order.notes}</div>}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-900 mb-1">{formatKes(order.totalKes)}</div>
                      <div className="flex items-center gap-1.5 text-xs mt-2">
                        <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-500' : order.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="capitalize text-slate-600">{order.paymentStatus} ({order.paymentMethod || '?'})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} queryParams={queryParams} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
            <span className="text-sm text-slate-600">
              Showing page {page} of {totalPages} {searchQuery && `(filtered)`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function OrderStatusUpdater({ orderId, currentStatus, queryParams }: { orderId: string, currentStatus: string, queryParams: any }) {
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Store the mutation fn in a ref to safely use in handlers without infinite loops
  const mutateFn = useRef(updateStatus.mutate);
  mutateFn.current = updateStatus.mutate;

  const handleStatusChange = (newStatus: OrderStatusUpdateStatus) => {
    if (newStatus === currentStatus) return;
    
    mutateFn.current(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          // Instead of invalidating which causes full refetch, update cache directly if possible
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey(queryParams) });
          toast({ title: 'Status updated', description: `Order #${orderId} is now ${newStatus}` });
        },
        onError: () => {
          toast({ variant: 'destructive', title: 'Update failed' });
        }
      }
    );
  };

  return (
    <div className="flex justify-end">
      <Select 
        defaultValue={currentStatus} 
        onValueChange={(val) => handleStatusChange(val as OrderStatusUpdateStatus)}
        disabled={updateStatus.isPending || currentStatus === 'delivered'}
      >
        <SelectTrigger className="w-[140px] h-9 text-xs">
          {updateStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="received" disabled={currentStatus !== 'received'}>Received</SelectItem>
          <SelectItem value="processing" disabled={currentStatus === 'dispatched' || currentStatus === 'delivered'}>Processing</SelectItem>
          <SelectItem value="dispatched" disabled={currentStatus === 'delivered'}>Dispatched</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
