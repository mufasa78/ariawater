import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Share2, BarChart2, Link2, CheckCircle2, XCircle, Copy,
  Globe, Twitter, Linkedin, MessageSquare, Tag, TrendingUp, Target,
  AlertCircle, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gaConfigured, gaMeasurementId } from '@/lib/analytics';

// ── SEO Checklist ─────────────────────────────────────────────────────────────
const SEO_CHECKS = [
  { label: 'Title tag set', ok: true, detail: 'Ari Water | Premium Water Delivery in Nairobi, Kenya' },
  { label: 'Meta description set', ok: true, detail: '155 characters — well within limit' },
  { label: 'Open Graph tags', ok: true, detail: 'og:title, og:description, og:image all present' },
  { label: 'Twitter card', ok: true, detail: 'summary_large_image configured' },
  { label: 'JSON-LD structured data', ok: true, detail: 'LocalBusiness, FAQPage, Product schemas' },
  { label: 'robots.txt', ok: true, detail: '/robots.txt — crawlable, admin protected' },
  { label: 'sitemap.xml', ok: true, detail: '/sitemap.xml — 4 URLs indexed' },
  { label: 'Canonical URL', ok: true, detail: 'https://ariwater.co.ke/' },
  { label: 'Geo meta tags', ok: true, detail: 'Nairobi, Kenya (-1.286389, 36.817223)' },
  { label: 'Google Analytics 4', ok: gaConfigured, detail: gaConfigured ? `Tracking ID: ${gaMeasurementId}` : 'Set VITE_GA_MEASUREMENT_ID to activate' },
];

// ── B2B Target Segments ───────────────────────────────────────────────────────
const TARGET_SEGMENTS = [
  { label: 'Offices & Corporates', keywords: ['office water delivery Nairobi', 'corporate water supply Kenya', 'water dispenser hire office'], icon: '🏢' },
  { label: 'Events & Conferences', keywords: ['event water supply Nairobi', 'conference drinking water Kenya', 'wedding water catering Kenya'], icon: '🎪' },
  { label: 'Institutions', keywords: ['school water delivery Kenya', 'hospital water supply Nairobi', 'church event water Kenya'], icon: '🏫' },
  { label: 'Hospitality', keywords: ['hotel water supply Nairobi', 'restaurant bottled water Kenya', 'catering water supplier'], icon: '🏨' },
  { label: 'Bulk & Wholesale', keywords: ['bulk water supplier Kenya', '20L water refill Nairobi', 'wholesale bottled water Kenya'], icon: '📦' },
];

