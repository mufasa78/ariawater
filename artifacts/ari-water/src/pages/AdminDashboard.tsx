import React from 'react';
import { useGetDashboardSummary, useGetRevenueTrend, useGetRecentOrders } from '@workspace/api-client-react';
import { formatKes, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends, error: trendsError } = useGetRevenueTrend();
  const { data: recentOrders, isLoading: isLoadingOrders, error: ordersError } = useGetRecentOrders();

  // Show error state if any API call fails
  if (summaryError || trendsError || ordersError) {
    const errorMessage = (summaryError || trendsError || ordersError) as any;
    return (
      <div className="p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Dashboard Error</h2>
          <p className="text-red-700 mb-4">
            Failed to load dashboard data. {errorMessage?.message || 'Unknown error'}
          </p>
          <div className="bg-white p-4 rounded border border-red-100 text-sm">
            <p className="font-semibold text-slate-700 mb-2">Possible causes:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>You may not be logged in as an admin user</li>
              <li>Your account may not have admin permissions</li>
              <li>API connection issue</li>
            </ul>
          </div>
          <div className="mt-4 flex gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
            <Link href="/login" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
              Go to Login
            </Link>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          <p>For admin access, ensure your account has the admin role configured in Clerk.</p>
        </div>
      </div>
    );
  }

  if (isLoadingSummary || !summary) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatKes(summary.todayRevenue),
      icon: DollarSign,
      subtext: `${summary.todayOrders} orders today`,
    },
    {
      title: "This Week",
      value: formatKes(summary.weekRevenue),
      icon: TrendingUp,
      subtext: `${summary.weekOrders} orders this week`,
    },
    {
      title: "Total Revenue",
      value: formatKes(summary.totalRevenue),
      icon: Activity,
      subtext: `${summary.totalOrders} total orders`,
    },
    {
      title: "Low Stock Alerts",
      value: summary.lowStockProducts.toString(),
      icon: AlertTriangle,
      subtext: "Products needing refill",
      alert: summary.lowStockProducts > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back. Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className={`border-slate-200 shadow-sm ${stat.alert ? 'border-amber-200 bg-amber-50/30' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <div className={`p-2 rounded-md ${stat.alert ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-2xl font-bold tracking-tight ${stat.alert ? 'text-amber-600' : 'text-slate-900'}`}>
                  {stat.value}
                </span>
                <p className="text-xs text-slate-500">{stat.subtext}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Trend (30 Days)</CardTitle>
            <CardDescription>Daily revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoadingTrends ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-md" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => `Ksh ${val/1000}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatKes(value), 'Revenue']}
                      labelFormatter={(label) => formatDate(label as string)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card className="col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Received', value: summary.ordersByStatus.received, color: 'bg-blue-500' },
                { label: 'Processing', value: summary.ordersByStatus.processing, color: 'bg-amber-500' },
                { label: 'Dispatched', value: summary.ordersByStatus.dispatched, color: 'bg-purple-500' },
                { label: 'Delivered', value: summary.ordersByStatus.delivered, color: 'bg-green-500' },
              ].map(status => (
                <div key={status.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className="text-sm font-medium text-slate-700">{status.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{status.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders needing attention</CardDescription>
          </div>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg">Payment</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOrders ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading orders...</td></tr>
                ) : !recentOrders || recentOrders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">No recent orders</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-medium text-slate-900">#{order.id}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{order.customerName}</div>
                        {order.customerEmail && <div className="text-xs text-slate-500">{order.customerEmail}</div>}
                      </td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4 text-slate-600">{order.itemCount}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{formatKes(order.totalKes)}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={`${getStatusColor(order.status)} border-0`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-500' : order.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <span className="capitalize text-slate-600">{order.paymentStatus}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
