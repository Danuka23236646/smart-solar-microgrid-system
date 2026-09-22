import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authenticateUser, getCurrentSession, clearSession } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentSession());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Synchronize session on mount
    const current = getCurrentSession();
    if (current) {
      setSession(current);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authenticateUser(credentials);
      setSession(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const isBackoffice = session?.role === 'BackofficeOfficer';
  const isOperator = session?.role === 'GridOperator';

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        role: session?.role || null,
        token: session?.token || null,
        isAuthenticated: !!session?.token,
        isBackoffice,
        isOperator,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
