'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Terminal, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation RegisterUser($displayName: String!, $username: String!, $email: String!, $password: String!) {
              register(displayName: $displayName, username: $username, email: $email, password: $password) {
                token
                user {
                  id
                  email
                  username
                  displayName
                  bio
                  avatarUrl
                  role
                  reputation
                }
              }
            }
          `,
          variables: { displayName, username, email, password },
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      if (json.data?.register) {
        await login(json.data.register.token, json.data.register.user);
        router.push('/');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white mb-3 shadow-sm shadow-blue-500/20">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join DevConnect</h1>
          <p className="text-sm text-slate-500 mt-1">Connect with engineers and share solutions</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full / Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="janedev"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-colors text-sm disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
