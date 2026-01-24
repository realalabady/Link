import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Firebase auth state listener
    // Check for existing session
    const checkAuth = async () => {
      try {
        // Simulated auth check - will be replaced with Firebase
        const storedUser = localStorage.getItem('link_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with Firebase auth
      // Simulated login
      const mockUser: User = {
        uid: 'mock-uid-' + Date.now(),
        email,
        name: email.split('@')[0],
        role: 'CLIENT', // Default, will be set in onboarding
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      setUser(mockUser);
      localStorage.setItem('link_user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with Firebase auth
      const mockUser: User = {
        uid: 'mock-uid-' + Date.now(),
        email,
        name,
        role: 'CLIENT', // Will be set in onboarding
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      setUser(mockUser);
      localStorage.setItem('link_user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with Firebase signOut
      setUser(null);
      localStorage.removeItem('link_user');
    } finally {
      setIsLoading(false);
    }
  };

  const setUserRole = async (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('link_user', JSON.stringify(updatedUser));
      // TODO: Update in Firestore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
