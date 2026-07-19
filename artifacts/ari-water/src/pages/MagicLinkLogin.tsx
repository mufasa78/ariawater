import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

export function MagicLinkLogin() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [magicLink, setMagicLink] = useState('');

  const requestMagicLink = useMutation({
    mutationFn: async (data: { email: string; name?: string; phone?: string }) => {
      const res = await fetch('/api/magic-auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send magic link');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setLinkSent(true);
      // In development, show the magic link
      if (data.magicLink) {
        setMagicLink(data.magicLink);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestMagicLink.mutate({ email, name: name || undefined, phone: phone || undefined });
  };

  if (linkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Click the link in your email to sign in. The link expires in 15 minutes.
            </p>
            
            {/* Development only - show the magic link */}
            {magicLink && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800 font-medium mb-2">Development Mode:</p>
                <a
                  href={magicLink}
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {magicLink}
                </a>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setLinkSent(false);
                setEmail('');
                setName('');
                setPhone('');
                setMagicLink('');
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in with magic link</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a magic link to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requestMagicLink.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={requestMagicLink.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={requestMagicLink.isPending}
              />
            </div>

            {requestMagicLink.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  {requestMagicLink.error.message}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={requestMagicLink.isPending}
            >
              {requestMagicLink.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = '/login')}
            >
              Sign in with password (Admin only)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
