'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="dev-card p-6 sm:p-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-[#F45170] mx-auto flex items-center justify-center text-white mb-3 shadow-sm shadow-[#F45170]/20">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#17181D]">Welcome Back</h1>
          <p className="text-sm text-[#697386] mt-1">Sign in to your DevConnect account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17181D] mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#697386]" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="developer or dev@example.com"
                className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17181D] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#697386]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center text-xs text-[#697386]">
          <span>Don&apos;t have an account? </span>
          <Link href="/register" className="text-[#F45170] font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
