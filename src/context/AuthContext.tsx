import React, { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (import.meta.env.PROD) {
      // Auto-login for production demo
      const demoUser = {
        id: 0,
        name: 'Production Demo',
        email: 'demo@nexus.erp',
        role: 'Admin',
        permissions: ['dashboard', 'inventory', 'sales', 'purchase', 'production', 'reports', 'master', 'admin', 'settings']
      };
      setToken('demo-token');
      setUser(demoUser);
      localStorage.setItem('erp_token', 'demo-token');
      localStorage.setItem('erp_user', JSON.stringify(demoUser));
    }
    setIsReady(true);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('erp_token', newToken);
    localStorage.setItem('erp_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  if (!isReady) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
