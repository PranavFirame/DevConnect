'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [emailOrUsername, setEmailOrUsername] = useState('');
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
            mutation LoginUser($emailOrUsername: String!, $password: String!) {
              login(emailOrUsername: $emailOrUsername, password: $password) {
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
          variables: { emailOrUsername, password },
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      if (json.data?.login) {
        await login(json.data.login.token, json.data.login.user);
        router.push('/');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-7 sm:p-9 shadow-[6px_6px_0px_0px_#18181b]">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[#f25774] border-2 border-zinc-900 mx-auto flex items-center justify-center text-white mb-3 shadow-[3px_3px_0px_0px_#18181b] -rotate-3">
            <Terminal className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">
            Welcome Back
          </span>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Sign In to DevConnect</h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">Join technical discussions and share code</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-[#ffe5dd] border-2 border-rose-600 text-rose-700 text-xs font-bold shadow-[2px_2px_0px_0px_#e11d48]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="alexdev or admin@devconnect.io"
                className="w-full bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#f25774] hover:bg-[#e03e5c] text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl brutal-btn mt-3 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t-2 border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 font-medium">
          <span>Need an account? </span>
          <Link href="/register" className="text-[#f25774] font-black uppercase tracking-wider hover:underline">
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
}
