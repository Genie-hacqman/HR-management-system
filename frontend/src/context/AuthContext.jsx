import { createContext, useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const hasToken = !!localStorage.getItem('hr_saas_access_token');
    if (!hasToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const current = await authService.fetchCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = { user, isLoading, isAuthenticated: !!user, login, logout, refresh: loadCurrentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