// ── UTM Builder ───────────────────────────────────────────────────────────────
function UTMBuilder() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    source: 'whatsapp',
    medium: 'social',
    campaign: '',
    content: '',
    term: '',
  });

  const base = 'https://ariwater.co.ke/';
  const params = new URLSearchParams();
  if (form.source) params.set('utm_source', form.source);
  if (form.medium) params.set('utm_medium', form.medium);
  if (form.campaign) params.set('utm_campaign', form.campaign);
  if (form.content) params.set('utm_content', form.content);
  if (form.term) params.set('utm_term', form.term);
  const generatedUrl = `${base}?${params.toString()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({ title: 'Link copied!' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Source *</Label>
          <Select value={form.source} onValueChange={(v) => setForm(p => ({ ...p, source: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Medium *</Label>
          <Select value={form.medium} onValueChange={(v) => setForm(p => ({ ...p, medium: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="cpc">CPC / Paid</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="organic">Organic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Campaign Name *</Label>
        <Input className="h-9" placeholder="e.g. nairobi-offices-july" value={form.campaign} onChange={(e) => setForm(p => ({ ...p, campaign: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Content (optional)</Label>
          <Input className="h-9" placeholder="e.g. banner-blue" value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Keyword (optional)</Label>
          <Input className="h-9" placeholder="e.g. office water" value={form.term} onChange={(e) => setForm(p => ({ ...p, term: e.target.value }))} />
        </div>
      </div>
      <div className="mt-2 p-3 bg-slate-50 border rounded-lg flex items-center gap-2">
        <code className="text-xs text-slate-700 flex-1 truncate break-all">{generatedUrl}</code>
        <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Search Preview ────────────────────────────────────────────────────────────
function SearchPreview() {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Google Search Preview</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">A</div>
          <div>
            <p className="text-xs text-slate-500">ariwater.co.ke</p>
          </div>
        </div>
        <a className="text-[#1a0dab] text-lg font-medium hover:underline block leading-tight">
          Ari Water | Premium Water Delivery in Nairobi, Kenya
        </a>
        <p className="text-sm text-slate-600 leading-snug">
          Ari Water delivers crisp, purified bottled water to offices, events, organisations and homes across Nairobi. Order 500ml, 1L, 5L, 10L or 20L — <strong>fast delivery</strong>, competitive prices.
        </p>
      </div>
    </div>
  );
}

// ── Social Preview ────────────────────────────────────────────────────────────
function SocialPreview() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      <div className="h-28 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white text-4xl font-bold">
        💧 Ari Water
      </div>
      <div className="p-3 bg-white border-t">
        <p className="text-xs text-slate-400 uppercase">ariwater.co.ke</p>
        <p className="font-semibold text-sm text-slate-900">Ari Water — Premium Water Delivery in Nairobi</p>
        <p className="text-xs text-slate-500 mt-0.5">Pure, refreshing drinking water delivered to your office, event or home across Nairobi.</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMarketing() {
  const seoScore = Math.round((SEO_CHECKS.filter(c => c.ok).length / SEO_CHECKS.length) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Marketing</h1>
        <p className="text-slate-500">SEO health, social previews, campaign tracking and B2B targeting.</p>
      </div>

      {/* Top row: SEO Score + Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SEO Score */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${seoScore >= 80 ? 'border-green-500 text-green-600' : seoScore >= 60 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'}`}>
              {seoScore}%
            </div>
            <p className="font-semibold text-slate-900">SEO Score</p>
            <p className="text-xs text-slate-500 text-center">{SEO_CHECKS.filter(c => c.ok).length} of {SEO_CHECKS.length} checks passing</p>
          </CardContent>
        </Card>

        {/* Analytics Status */}
        <Card className={`border-slate-200 shadow-sm ${!gaConfigured ? 'border-amber-200' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Google Analytics 4
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gaConfigured ? (
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                <p className="text-xs text-slate-600">Tracking ID: <code className="bg-slate-100 px-1 rounded">{gaMeasurementId}</code></p>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open('https://analytics.google.com/', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open GA4 Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-amber-100 text-amber-700 border-0">Not configured</Badge>
                <p className="text-xs text-slate-600">Set <code className="bg-slate-100 px-1 rounded">VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX</code> in your environment variables to activate tracking.</p>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open('https://analytics.google.com/', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Set up GA4
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Google Search Console', href: 'https://search.google.com/search-console/', icon: Search },
              { label: 'Google My Business', href: 'https://business.google.com/', icon: Globe },
              { label: 'WhatsApp Business', href: 'https://business.whatsapp.com/', icon: MessageSquare },
              { label: 'LinkedIn Company', href: 'https://www.linkedin.com/', icon: Linkedin },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <link.icon className="h-3.5 w-3.5" /> {link.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Checklist */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> SEO Checklist
            </CardTitle>
            <CardDescription>Technical and on-page optimisation status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SEO_CHECKS.map(check => (
                <div key={check.label} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  {check.ok
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{check.label}</p>
                    <p className="text-xs text-slate-500 truncate">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Previews */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" /> Search Snippet Preview
              </CardTitle>
            </CardHeader>
            <CardContent><SearchPreview /></CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Social / WhatsApp Preview
              </CardTitle>
            </CardHeader>
            <CardContent><SocialPreview /></CardContent>
          </Card>
        </div>
      </div>

      {/* UTM Builder */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> UTM Campaign Builder
          </CardTitle>
          <CardDescription>Build trackable links for WhatsApp, SMS, email and paid campaigns</CardDescription>
        </CardHeader>
        <CardContent><UTMBuilder /></CardContent>
      </Card>

      {/* B2B Target Segments */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> B2B Target Keywords
          </CardTitle>
          <CardDescription>
            High-intent search terms across your key customer segments in Nairobi &amp; Kenya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TARGET_SEGMENTS.map(segment => (
              <div key={segment.label} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{segment.icon}</span>
                  <p className="font-semibold text-sm text-slate-900">{segment.label}</p>
                </div>
                <div className="space-y-1.5">
                  {segment.keywords.map(kw => (
                    <div key={kw} className="flex items-center gap-2">
                      <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                      <code className="text-xs text-slate-600">{kw}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Register on <strong>Google My Business</strong> with these keywords in your business description to appear in local "near me" searches. Contact Google Search Console to submit your sitemap for faster indexing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
