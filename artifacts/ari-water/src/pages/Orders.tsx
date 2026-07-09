import React, { useState } from 'react';
import { useListOrders, useGetOrder, getGetOrderQueryKey, useCreateReview } from '@workspace/api-client-react';
import { formatKes, formatDate, getStatusColor, getPaymentStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Package, ChevronRight, Clock, MapPin, CreditCard, Star, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Orders() {
  const { data: ordersData, isLoading: isLoadingOrders } = useListOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const orders = ordersData?.orders || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">My Orders</h1>
        <p className="text-slate-600 mt-2">Track your delivery and view past orders.</p>
      </div>

      {isLoadingOrders ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <div className="h-24 bg-slate-100 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <div className="bg-primary/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
          <p className="text-slate-500 mb-6">You haven't placed any orders with Ari Water.</p>
          <Button asChild>
            <a href="/shop">Start Shopping</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-slate-200" onClick={() => setSelectedOrderId(order.id)}>
              <CardContent className="p-0">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl hidden sm:block">
                      <Package className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-slate-900">Order #{order.id}</h3>
                        <Badge className={`${getStatusColor(order.status)} font-medium px-2.5 py-0.5`} variant="outline">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                      <p className="font-bold text-slate-900">{formatKes(order.totalKes)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedOrderId && (
        <OrderDetailDialog 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
        />
      )}
    </div>
  );
}

function OrderDetailDialog({ orderId, onClose }: { orderId: number, onClose: () => void }) {
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) }
  });
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewRemark, setReviewRemark] = useState('');
  const createReview = useCreateReview();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleReviewSubmit = () => {
    createReview.mutate(
      { id: orderId, data: { rating: reviewRating, remark: reviewRemark } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
        },
        onError: () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review.' });
        }
      }
    );
  };

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-[600px] p-0 overflow-hidden gap-0">
        {isLoading || !order ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4 mb-8" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 border-b p-6 sm:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <DialogTitle className="text-2xl font-display font-bold text-slate-900 mb-2">Order #{order.id}</DialogTitle>
                  <DialogDescription className="text-slate-500">Placed on {formatDate(order.createdAt)}</DialogDescription>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(order.status)} font-medium px-3 py-1 mb-2`} variant="outline">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm justify-end text-slate-600">
                    <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
              {/* Order Items */}
              <div className="mb-8">
                <h4 className="font-semibold text-slate-900 mb-4">Items</h4>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-500">{item.packSize} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatKes(item.unitPriceKes * item.quantity)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 mt-2">
                    <p className="font-bold text-slate-900 text-lg">Total</p>
                    <p className="font-bold text-primary text-xl">{formatKes(order.totalKes)}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div>
                  <h4 className="flex items-center gap-2 font-medium text-slate-900 mb-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" /> Delivery Address
                  </h4>
                  <p className="text-slate-600 text-sm">{order.deliveryAddress}</p>
                  <p className="text-slate-600 text-sm mt-1">{order.phone}</p>
                  {order.notes && (
                    <p className="text-slate-500 text-sm mt-3 italic">Note: {order.notes}</p>
                  )}
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-medium text-slate-900 mb-2 text-sm">
                    <CreditCard className="h-4 w-4 text-slate-500" /> Payment Info
                  </h4>
                  <p className="text-slate-600 text-sm capitalize">{order.paymentMethod?.replace('_', ' ') || 'Not specified'}</p>
                  {order.paystackRef && (
                    <p className="text-slate-500 text-xs mt-1 font-mono break-all">Ref: {order.paystackRef}</p>
                  )}
                </div>
              </div>

              {/* Review Section */}
              {order.status === 'delivered' && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  {order.review ? (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Your Review</h4>
                      <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                        <div className="flex mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`h-4 w-4 ${star <= order.review!.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                          ))}
                        </div>
                        <p className="text-slate-700 text-sm italic">"{order.review.remark}"</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">How was your delivery?</h4>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                              <Star className={`h-8 w-8 ${star <= reviewRating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                            </button>
                          ))}
                        </div>
                        <Textarea 
                          placeholder="Tell us about your experience (optional)" 
                          value={reviewRemark}
                          onChange={(e) => setReviewRemark(e.target.value)}
                          className="bg-white"
                        />
                        <Button 
                          onClick={handleReviewSubmit} 
                          disabled={createReview.isPending}
                        >
                          {createReview.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Review'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
