import React, { useState } from 'react';
import { useGetDashboardSummary, useGetRevenueTrend, useGetRecentOrders } from '@workspace/api-client-react';
import { formatKes, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Receipt, Download, TrendingUp, DollarSign, Calculator, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── KRA VAT constants (Kenya Revenue Authority) ───────────────────────────────
const VAT_RATE = 0.16;           // 16% standard rate
const VAT_FACTOR = VAT_RATE / (1 + VAT_RATE); // 16/116 — extract VAT from inclusive price

function extractVat(inclusiveAmount: number) {
  const vat = inclusiveAmount * VAT_FACTOR;
  return { vat: Math.round(vat), net: Math.round(inclusiveAmount - vat) };
}

// ── CSV export ────────────────────────────────────────────────────────────────
function downloadCSV(rows: string[][], filename: string) {
  const content = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ── KRA Compliance Checklist ──────────────────────────────────────────────────
const KRA_CHECKS = [
  { label: 'VAT registration (if turnover > KES 5M/year)', ok: false, note: 'Apply via iTax portal if applicable' },
  { label: 'Product VAT classification set', ok: true, note: 'Standard 16%, Zero-rated 0%, or Exempt' },
  { label: 'VAT-inclusive pricing displayed to customers', ok: true, note: 'All prices shown include 16% VAT' },
  { label: 'Tax invoices issued for B2B transactions', ok: false, note: 'Enable ETR (Electronic Tax Register) integration' },
  { label: 'Monthly VAT returns filing (20th of next month)', ok: false, note: 'File via iTax: itax.kra.go.ke' },
  { label: 'PIN certificate displayed', ok: false, note: 'Display KRA PIN on all tax invoices' },
];

export default function AdminAccounting() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: loadingTrends } = useGetRevenueTrend();
  const { data: recentOrders } = useGetRecentOrders();
  const [period, setPeriod] = useState<'today' | 'week' | 'total'>('total');

  if (loadingSummary || !summary) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading accounting data…</div>;
  }

  const gross = period === 'today' ? summary.todayRevenue : period === 'week' ? summary.weekRevenue : summary.totalRevenue;
  const orders = period === 'today' ? summary.todayOrders : period === 'week' ? summary.weekOrders : summary.totalOrders;
  const { vat, net } = extractVat(gross);

  // Build monthly VAT return data from trend (last 30 days → group by month)
  const monthlyData: Record<string, { gross: number; vat: number; net: number }> = {};
  (trends ?? []).forEach(point => {
    const month = point.date.slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { gross: 0, vat: 0, net: 0 };
    const { vat: v, net: n } = extractVat(point.revenue);
    monthlyData[month].gross += point.revenue;
    monthlyData[month].vat += v;
    monthlyData[month].net += n;
  });
  const monthlyRows = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, ...d }));

  // Chart data — show net vs VAT stacked
  const chartData = monthlyRows.map(r => ({
    month: new Date(r.month + '-01').toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
    'Net (excl. VAT)': r.net,
    'VAT (16%)': r.vat,
  }));

  const handleExportVAT = () => {
    const headers = ['Month', 'Gross Revenue (KES)', 'Net Revenue excl. VAT (KES)', 'Output VAT 16% (KES)', 'Orders'];
    const rows = monthlyRows.map(r => [r.month, String(r.gross), String(r.net), String(r.vat), '—']);
    downloadCSV([headers, ...rows], `ari-water-vat-return-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportOrders = () => {
    const headers = ['Order ID', 'Customer', 'Date', 'Amount (KES)', 'Net excl. VAT', 'VAT 16%', 'Payment Status'];
    const rows = (recentOrders ?? []).map(o => {
      const { vat: v, net: n } = extractVat(o.totalKes);
      return [o.id, o.customerName ?? '', formatDate(o.createdAt), String(o.totalKes), String(n), String(v), o.paymentStatus];
    });
    downloadCSV([headers, ...rows], `ari-water-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Accounting</h1>
          <p className="text-slate-500">Revenue, VAT (KRA), and financial reporting for Aritwin Limited.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="total">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue (VAT-incl.)', value: formatKes(gross), sub: `${orders} orders`, icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
          { label: 'Net Revenue (excl. VAT)', value: formatKes(net), sub: 'Revenue before VAT', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Output VAT (16%)', value: formatKes(vat), sub: 'Payable to KRA', icon: Calculator, color: 'text-orange-600 bg-orange-50' },
          { label: 'VAT Rate Applied', value: '16%', sub: 'Standard rate (KRA)', icon: Receipt, color: 'text-purple-600 bg-purple-50' },
        ].map(card => (
          <Card key={card.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-400">{card.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
            <CardDescription>Net revenue vs. VAT collected per month</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportVAT}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> VAT Return CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportOrders}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Orders CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTrends || chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatKes(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="Net (excl. VAT)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="VAT (16%)" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* VAT Filing Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> VAT Filing Summary
          </CardTitle>
          <CardDescription>
            Monthly output VAT for KRA returns — file by the 20th of the following month via{' '}
            <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">iTax</a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Month</th>
                  <th className="px-4 py-3">Gross Revenue</th>
                  <th className="px-4 py-3">Net (excl. VAT)</th>
                  <th className="px-4 py-3">Output VAT 16%</th>
                  <th className="px-4 py-3 rounded-tr-lg">Filing Deadline</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">No revenue data yet</td>
                  </tr>
                ) : monthlyRows.map(row => {
                  const [year, month] = row.month.split('-').map(Number);
                  const deadline = new Date(year, month, 20).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
                  const isPast = new Date(year, month, 20) < new Date();
                  return (
                    <tr key={row.month} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {new Date(row.month + '-01').toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatKes(row.gross)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatKes(row.net)}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{formatKes(row.vat)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={isPast ? 'text-slate-500' : 'text-amber-600 border-amber-300 bg-amber-50'}>
                          {deadline}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KRA Compliance Checklist */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" /> KRA Compliance Checklist
          </CardTitle>
          <CardDescription>Kenya Revenue Authority requirements for VAT-registered businesses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {KRA_CHECKS.map(check => (
              <div key={check.label} className={`flex items-start gap-3 p-3 rounded-lg border ${check.ok ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                {check.ok
                  ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-medium text-slate-900">{check.label}</p>
                  <p className="text-xs text-slate-600">{check.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              <strong>KRA VAT registration</strong> is required when annual turnover exceeds <strong>KES 5,000,000</strong>.
              Register via <a href="https://itax.kra.go.ke" target="_blank" rel="noopener noreferrer" className="underline font-medium">iTax portal</a>.
              For VAT-registered businesses, retain all tax invoices for <strong>5 years</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
