import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { SignUp as ClerkSignUp, useAuth } from '@clerk/clerk-react';

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      setLocation('/shop');
    }
  }, [isSignedIn, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <img src="/ari-water-logo.png" alt="Ari Water" className="h-14 w-auto object-contain" />
          </Link>
          <h2 className="text-center text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">
            Create Account
          </h2>
          <p className="text-center text-sm text-slate-600 mb-8">
            Join Ari Water to track orders and manage your account
          </p>
        </div>

        <div className="flex justify-center">
          <ClerkSignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            fallbackRedirectUrl="/shop"
            forceRedirectUrl="/shop"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl shadow-slate-200/40 border border-slate-100',
              },
            }}
          />
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
