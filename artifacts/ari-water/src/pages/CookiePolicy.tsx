import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-slate-900 to-primary px-6 py-10 sm:px-10">
          <h1 className="font-display text-4xl font-bold text-white">Cookie Policy</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
            This page explains how Ari Water uses cookies and similar technologies on our website.
          </p>
        </div>

        <div className="space-y-10 px-6 py-10 text-slate-700 sm:px-10 sm:py-12">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">What are cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help the site remember choices, keep you signed in, and improve performance.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Types we use</h2>
            <p>We use essential cookies for authentication, session management, and basic site functionality. We also use analytics cookies to understand how visitors use the site so we can improve it.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Your choices</h2>
            <p>You can accept or decline cookies using the banner shown on the site. You can also clear cookies from your browser settings at any time, but some features may not work as expected.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
            <p>If you have questions about our cookie use, contact us at aritwinlimited@gmail.com.</p>
          </section>

          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <Link href="/privacy">
              <Button variant="outline" className="text-slate-700">Privacy Policy</Button>
            </Link>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
