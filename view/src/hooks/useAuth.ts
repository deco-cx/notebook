import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '../lib/rpc';

interface AuthContextType {
  user: { id: string; email: string; name?: string } | null;
  workspace: { id: string; name: string } | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => client.GET_AUTH_STATUS({}),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = () => window.location.href = '/oauth/start';
  const logout = () => {
    localStorage.clear();
    window.location.href = '/oauth/logout';
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user: authData?.user || null,
        workspace: authData?.workspace || null,
        isLoggedIn: !!authData?.user,
        isLoading,
        login,
        logout
      }
    },
    children
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
