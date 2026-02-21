import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = window.localStorage.getItem('codeflow-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call to /api/auth/login
      // Simulated login for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      const userData = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        plan: 'Pro',
        joinedAt: new Date().toISOString(),
      };
      setUser(userData);
      try {
        window.localStorage.setItem('codeflow-user', JSON.stringify(userData));
      } catch { /* silent */ }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call to /api/auth/signup
      await new Promise(resolve => setTimeout(resolve, 1200));
      const userData = {
        id: crypto.randomUUID(),
        email,
        name,
        plan: 'Starter',
        joinedAt: new Date().toISOString(),
      };
      setUser(userData);
      try {
        window.localStorage.setItem('codeflow-user', JSON.stringify(userData));
      } catch { /* silent */ }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Signup failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem('codeflow-user');
    } catch { /* silent */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
