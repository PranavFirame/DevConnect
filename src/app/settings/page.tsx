'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { User, Settings as SettingsIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');
  const [saved, setSaved] = useState(false);

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Settings</h2>
        <p className="text-sm text-slate-500 mb-6">Sign in to manage your developer profile.</p>
        <Link href="/login" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize your public developer profile, bio, and repository links.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4" />
          <span>Profile settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={displayName || user?.displayName || ''}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Username
          </label>
          <input
            type="text"
            disabled
            value={user?.username || ''}
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">Usernames cannot be changed once established.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Biography
          </label>
          <textarea
            rows={3}
            value={bio || user?.bio || ''}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other developers about what you build, languages you love, or what you are learning."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            GitHub Profile URL
          </label>
          <input
            type="url"
            value={githubUrl || user?.githubUrl || ''}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
