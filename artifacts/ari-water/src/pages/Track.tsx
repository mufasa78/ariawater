import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetTrackInfo } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatKes } from '@/lib/utils';
import { format } from 'date-fns';

export default function Track() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTicket = searchParams.get('ticket') || '';

  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [activeTicket, setActiveTicket] = useState(initialTicket);

  const { data: trackInfo, isLoading, error } = useGetTrackInfo(activeTicket, {
    query: {
      enabled: !!activeTicket,
      retry: false,
    } as any
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      setActiveTicket(ticketInput.trim());
    }
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />;
      case 'dispatched':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-slate-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Track Your Order</h1>
        <p className="text-slate-600">Enter your ticket number to view the status of your order and any messages from support.</p>
      </div>

      <Card className="mb-8 shadow-md border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Enter ticket number (e.g., AW-20231024-1234)"
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" className="h-12 px-8" disabled={!ticketInput.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Track'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {activeTicket && (
        <div>
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          )}

          {error && !isLoading && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-10 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-700 mb-2">Ticket Not Found</h3>
                <p className="text-red-600/80">We couldn't find an order with the ticket number "{activeTicket}". Please check the number and try again.</p>
              </CardContent>
            </Card>
          )}

          {trackInfo && !isLoading && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Order Status */}
                <Card className="overflow-hidden shadow-sm border-slate-200">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      {renderStatusIcon(trackInfo.order.status)}
                      Order Status: <span className="capitalize text-primary">{trackInfo.order.status}</span>
                    </h3>
                    <span className="text-sm font-medium px-3 py-1 bg-slate-200 rounded-full text-slate-700">
                      Ticket {trackInfo.ticket.ticketNumber}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6 pb-6 border-b border-slate-100">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Date Placed</p>
                        <p className="font-medium text-slate-900">
                          {format(new Date(trackInfo.order.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                        <p className={`font-medium ${trackInfo.order.paymentStatus === 'completed' ? 'text-green-600' : 'text-amber-600'} capitalize`}>
                          {trackInfo.order.paymentStatus}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total</p>
                        <p className="font-bold text-slate-900">{formatKes(trackInfo.order.totalKes)}</p>
                      </div>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-4">Items Ordered</h4>
                    <div className="space-y-4">
                      {trackInfo.order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="h-12 w-12 bg-slate-100 rounded shrink-0 p-2">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain mix-blend-multiply" />
                            ) : (
                              <div className="h-full w-full bg-slate-200 rounded" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{item.productName}</p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatKes(item.unitPriceKes)}</p>
                          </div>
                          <div className="font-bold text-sm text-slate-900">
                            {formatKes(item.quantity * item.unitPriceKes)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ticket Messages Sidebar */}
              <div className="space-y-6">
                <Card className="shadow-sm border-slate-200 h-full flex flex-col">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-base flex items-center justify-between">
                      Updates
                      <span className={`text-xs px-2 py-1 rounded-full ${trackInfo.ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'} capitalize`}>
                        {trackInfo.ticket.status}
                      </span>
                    </CardTitle>
                    <CardDescription>System and support updates</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto max-h-125">
                    <div className="divide-y divide-slate-100">
                      {trackInfo.ticket.messages.map((msg: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                              msg.sender === 'system' ? 'bg-slate-100 text-slate-600' :
                              msg.sender === 'support' ? 'bg-primary/10 text-primary' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {msg.sender}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
