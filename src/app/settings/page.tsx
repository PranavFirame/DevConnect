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
      <div className="max-w-md mx-auto py-16 text-center dev-card p-8">
        <h2 className="text-xl font-bold text-[#17181D] mb-2">Settings</h2>
        <p className="text-sm text-[#697386] mb-6">Sign in to manage your developer profile.</p>
        <Link href="/login" className="btn-primary px-5 py-2.5 text-sm font-semibold inline-block">
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
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-[#F45170]" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#697386] mt-1">
          Customize your public developer profile, bio, and repository links.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4" />
          <span>Profile settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="dev-card p-6 sm:p-7 space-y-5">
        <div>
          <label className="block text-xs font-bold text-[#17181D] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={displayName || user?.displayName || ''}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-sm text-[#17181D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#17181D] mb-1.5">
            Username
          </label>
          <input
            type="text"
            disabled
            value={user?.username || ''}
            className="w-full bg-slate-100 border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-sm text-[#697386] cursor-not-allowed font-mono"
          />
          <p className="text-[11px] text-[#697386] mt-1">Usernames cannot be changed once established.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#17181D] mb-1.5">
            Biography
          </label>
          <textarea
            rows={3}
            value={bio || user?.bio || ''}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other developers about what you build, languages you love, or what you are learning."
            className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#17181D] mb-1.5">
            GitHub Profile URL
          </label>
          <input
            type="url"
            value={githubUrl || user?.githubUrl || ''}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
            className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="btn-primary py-2.5 px-6 text-sm font-semibold"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
