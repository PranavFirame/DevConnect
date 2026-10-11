'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  reputation: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken?: string | null) => {
    try {
      const activeToken = authToken || localStorage.getItem('devconnect_token');
      if (!activeToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(activeToken);

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          query: `
            query CurrentUser {
              me {
                id
                email
                username
                displayName
                bio
                avatarUrl
                githubUrl
                role
                reputation
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.data?.me) {
        setUser(json.data.me);
      } else {
        // Token expired or invalid
        localStorage.removeItem('devconnect_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('devconnect_token', newToken);
    setToken(newToken);
    setUser(newUser);

    // Sync session cookie for server components
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newToken }),
    });
  };

  const logout = async () => {
    localStorage.removeItem('devconnect_token');
    setToken(null);
    setUser(null);

    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: null }),
    });
  };

  const refreshUser = async () => {
    await fetchCurrentUser(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
