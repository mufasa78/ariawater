import React, { useState, useEffect, useRef } from 'react';
import {
  useListProducts,
  useCreateOrder,
  useInitializePayment,
  useVerifyPayment,
} from '@workspace/api-client-react';
import { useCart, CartItem } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatKes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  CreditCard,
  Building2,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// ── M-Pesa payment state ──────────────────────────────────────────────────────

type MpesaStatus = 'idle' | 'pending' | 'success' | 'failed';

export default function Shop() {
  const { data: products, isLoading } = useListProducts({ inStock: 'true' });
  const { items, addToCart, removeFromCart, updateQuantity, totalKes, totalItems, clearCart } =
    useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details'>('cart');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'bank_transfer'>('mpesa');

  // M-Pesa STK push state
  const [mpesaRef, setMpesaRef] = useState<string | null>(null);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Poll every 5 seconds
    pollRef.current = setInterval(() => {
      verifyPayment.mutate(
        { data: { reference: mpesaRef } },
        {
          onSuccess: (res) => {
            if (res.status === 'success') {
              setMpesaStatus('success');
              if (pollRef.current) clearInterval(pollRef.current);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setTimeout(() => setLocation('/orders'), 2200);
            } else if (res.status === 'failed') {
              setMpesaStatus('failed');
              setMpesaMessage(res.message || 'Payment was declined or cancelled.');
              if (pollRef.current) clearInterval(pollRef.current);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }
            // status === 'pending' → keep polling
          },
        },
      );
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
    addToCart({
      productId: product.id,
      productName: product.name,
      packSize: product.packSize,
      unitPriceKes: product.priceKes,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
      duration: 2000,
    });
  };

  const handlePlaceOrder = () => {
    if (!user) {
      toast({ title: 'Please log in to continue', description: 'You need an account to place an order.' });
      setLocation('/login');
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

    createOrder.mutate(
      {
        data: {
          deliveryAddress,
          phone,
          notes,
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();

          if (paymentMethod === 'mpesa') {
            // Initiate Lipana M-Pesa STK push
            initPayment.mutate(
              { data: { orderId: order.id } },
              {
                onSuccess: (res) => {
                  setMpesaRef(res.reference);
                  setMpesaStatus('pending');
                  setMpesaMessage(
                    res.message ||
                      'An M-Pesa payment prompt has been sent to your phone. Enter your PIN to complete.',
                  );
                },
                onError: () => {
                  // Order was placed; payment initiation failed — let them go to orders
                  toast({
                    title: 'Order placed!',
                    description: 'M-Pesa prompt could not be sent. You can complete payment from your orders page.',
                  });
                  setLocation('/orders');
                },
              },
            );
          } else if (paymentMethod === 'card') {
            initPayment.mutate(
              { data: { orderId: order.id } },
              {
                onSuccess: (res) => {
                  window.location.href = res.authorizationUrl;
                },
                onError: () => {
                  toast({
                    variant: 'destructive',
                    title: 'Payment initialisation failed',
                    description:
                      'Your order was placed but we could not start the card payment. Check your orders page.',
                  });
                  setLocation('/orders');
                },
              },
            );
          } else {
            // Bank transfer
            toast({
              title: 'Order placed!',
              description:
                'Please complete your bank transfer and we will process your order once payment is confirmed.',
            });
            setLocation('/orders');
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
            ) : products?.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No products available</h3>
                <p className="text-slate-500">We are currently out of stock. Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products?.map((product) => (
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
              <div className="sticky top-[100px]">
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
                              <div className="h-16 w-16 bg-slate-50 rounded-md flex-shrink-0 flex items-center justify-center p-2">
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
                          onClick={() => {
                            if (!user) {
                              toast({ title: 'Please log in to continue' });
                              setLocation('/login');
                            } else {
                              setCheckoutStep('details');
                            }
                          }}
                        >
                          Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    <>
                      <CardContent className="p-5 space-y-5">
                        {/* Delivery Details */}
                        <div className="space-y-3 border-b border-slate-100 pb-5">
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                            <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">1</span>
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
                            <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs">2</span>
                            Payment Method
                          </h3>
                          <RadioGroup
                            value={paymentMethod}
                            onValueChange={(val: any) => setPaymentMethod(val)}
                            className="space-y-2"
                          >
                            {[
                              { value: 'mpesa', label: 'M-Pesa (Recommended)', icon: Smartphone, desc: 'STK push to your phone' },
                              { value: 'card', label: 'Card (Paystack)', icon: CreditCard, desc: 'Visa · Mastercard' },
                              { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'Manual confirmation' },
                            ].map((opt) => (
                              <div
                                key={opt.value}
                                className={`flex items-center space-x-3 border p-3.5 rounded-xl cursor-pointer transition-colors ${
                                  paymentMethod === opt.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => setPaymentMethod(opt.value as any)}
                              >
                                <RadioGroupItem value={opt.value} id={opt.value} />
                                <opt.icon className={`h-4 w-4 shrink-0 ${paymentMethod === opt.value ? 'text-primary' : 'text-slate-400'}`} />
                                <div className="flex-1">
                                  <Label htmlFor={opt.value} className="cursor-pointer font-medium text-sm">
                                    {opt.label}
                                  </Label>
                                  <p className="text-xs text-slate-500">{opt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </CardContent>

                      <CardFooter className="p-5 bg-slate-50 flex-col gap-3">
                        <div className="w-full flex justify-between items-center">
                          <span className="font-medium text-slate-600 text-sm">Total to pay:</span>
                          <span className="font-bold text-xl text-slate-900">{formatKes(totalKes)}</span>
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="M-Pesa payment"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {mpesaStatus === 'pending' && (
              <div className="p-8 text-center space-y-5">
                {/* M-Pesa icon */}
                <div className="h-20 w-20 mx-auto bg-[#00A651]/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-10 w-10 text-[#00A651]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Phone</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    An M-Pesa payment prompt has been sent to{' '}
                    <strong className="text-slate-900">{phone}</strong>. Enter your M-Pesa PIN to
                    confirm the payment of{' '}
                    <strong className="text-primary">{formatKes(totalKes)}</strong>.
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
                      setLocation('/orders');
                    }}
                  >
                    Pay later from your orders
                  </button>
                </p>
              </div>
            )}

            {mpesaStatus === 'success' && (
              <div className="p-8 text-center space-y-5">
                <div className="h-20 w-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Payment Received!</h3>
                  <p className="text-slate-600 text-sm">
                    Your order is confirmed. We will begin processing it shortly. Redirecting to your
                    orders…
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </div>
              </div>
            )}

            {mpesaStatus === 'failed' && (
              <div className="p-8 text-center space-y-5">
                <div className="h-20 w-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-700 mb-2">Payment Failed</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{mpesaMessage}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMpesaStatus('idle');
                      setMpesaRef(null);
                      setLocation('/orders');
                    }}
                  >
                    View Orders
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMpesaStatus('idle');
                      setMpesaRef(null);
                      setCheckoutStep('details');
                    }}
                  >
                    Try Again
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
