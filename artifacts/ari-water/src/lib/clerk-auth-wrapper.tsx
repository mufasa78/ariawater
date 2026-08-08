/**
 * Clerk Authentication Wrapper
 * Provides compatibility layer between Clerk and existing auth context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export interface User {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'marketing' | 'sales' | 'accounting' | 'customer';
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ClerkAuthWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);

  // Configure API client to use Clerk tokens
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (isSignedIn) {
        return await getToken();
      }
      return null;
  // Set up Clerk JWT token injection for API requests
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
        return null;
      }
    });
  }, [isSignedIn, getToken]);

  // Map Clerk user to our User interface
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const role = (clerkUser.publicMetadata?.role as string) || 'customer';
      const approved = (clerkUser.publicMetadata?.approved as boolean) ?? true; // Auto-approve for now
      
      setUser({
        userId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        phone: clerkUser.phoneNumbers?.[0]?.phoneNumber,
        role: role as User['role'],
        approved,
      });
    } else {
      setUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
        isSignedIn: isSignedIn ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within ClerkAuthWrapper');
  }
  return context;
}
