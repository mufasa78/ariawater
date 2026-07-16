import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl bg-white shadow-xl rounded-3xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-primary px-6 py-10 sm:px-10">
          <h1 className="text-4xl font-display font-bold text-white">Privacy Policy</h1>
          <p className="mt-4 max-w-3xl text-slate-200 text-lg leading-8">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal data when you use Ari Water.
          </p>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-12 space-y-10 text-slate-700">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Information We Collect</h2>
            <p>We collect information you provide directly, including name, email, phone number, delivery address, and payment preferences. We also collect data from your use of the website to improve service and personalize your experience.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Use of Cookies</h2>
            <p>We use cookies and similar technologies to remember your session, keep you logged in, understand how our website is used, and enable secure authentication. Cookies are set with your consent or when required for core functionality.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">How We Use Your Data</h2>
            <p>We use collected data to process orders, manage your account, communicate service updates, prevent fraud, and provide customer support. We never sell your personal information to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Data Sharing</h2>
            <p>We may share information with suppliers and service providers when needed to fulfill orders, process payments, or support the website. All partners are required to protect your data and use it only for the requested services.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Security</h2>
            <p>We safeguard your information using industry-standard controls and maintain secure systems for protecting your personal data. While we strive to keep data safe, no internet transmission can be guaranteed completely secure.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Your Rights</h2>
            <p>You can request access to, correction of, or deletion of your personal data. Contact us with any requests or questions at aritwinlimited@gmail.com.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Changes to this Policy</h2>
            <p>We may update this privacy policy from time to time. We will post changes on this page and revise the effective date accordingly.</p>
          </section>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <Link href="/terms">
              <Button variant="outline" className="text-slate-700">View Terms</Button>
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
