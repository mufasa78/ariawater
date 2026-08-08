import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '@/lib/clerk-auth-wrapper';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isSignedIn, isLoading } = useAuth();

  // Redirect based on role if already signed in
  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      if (user.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/shop');
      }
    }
  }, [isLoading, isSignedIn, user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <img src="/ari-water-logo.png" alt="Ari Water" className="h-14 w-auto object-contain" />
          </Link>
          <h2 className="text-center text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-sm text-slate-600 mb-8">
            Sign in to access your account
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn 
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl="/login"
            fallbackRedirectUrl="/admin"
            forceRedirectUrl="/admin"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl shadow-slate-200/40 border border-slate-100',
              },
            }}
          />
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Customer? No account needed!{' '}
          <Link href="/shop" className="text-primary hover:underline font-medium">
            Shop now
          </Link>
        </p>
      </div>
    </div>
  );
}
