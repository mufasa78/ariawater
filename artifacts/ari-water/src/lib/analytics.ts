// ── Google Analytics 4 integration ──────────────────────────────────────────
// Set VITE_GA_MEASUREMENT_ID in your environment to activate tracking.
// Analytics cookies are only loaded when the user has given analytics consent.

import { readConsentPrefs } from '@/components/layout/CookieConsentBanner';

declare global {
  interface Window {
    dataLayer: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

function analyticsAllowed(): boolean {
  const prefs = readConsentPrefs();
  // If no consent recorded yet, treat as declined (privacy-first default)
  return prefs?.analytics === true;
}

export function initAnalytics(): void {
  if (!GA_ID || !analyticsAllowed()) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path: string, title?: string): void {
  if (!window.gtag || !GA_ID || !analyticsAllowed()) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    send_to: GA_ID,
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!window.gtag || !analyticsAllowed()) return;
  window.gtag("event", name, params);
}

export const gaConfigured = !!GA_ID;
export const gaMeasurementId = GA_ID ?? null;
