import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { AuthUser, useGetMe, getGetMeQueryKey, useLogout } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation('/login');
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
