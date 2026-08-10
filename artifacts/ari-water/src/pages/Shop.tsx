import React, { useState, useEffect, useRef } from 'react';
import {
  useListProducts,
  useCreateOrder,
  useInitializePayment,
  useVerifyPayment,
} from '@workspace/api-client-react';
import { useCart, CartItem } from '@/lib/cart-context';
import { useUser } from '@clerk/clerk-react';
import { formatKes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Smartphone,
  XCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// ── M-Pesa payment state ──────────────────────────────────────────────────────

type MpesaStatus = 'idle' | 'pending' | 'success' | 'failed';

// Phone number validation helper
const isValidKenyanPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  if (cleaned.startsWith('0')) {
    return /^0[17]\d{8}$/.test(cleaned);
  }
  if (cleaned.startsWith('254')) {
    return /^254[17]\d{8}$/.test(cleaned);
  }
  return false;
};

export default function Shop() {
  const { data: products, isLoading } = useListProducts({ inStock: 'true' as any });
  const { items, addToCart, removeFromCart, updateQuantity, totalKes, totalItems, clearCart } =
    useCart();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details'>('cart');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState(user?.primaryPhoneNumber?.phoneNumber || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'pay_later'>('mpesa');
  
  // Guest checkout fields
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');

  // Calculate cart total (client-side for display, server will validate)
  const cartSubtotalKes = items.reduce(
    (sum, item) => sum + Math.round(Number(item.unitPriceKes) * Number(item.quantity)),
    0,
  );

  // Sync form fields when Clerk user loads
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName || '');
      if (!customerEmail) setCustomerEmail(user.primaryEmailAddress?.emailAddress || '');
      if (!phone) setPhone(user.primaryPhoneNumber?.phoneNumber || '');
    }
  }, [user, customerName, customerEmail, phone]);

  // M-Pesa STK push state
  const [mpesaRef, setMpesaRef] = useState<string | null>(null);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [orderTotalKes, setOrderTotalKes] = useState<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const createOrder = useCreateOrder();
  const initPayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-poll when M-Pesa STK push is pending
  useEffect(() => {
    if (!mpesaRef || mpesaStatus !== 'pending') return;

    // Poll every 5 seconds using GET status endpoint (source of truth: DB)
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${mpesaRef}/status`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // If payment not found, stop polling and show error
          if (response.status === 404) {
            setMpesaStatus('failed');
            setMpesaMessage(errorData.message || 'Payment record not found. Please try again.');
            if (pollRef.current) clearInterval(pollRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
          }
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const res = await response.json();
        
        if (res.status === 'success') {
          setMpesaStatus('success');
          setMpesaMessage('Payment completed successfully! Your order is confirmed.');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else if (res.status === 'failed') {
          setMpesaStatus('failed');
          setMpesaMessage(res.message || 'Payment was declined or cancelled.');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
        // status === 'pending' → keep polling
      } catch (error) {
        console.error('Payment verification error:', error);
        // Don't stop polling on network errors - might be transient
        retryCountRef.current += 1;
        if (retryCountRef.current >= MAX_RETRIES) {
          setMpesaStatus('failed');
          setMpesaMessage('Unable to verify payment status. Please check your orders page.');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      }
    }, 5000);

    // Timeout after 3 minutes
    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (mpesaStatus === 'pending') {
        setMpesaStatus('failed');
        setMpesaMessage('The payment request timed out. Please check your orders and try again.');
      }
    }, 3 * 60 * 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpesaRef, mpesaStatus]);

  const handleAddToCart = (product: any) => {
    if (!product || !product.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid product data.',
      });
      return;
    }
    addToCart({
      productId: product.id,
      productName: product.name || 'Unknown Product',
      packSize: product.packSize || '',
      unitPriceKes: product.priceKes || 0,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    toast({
      title: 'Added to cart',
      description: `${product.name || 'Product'} has been added to your cart.`,
      duration: 2000,
    });
  };

  const handlePlaceOrder = () => {
    // For guest checkout, require name and email
    if (!user && (!customerName.trim() || !customerEmail.trim())) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide your name and email.',
      });
      return;
    }

    if (!deliveryAddress.trim() || !phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a delivery address and phone number.',
      });
      return;
    }

    // Validate phone number format
    if (!isValidKenyanPhone(phone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid phone number',
        description: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678).',
      });
      return;
    }

    createOrder.mutate(
      {
        data: {
          customerName: user?.fullName || customerName,
          customerEmail: user?.primaryEmailAddress?.emailAddress || customerEmail,
          deliveryAddress,
          phone,
          notes,
          paymentMethod: paymentMethod === 'mpesa' ? 'mpesa' : 'pay_later',
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setTicketNumber(order.ticketNumber || '');
          setCurrentOrderId(order.id); // Store order ID for receipt generation
          // Use server-calculated total from order
          setOrderTotalKes(order.totalKes || 0);

          // Only initiate payment if M-Pesa is selected
          if (paymentMethod === 'mpesa') {
            // Initiate Lipana M-Pesa STK push
            initPayment.mutate(
              { data: { orderId: order.id } },
              {
                onSuccess: (res) => {
                  setMpesaRef(res.reference);
                  setMpesaStatus('pending');
                  const requestedAmount = res.amountKes ?? orderTotalKes;
                  setMpesaMessage(
                    `${(res as any).message || 'An M-Pesa payment prompt has been sent to your phone. Enter your PIN to complete.'} Amount requested: ${formatKes(requestedAmount)}.`,
                  );
                },
                onError: (error: unknown) => {
                  const message =
                    typeof error === 'object' &&
                    error &&
                    'message' in error &&
                    typeof (error as { message?: unknown }).message === 'string'
                      ? (error as { message: string }).message
                      : 'M-Pesa prompt could not be sent.';

                  setMpesaStatus('failed');
                  setMpesaMessage(
                    `${message} Your order was created; you can retry payment from the order tracker.`,
                  );
                  toast({
                    variant: 'destructive',
                    title: 'Payment could not start',
                    description: message,
                  });
                },
              },
            );
          } else {
            // Pay later - just show success message
            setMpesaStatus('success');
            setMpesaMessage(
              `Order placed successfully! Your ticket number is ${order.ticketNumber}. You can pay later from your orders page.`,
            );
            toast({
              title: 'Order placed successfully',
              description: `Ticket: ${order.ticketNumber}. You can pay later.`,
            });
          }
        },
        onError: (error: unknown) => {
          const errorMessage =
            typeof error === 'object' &&
            error &&
            'error' in error &&
            typeof (error as { error?: unknown }).error === 'string'
              ? (error as { error: string }).error
              : 'Something went wrong placing your order.';

          toast({
            variant: 'destructive',
            title: 'Could not place order',
            description: errorMessage,
          });
        },
      },
    );
  };

  const isProcessing = createOrder.isPending || initPayment.isPending;

  return (
    <>
      {/* Shop Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Grid */}
          <div className={`flex-1 transition-all ${totalItems > 0 ? 'lg:w-2/3' : 'w-full'}`}>
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-slate-900">Shop Water</h1>
              <p className="text-slate-600 mt-2">Premium purified water, delivered to your door.</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden border-slate-100 shadow-sm">
                    <div className="h-48 bg-slate-100 animate-pulse" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-5 w-1/2" />
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : !products || !Array.isArray(products) || products.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No products available</h3>
                <p className="text-slate-500">We are currently out of stock. Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                  >
                    <div className="relative h-56 bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-200 rounded animate-pulse" />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur text-primary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {product.packSize}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-slate-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                      <div className="mt-auto">
                        <span className="text-xl font-bold text-primary">{formatKes(product.priceKes)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-5 pt-0">
                      <Button className="w-full" onClick={() => handleAddToCart(product)}>
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          {totalItems > 0 && (
            <div className="lg:w-1/3 w-full">
              <div className="sticky top-25">
                <Card className="border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-900 px-6 py-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" /> Your Cart ({totalItems})
                    </h2>
                  </div>

                  {checkoutStep === 'cart' ? (
                    <>
                      <CardContent className="p-0">
                        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
                          {items.map((item) => (
                            <div key={item.productId} className="p-4 flex gap-4">
                              <div className="h-16 w-16 bg-slate-50 rounded-md shrink-0 flex items-center justify-center p-2">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="h-full w-full object-contain mix-blend-multiply"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-slate-200 rounded" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{item.productName}</h4>
                                <p className="text-xs text-slate-500">{item.packSize}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-1 border border-slate-200 rounded-md">
                                    <button
                                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors"
                                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                    <button
                                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition-colors"
                                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <span className="font-bold text-sm text-slate-900">
                                    {formatKes(item.unitPriceKes * item.quantity)}
                                  </span>
                                </div>
                              </div>
                              <button
                                className="self-start p-1 text-slate-400 hover:text-destructive transition-colors"
                                onClick={() => removeFromCart(item.productId)}
                                aria-label={`Remove ${item.productName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="p-5 bg-slate-50 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="font-medium">{formatKes(totalKes)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Delivery</span>
                            <span className="text-green-600 font-medium">Calculated at checkout</span>
                          </div>
                          <div className="border-t border-slate-200 pt-3 flex justify-between">
                            <span className="font-bold text-slate-900">Total</span>
                            <span className="font-bold text-lg text-slate-900">{formatKes(totalKes)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-5 pt-0 bg-slate-50">
                        <Button
                          className="w-full h-11 text-base font-semibold"
                          onClick={() => setCheckoutStep('details')}
                        >
                          Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    <>
                      <CardContent className="p-5 space-y-5">
                        {/* Customer Details (for guest checkout) */}
                        {!user && (
                          <div className="space-y-3 border-b border-slate-100 pb-5">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                              <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">1</span>
                              Your Details
                            </h3>
                            <div className="space-y-1">
                              <Label htmlFor="customerName" className="text-xs">Full Name</Label>
                              <Input
                                id="customerName"
                                placeholder="e.g. John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="customerEmail" className="text-xs">Email Address</Label>
                              <Input
                                id="customerEmail"
                                type="email"
                                placeholder="e.g. john@example.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Delivery Details */}
                        <div className={`space-y-3 ${!user ? 'border-b border-slate-100 pb-5' : ''}`}>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                            <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">{!user ? '2' : '1'}</span>
                            Delivery Details
                          </h3>
                          <div className="space-y-1">
                            <Label htmlFor="address" className="text-xs">Delivery Address</Label>
                            <Input
                              id="address"
                              placeholder="e.g. Apartment 4B, Kilimani"
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder="e.g. 0712 345 678"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="notes" className="text-xs">Delivery Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="e.g. Call upon arrival"
                              rows={2}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                            <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">{!user ? '3' : '2'}</span>
                            Payment Method
                          </h3>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('mpesa')}
                              className={`flex items-center space-x-3 border p-3.5 rounded-xl w-full transition-colors ${
                                paymentMethod === 'mpesa'
                                  ? 'border-primary bg-primary/5'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm text-slate-900">M-Pesa</p>
                                <p className="text-xs text-slate-500">STK push to your phone</p>
                              </div>
                              {paymentMethod === 'mpesa' && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('pay_later')}
                              className={`flex items-center space-x-3 border p-3.5 rounded-xl w-full transition-colors ${
                                paymentMethod === 'pay_later'
                                  ? 'border-primary bg-primary/5'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <Clock className="h-4 w-4 shrink-0 text-primary" />
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm text-slate-900">Pay Later</p>
                                <p className="text-xs text-slate-500">Pay after delivery or from orders page</p>
                              </div>
                              {paymentMethod === 'pay_later' && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-5 bg-slate-50 flex-col gap-3">
                        <div className="w-full flex justify-between items-center">
                          <span className="font-medium text-slate-600 text-sm">Total to pay:</span>
                          <span className="font-bold text-xl text-slate-900">{formatKes(cartSubtotalKes)}</span>
                        </div>
                        <Button
                          className="w-full h-11 text-base font-semibold"
                          onClick={handlePlaceOrder}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing…</>
                          ) : (
                            <><CheckCircle2 className="mr-2 h-5 w-5" /> Place Order</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-slate-500 text-sm"
                          onClick={() => setCheckoutStep('cart')}
                          disabled={isProcessing}
                        >
                          ← Back to Cart
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── M-Pesa STK Push Modal ─────────────────────────────────────────────── */}
      {mpesaStatus !== 'idle' && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="M-Pesa payment"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
            {mpesaStatus === 'pending' && (
              <div className="p-6 sm:p-8 text-center space-y-5">
                {/* M-Pesa icon */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto bg-[#00A651]/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-[#00A651]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Check Your Phone</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    An M-Pesa payment prompt has been sent to{' '}
                    <strong className="text-slate-900">{phone}</strong>. Enter your M-Pesa PIN to
                    confirm the payment of{' '}
                    <strong className="text-primary">{formatKes(orderTotalKes)}</strong>.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span>Waiting for confirmation…</span>
                </div>
                <p className="text-xs text-slate-400">
                  Didn't receive a prompt?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      if (pollRef.current) clearInterval(pollRef.current);
                      if (timeoutRef.current) clearTimeout(timeoutRef.current);
                      setMpesaStatus('idle');
                      setMpesaRef(null);
                      setLocation('/track?ticket=' + ticketNumber);
                    }}
                  >
                    Pay later / Track Order
                  </button>
                </p>
              </div>
            )}

            {mpesaStatus === 'success' && (
              <div className="p-6 sm:p-8 text-center space-y-5">
                <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-2">Payment Received!</h3>
                  <p className="text-slate-600 text-sm">
                    Your order is confirmed. We will begin processing it shortly.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      // Download PDF receipt from server
                      const receiptUrl = `/api/receipts/${currentOrderId}/download`;
                      const a = document.createElement('a');
                      a.href = receiptUrl;
                      a.download = `receipt-${ticketNumber}.pdf`;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="w-full"
                    disabled={!currentOrderId}
                  >
                    Download Receipt (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/track?ticket=' + ticketNumber)}
                    className="w-full"
                  >
                    Track Order (Ticket: {ticketNumber})
                  </Button>
                </div>
              </div>
            )}

            {mpesaStatus === 'failed' && (
              <div className="p-6 sm:p-8 text-center space-y-5">
                <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-red-700 mb-2">Payment Failed</h3>
                  <p className="text-slate-600 text-sm">{mpesaMessage}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setMpesaStatus('idle');
                      setMpesaRef(null);
                      setMpesaMessage('');
                      retryCountRef.current = 0;
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMpesaStatus('idle');
                      setMpesaRef(null);
                      setLocation('/track?ticket=' + ticketNumber);
                    }}
                  >
                    Track Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
