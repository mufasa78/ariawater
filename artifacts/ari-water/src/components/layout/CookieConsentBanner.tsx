/**
 * GDPR-compliant cookie consent banner with per-category granular controls.
 *
 * Categories:
 *   • essential  — always on (auth session, security, cart)
 *   • analytics  — optional (usage analytics, performance)
 *   • marketing  — optional (social pixels, remarketing)
 *
 * Consent is stored in localStorage as a JSON object and as a cookie so
 * server-side rendering / API routes can read it too.
 *
 * Usage:
 *   import { useConsent } from '@/components/layout/CookieConsentBanner';
 *   const { analytics, marketing } = useConsent();
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, BarChart2, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ConsentPreferences {
  essential: true; // always true — cannot be disabled
  analytics: boolean;
  marketing: boolean;
  version: number;
  timestamp: number; // Unix ms
}

type ConsentState = ConsentPreferences | null;

// ── Storage helpers ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ari-cookie-consent-v2';
const COOKIE_NAME = 'ari_cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const CURRENT_VERSION = 2;

export function readConsentPrefs(): ConsentState {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (parsed.version !== CURRENT_VERSION) return null; // re-ask on version bump
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsentPrefs(prefs: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  const summary = prefs.analytics && prefs.marketing ? 'all' : prefs.analytics ? 'analytics' : prefs.marketing ? 'marketing' : 'essential';
  document.cookie = `${COOKIE_NAME}=${summary}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

// ── Context ────────────────────────────────────────────────────────────────────

const ConsentContext = createContext<ConsentPreferences>({
  essential: true,
  analytics: false,
  marketing: false,
  version: CURRENT_VERSION,
  timestamp: 0,
});

export function useConsent() {
  return useContext(ConsentContext);
}

// ── Category definitions ───────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'essential' as const,
    label: 'Essential',
    icon: Shield,
    description:
      'Required for the site to work. Includes authentication, session security, and your shopping cart. Cannot be disabled.',
    alwaysOn: true,
  },
  {
    id: 'analytics' as const,
    label: 'Analytics',
    icon: BarChart2,
    description:
      'Help us understand how visitors use the site so we can improve performance and content. Data is anonymised.',
    alwaysOn: false,
  },
  {
    id: 'marketing' as const,
    label: 'Marketing',
    icon: Megaphone,
    description:
      'Enable personalised promotions and social media integrations. Used to show relevant content across platforms.',
    alwaysOn: false,
  },
] as const;

// ── Main component ─────────────────────────────────────────────────────────────

export function CookieConsentBanner({ children }: { children?: React.ReactNode }) {
  const [saved, setSaved] = useState<ConsentState>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const existing = readConsentPrefs();
    if (existing) {
      setSaved(existing);
      return; // Explicit return for consistency
    }
    
    // Small delay so the page renders first
    const t = setTimeout(() => setShowBanner(true), 600);
    return () => clearTimeout(t);
  }, []);

  const acceptAll = () => {
    const full: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    };
    writeConsentPrefs(full);
    setSaved(full);
    setShowBanner(false);
    setShowModal(false);
  };

  const rejectAll = () => {
    const minimal: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    };
    writeConsentPrefs(minimal);
    setSaved(minimal);
    setShowBanner(false);
    setShowModal(false);
  };

  const savePreferences = () => {
    const custom: ConsentPreferences = {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    };
    writeConsentPrefs(custom);
    setSaved(custom);
    setShowBanner(false);
    setShowModal(false);
  };

  const contextValue: ConsentPreferences = saved ?? {
    essential: true,
    analytics: false,
    marketing: false,
    version: CURRENT_VERSION,
    timestamp: 0,
  };

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}

      {/* ── Cookie banner ── */}
      <AnimatePresence>
        {showBanner && !showModal && (
          <motion.div
            key="banner"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4"
            role="dialog"
            aria-label="Cookie consent"
            aria-live="polite"
          >
            <div className="mx-auto max-w-4xl bg-slate-950/97 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
                {/* Icon */}
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-1">
                    We value your privacy
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    We use cookies to keep the site secure, remember your cart, and improve your experience. By accepting all, you consent to analytics and marketing cookies. Essential cookies are always active.{' '}
                    <Link
                      href="/cookie-policy"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Cookie Policy
                    </Link>{' '}
                    ·{' '}
                    <Link
                      href="/privacy"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-white/15 text-slate-300 hover:bg-white/10 hover:text-white text-xs h-9"
                    onClick={() => {
                      setPrefs({ analytics: false, marketing: false });
                      setShowModal(true);
                      setShowBanner(false);
                    }}
                  >
                    Manage preferences
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs h-9"
                    onClick={rejectAll}
                  >
                    Essential only
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9"
                    onClick={acceptAll}
                  >
                    Accept all
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manage preferences modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[61] bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowModal(false); setShowBanner(true); }}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[62] bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Cookie preferences"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-white text-sm">Cookie Preferences</h2>
                </div>
                <button
                  onClick={() => { setShowModal(false); setShowBanner(true); }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Categories */}
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose which cookies you allow. You can change your preferences at any time via
                  the Cookie Policy page.
                </p>

                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const enabled = cat.alwaysOn || prefs[cat.id as 'analytics' | 'marketing'];

                  return (
                    <div
                      key={cat.id}
                      className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/8"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-sm font-medium text-white">{cat.label}</span>
                          {/* Toggle */}
                          <button
                            role="switch"
                            aria-checked={enabled}
                            disabled={cat.alwaysOn}
                            onClick={() => {
                              if (cat.alwaysOn) return;
                              const key = cat.id as 'analytics' | 'marketing';
                              setPrefs((p) => ({ ...p, [key]: !p[key] }));
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              enabled ? 'bg-primary' : 'bg-white/20'
                            } ${cat.alwaysOn ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                        {cat.alwaysOn && (
                          <span className="inline-block mt-1.5 text-[10px] font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                            Always active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-slate-300 border border-white/15 hover:bg-white/10 hover:text-white text-xs"
                  onClick={rejectAll}
                >
                  Essential only
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  onClick={savePreferences}
                >
                  Save preferences
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100 text-xs"
                  onClick={acceptAll}
                >
                  Accept all
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConsentContext.Provider>
  );
}
