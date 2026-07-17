import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export const STORAGE_KEY = 'aria-cookie-consent';
const COOKIE_NAME = 'aria_cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ConsentChoice = 'accepted' | 'declined' | null;

export function readConsent(): ConsentChoice {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'accepted' || stored === 'declined') return stored;

  return null;
}

export function writeConsent(choice: Exclude<ConsentChoice, null>) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, choice);
  document.cookie = `${COOKIE_NAME}=${choice}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentChoice>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    if (!saved) {
      setIsVisible(true);
      return;
    }

    setConsent(saved);
  }, []);

  const handleChoice = (choice: 'accepted' | 'declined') => {
    writeConsent(choice);
    setConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-slate-950/95 px-4 py-4 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">We use cookies to keep the site secure and improve your experience.</p>
          <p className="text-sm text-slate-300">
            By accepting, you allow essential cookies for sign-in and session support. You can learn more in our{' '}
            <Link href="/cookie-policy" className="text-primary underline-offset-4 hover:underline">
              cookie policy
            </Link>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => handleChoice('declined')}
          >
            Decline
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleChoice('accepted')}
          >
            Accept cookies
          </Button>
        </div>
      </div>
    </div>
  );
}
