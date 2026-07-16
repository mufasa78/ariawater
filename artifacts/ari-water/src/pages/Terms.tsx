import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl bg-white shadow-xl rounded-3xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-primary px-6 py-10 sm:px-10">
          <h1 className="text-4xl font-display font-bold text-white">Terms of Use</h1>
          <p className="mt-4 max-w-3xl text-slate-200 text-lg leading-8">
            These terms govern your access to and use of the Ari Water website and services.
          </p>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-12 space-y-10 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Acceptance of Terms</h2>
            <p>By using our website or ordering from Ari Water, you agree to these terms and our privacy policy. If you disagree with any part, please do not use our services.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Service Description</h2>
            <p>Ari Water offers water delivery, bottled water, and event hydration services in Nairobi and surrounding areas. We deliver based on available inventory, order details, and current delivery schedules.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Account Use</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information and promptly notify us of any unauthorized use.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Ordering and Payment</h2>
            <p>Orders are confirmed once payment is completed. We accept payment through the methods presented during checkout. Delivery fees and taxes may apply.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Delivery and Returns</h2>
            <p>Delivery times are estimates and may vary due to traffic or local conditions. If you receive damaged or incorrect items, contact us promptly so we can resolve the issue.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Intellectual Property</h2>
            <p>All website content, trademarks, logos, and materials are owned by Ari Water or its licensors. You may not reproduce or use them without permission.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Limitations of Liability</h2>
            <p>To the fullest extent permitted by law, Ari Water is not liable for indirect, incidental, or consequential damages arising from your use of the website or purchase of products.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Changes to Terms</h2>
            <p>We may update these terms when necessary. Continued use of the website after changes means you accept the revised terms.</p>
          </section>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <Link href="/privacy">
              <Button variant="outline" className="text-slate-700">View Privacy Policy</Button>
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
