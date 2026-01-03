"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/lib/toast';

interface User {
  id: string;
  username: string | null;
  email: string;
  createdAt: string;
  updatedAt?: string;
  onboardingCompleted: boolean;
  projectInterests: string[];
  authProvider?: string;
  avatarUrl?: string;
  googleSub?: string;
  githubUsername?: string;
  githubConnected?: boolean;
}

interface SessionContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  terminalAuthorized: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkSession: () => void;
  completeOnboarding: (username: string, projectInterests: string[]) => Promise<void>;
  skipOnboarding: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [terminalAuthorized, setTerminalAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = () => {
    setIsLoading(true);

    // Check localStorage for authentication token and user data
    const token = localStorage.getItem('flowzen_token');
    const userData = localStorage.getItem('flowzen_user');

    console.log('🔍 Session check - Token:', !!token, 'User data:', !!userData);

    if (token && userData) {
      try {
        const rawUser = JSON.parse(userData);
        const user: User = {
          ...rawUser,
          projectInterests: Array.isArray(rawUser?.projectInterests) ? rawUser.projectInterests : [],
          onboardingCompleted:
            typeof rawUser?.onboardingCompleted === 'boolean'
              ? rawUser.onboardingCompleted
              : Boolean(rawUser?.username),
        };
        console.log('📝 Parsed user data:', user);
        setIsLoggedIn(true);
        setTerminalAuthorized(true);
        setCurrentUser(user);
        localStorage.setItem('flowzen_user', JSON.stringify(user));
        console.log('✅ User session restored:', user);
      } catch (error) {
        console.error('❌ Failed to parse user data from localStorage', error);
        // Clear invalid session data
        localStorage.removeItem('flowzen_token');
        localStorage.removeItem('flowzen_user');
        setIsLoggedIn(false);
        setTerminalAuthorized(false);
        setCurrentUser(null);
      }
    } else {
      // No valid session found
      setIsLoggedIn(false);
      setTerminalAuthorized(false);
      setCurrentUser(null);
      console.log('🔍 No active session found');
    }

    setIsLoading(false);
  };

  const login = (user: User, token: string) => {
    localStorage.setItem('flowzen_token', token);
    localStorage.setItem('flowzen_user', JSON.stringify(user));
    setIsLoggedIn(true);
    setTerminalAuthorized(true);
    setCurrentUser(user);
    console.log('✅ User logged in:', user);
  };

  const logout = () => {
    localStorage.removeItem('flowzen_token');
    localStorage.removeItem('flowzen_user');
    setIsLoggedIn(false);
    setTerminalAuthorized(false);
    setCurrentUser(null);
    console.log('🔒 User logged out');
  };

  const skipOnboarding = () => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updatedUser: User = {
        ...prev,
        onboardingCompleted: true,
      };
      localStorage.setItem('flowzen_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  useEffect(() => {
    checkSession();
  }, []);

  const completeOnboarding = async (username: string, projectInterests: string[]) => {
    const token = localStorage.getItem('flowzen_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation {
              completeOnboarding(input: {
                username: "${username}"
                projectInterests: ${JSON.stringify(projectInterests)}
              }) {
                id
                username
                email
                createdAt
                onboardingCompleted
                projectInterests
              }
            }
          `
        })
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
        throw new Error(result.errors[0].message);
      }

      if (result.data?.completeOnboarding) {
        setCurrentUser(result.data.completeOnboarding);
        // Update localStorage with new user data
        localStorage.setItem('flowzen_user', JSON.stringify(result.data.completeOnboarding));
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      toast.error('Failed to complete onboarding. Please try again.');
      throw error;
    }
  };

  const value: SessionContextType = {
    isLoggedIn,
    currentUser,
    terminalAuthorized,
    isLoading,
    login,
    logout,
    checkSession,
    completeOnboarding,
    skipOnboarding,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
