import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Mail, FileText } from "lucide-react";

const EFFECTIVE_DATE = "19 July 2026";
const LAST_UPDATED = "19 July 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0c3550] px-8 py-12 sm:px-12 rounded-3xl mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "28px 28px" }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary/80 uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-3">Privacy Policy</h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
              Aritwin Limited (&ldquo;Ari Water&rdquo;) is committed to protecting your personal data. This
              policy explains what we collect, why, how long we keep it, and your rights under
              applicable data protection law.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {/* 1. Data Controller */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">1. Data Controller</h2>
            <p className="text-slate-700 leading-relaxed">
              The data controller responsible for your personal information is:
            </p>
            <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 space-y-1 border border-slate-200">
              <p className="font-semibold text-slate-900">Aritwin Limited</p>
              <p>Trading as: <strong>Ari Water</strong></p>
              <p>Address: Nairobi, Kenya</p>
              <p>Email: <a href="mailto:aritwinlimited@gmail.com" className="text-primary hover:underline">aritwinlimited@gmail.com</a></p>
              <p>Phone: <a href="tel:+254726432689" className="text-primary hover:underline">+254 726 432 689</a></p>
            </div>
            <p className="text-slate-600 text-sm">
              Aritwin Limited is registered in Kenya and complies with the Kenya{" "}
              <strong>Data Protection Act, 2019</strong> (DPA) and, where applicable, the EU/UK{" "}
              <strong>General Data Protection Regulation</strong> (GDPR).
            </p>
          </section>

          {/* 2. Data We Collect */}
          <section className="px-8 py-8 sm:px-10 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">2. Data We Collect</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-700 rounded-tl-lg border border-slate-200">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 border-t border-b border-slate-200">Examples</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 rounded-tr-lg border border-slate-200">How collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { cat: "Identity", ex: "Name, email address", how: "Registration form" },
                    { cat: "Contact", ex: "Phone number, delivery address", how: "Order checkout" },
                    { cat: "Account credentials", ex: "Hashed password (bcrypt)", how: "Registration form" },
                    { cat: "Order data", ex: "Items, quantity, total, status", how: "Checkout & orders API" },
                    { cat: "Payment data", ex: "M-Pesa reference, transaction ID", how: "Lipana / payment gateway" },
                    { cat: "Usage data", ex: "Pages visited, browser type, IP address", how: "Server logs, cookies" },
                    { cat: "Communications", ex: "WhatsApp, email enquiries", how: "Customer service" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 border-l border-slate-200">{row.cat}</td>
                      <td className="px-4 py-3 text-slate-600">{row.ex}</td>
                      <td className="px-4 py-3 text-slate-600 border-r border-slate-200">{row.how}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-600 text-sm">
              We do <strong>not</strong> collect sensitive personal data (race, health, religion,
              biometrics) or payment card numbers (handled entirely by Lipana/M-Pesa).
            </p>
          </section>

          {/* 3. Legal Basis & Purpose */}
          <section className="px-8 py-8 sm:px-10 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">3. How We Use Your Data & Our Legal Basis</h2>
            <div className="space-y-3">
              {[
                {
                  purpose: "Fulfil and manage your orders",
                  basis: "Performance of contract",
                  detail: "Process orders, arrange delivery, send order status updates.",
                },
                {
                  purpose: "Account management",
                  basis: "Performance of contract",
                  detail: "Create and maintain your account, authenticate you on login.",
                },
                {
                  purpose: "Payment processing",
                  basis: "Performance of contract",
                  detail: "Initiate M-Pesa STK push, record payment references, reconcile payments.",
                },
                {
                  purpose: "Customer support",
                  basis: "Legitimate interests",
                  detail: "Respond to enquiries, resolve disputes, manage returns.",
                },
                {
                  purpose: "Fraud prevention & security",
                  basis: "Legitimate interests",
                  detail: "Detect and prevent fraudulent transactions; protect our systems.",
                },
                {
                  purpose: "Legal obligations",
                  basis: "Legal obligation",
                  detail: "Tax records, KRA compliance, responding to lawful authority requests.",
                },
                {
                  purpose: "Analytics cookies",
                  basis: "Consent",
                  detail: "Understand usage patterns to improve the platform. You may withdraw consent at any time.",
                },
                {
                  purpose: "Marketing communications",
                  basis: "Consent",
                  detail: "Send promotional offers by email or WhatsApp. Opt-out is available in every message.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="shrink-0 mt-0.5">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.purpose}</p>
                    <p className="text-xs text-primary font-medium mb-1">Basis: {item.basis}</p>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Data Retention */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">4. Data Retention</h2>
            <p className="text-slate-700 leading-relaxed">
              We retain your data only as long as necessary for the purposes described above or as
              required by law:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2 text-slate-700 text-sm">
              <li><strong>Account data</strong> — Retained while your account is active plus 2 years after closure.</li>
              <li><strong>Order & payment records</strong> — 7 years (Kenya Revenue Authority / KRA requirement).</li>
              <li><strong>Server logs</strong> — 90 days, then automatically purged.</li>
              <li><strong>Consented marketing data</strong> — Until you withdraw consent.</li>
            </ul>
            <p className="text-slate-600 text-sm">
              When we no longer need data, we delete or anonymise it securely.
            </p>
          </section>

          {/* 5. Data Sharing */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">5. Data Sharing</h2>
            <p className="text-slate-700 leading-relaxed">
              We share your data only with parties necessary to deliver our service:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2 text-slate-700 text-sm">
              <li>
                <strong>Lipana Africa</strong> — M-Pesa payment gateway. Receives your phone number
                and order amount to initiate STK push.{" "}
                <a href="https://lipana.africa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lipana.africa</a>
              </li>
              <li>
                <strong>Convex Inc.</strong> — Cloud database infrastructure (USA). Data is
                processed under their Data Processing Agreement.{" "}
                <a href="https://convex.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">convex.dev/privacy</a>
              </li>
              <li>
                <strong>Delivery partners</strong> — Your name, address and phone number to arrange delivery.
              </li>
              <li>
                <strong>Law enforcement / authorities</strong> — Only when required by law or valid
                court order.
              </li>
            </ul>
            <p className="text-slate-700 text-sm">
              We <strong>never sell</strong> your personal data to third parties for their marketing
              purposes.
            </p>
          </section>

          {/* 6. International Transfers */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">6. International Transfers</h2>
            <p className="text-slate-700 leading-relaxed text-sm">
              Our database (Convex) is hosted in the USA. When we transfer data outside Kenya, we
              ensure appropriate safeguards are in place (Standard Contractual Clauses or equivalent)
              in line with the Kenya Data Protection Act, 2019 and GDPR Article 46.
            </p>
          </section>

          {/* 7. Cookies */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">7. Cookies & Tracking</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              We use cookies and similar technologies. Full details — including cookie categories,
              durations and how to withdraw consent — are in our{" "}
              <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section className="px-8 py-8 sm:px-10 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">8. Your Rights</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              Under the Kenya Data Protection Act 2019 and/or the GDPR you have the following rights
              regarding your personal data:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { right: "Access", desc: "Request a copy of the personal data we hold about you." },
                { right: "Rectification", desc: "Ask us to correct inaccurate or incomplete data." },
                { right: "Erasure", desc: "Request deletion of your data ('right to be forgotten'), subject to legal obligations." },
                { right: "Portability", desc: "Receive your data in a structured, machine-readable format." },
                { right: "Restriction", desc: "Ask us to restrict processing of your data in certain circumstances." },
                { right: "Objection", desc: "Object to processing based on legitimate interests or direct marketing." },
                { right: "Withdraw consent", desc: "Withdraw consent for analytics or marketing at any time via cookie settings or by contacting us." },
                { right: "Lodge a complaint", desc: "Complain to the Kenya Office of the Data Protection Commissioner (ODPC) at odpc.go.ke." },
              ].map((item) => (
                <div key={item.right} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.right}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-sm">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:aritwinlimited@gmail.com" className="text-primary hover:underline">
                aritwinlimited@gmail.com
              </a>{" "}
              with the subject line <em>Data Rights Request</em>. We will respond within 30 days.
            </p>
          </section>

          {/* 9. Security */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">9. Security</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              We implement industry-standard security controls including TLS encryption in transit,
              bcrypt-hashed passwords, HTTP security headers (HSTS, CSP, X-Content-Type-Options),
              HttpOnly session cookies, and access controls. In the event of a personal data breach
              that poses a risk to individuals, we will notify affected users and relevant authorities
              as required by law.
            </p>
          </section>

          {/* 10. Children */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">10. Children's Privacy</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              Our services are intended for adults aged 18 and over. We do not knowingly collect
              personal data from children under 18. If you believe a minor has created an account,
              please contact us immediately so we can delete the data.
            </p>
          </section>

          {/* 11. Changes */}
          <section className="px-8 py-8 sm:px-10 space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">11. Changes to this Policy</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. When we make material changes we
              will update the &ldquo;Last updated&rdquo; date at the top and, where appropriate, notify you by
              email. Continued use of the platform after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          {/* Contact & Footer */}
          <div className="px-8 py-8 sm:px-10 bg-slate-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-900 mb-0.5">Questions about your data?</p>
                  <p>Email <a href="mailto:aritwinlimited@gmail.com" className="text-primary hover:underline">aritwinlimited@gmail.com</a></p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/terms">
                  <Button variant="outline" size="sm">Terms of Use</Button>
                </Link>
                <Link href="/cookie-policy">
                  <Button variant="outline" size="sm">Cookie Policy</Button>
                </Link>
                <Link href="/">
                  <Button size="sm">Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
