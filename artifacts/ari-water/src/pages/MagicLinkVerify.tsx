import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MagicLinkVerify() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  // Get token from URL query params
  const token = new URLSearchParams(window.location.search).get('token');

  const verifyMagicLink = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch('/api/magic-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to verify magic link');
      }

      return res.json();
    },
    onSuccess: async () => {
      setStatus('success');
      // Redirect to home after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error: Error) => {
      setStatus('error');
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    // Verify the magic link
    verifyMagicLink.mutate(token);
  }, [token]);

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You've been successfully signed in
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Redirecting you to the app...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Verification failed</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>This could happen if:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The link has expired (links are valid for 15 minutes)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <Button
              className="w-full"
              onClick={() => setLocation('/magic-login')}
            >
              Request a new magic link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifying state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Verifying your magic link</CardTitle>
          <CardDescription>Please wait a moment...</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
