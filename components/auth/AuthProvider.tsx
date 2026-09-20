'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, ApiError } from '@/lib/api';
import type { ApiSession } from '@/lib/api-types';

interface AuthContextValue {
  session: ApiSession | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<ApiSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setSession(await api.session());
    } catch (error) {
      // A 401 is the normal "not signed in" answer, not a failure worth
      // surfacing; anything else is worth seeing in the console.
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error('Could not load session', error);
      }
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The initial load runs inside a nested async function and behind an
  // `active` flag, so no state update can happen synchronously during the
  // effect or after the provider unmounts.
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const next = await api.session();
        if (active) setSession(next);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Could not load session', error);
        }
        if (active) setSession(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
