'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { 
  User, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Camera, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, token, loading, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setGithubUrl(user.githubUrl || '');
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
          <h2 className="text-xl font-black mb-2 text-zinc-900 dark:text-zinc-100">Settings</h2>
          <p className="text-xs font-medium text-zinc-500 mb-6">Sign in to manage your developer profile.</p>
          <Link href="/login" className="inline-block bg-[#42ed91] text-zinc-900 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider brutal-btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Handle local file image upload (converted to data URL for instant zero-dependency storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Generate a random fun avatar using Dicebear
  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setAvatarUrl(newAvatar);
  };

  // Remove profile picture
  const handleDeleteAvatar = () => {
    setAvatarUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateUserProfile(
              $displayName: String
              $bio: String
              $avatarUrl: String
              $githubUrl: String
            ) {
              updateProfile(
                displayName: $displayName
                bio: $bio
                avatarUrl: $avatarUrl
                githubUrl: $githubUrl
              ) {
                id
                displayName
                bio
                avatarUrl
                githubUrl
              }
            }
          `,
          variables: {
            displayName,
            bio,
            avatarUrl: avatarUrl || null,
            githubUrl,
          },
        }),
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-8">
      <Sidebar />

      <div className="flex-1 min-w-0 space-y-6">
        {/* Banner header in FlowFest warm peach & neo-brutalist style */}
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
            <SettingsIcon className="h-3.5 w-3.5" />
            Profile Preferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
            Account & Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
            Update your public developer persona, avatar photo, bio, and portfolio links.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#42ed91]/20 border-2 border-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#18181b]">
            <CheckCircle2 className="h-4 w-4 text-[#42ed91]" />
            <span>Profile and picture updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#ffe5dd] border-2 border-rose-600 text-rose-700 text-xs font-bold shadow-[3px_3px_0px_0px_#e11d48]">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#18181b] space-y-6">
          {/* Profile Picture Management Section */}
          <div className="p-5 rounded-2xl bg-[#fbf9f5] dark:bg-zinc-800/80 border-2 border-zinc-900 dark:border-zinc-700 space-y-4">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Profile Picture
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Current Avatar Preview */}
              <div className="relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Avatar'}
                    className="h-24 w-24 rounded-2xl border-2 border-zinc-900 object-cover shadow-[3px_3px_0px_0px_#18181b] bg-white"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-[#ffb800] border-2 border-zinc-900 flex items-center justify-center text-zinc-900 shadow-[3px_3px_0px_0px_#18181b]">
                    <User className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Picture Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 hover:bg-[#fff4d1] hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer brutal-btn transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 hover:bg-[#fff4d1] hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white brutal-btn transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generate Avatar</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="flex items-center gap-2 bg-[#ffe5dd] dark:bg-rose-950/40 border-2 border-zinc-900 dark:border-rose-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 brutal-btn transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
              Upload any JPG, PNG, or SVG image (max 2MB), or click Generate to get an avatar robot.
            </p>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-1.5">
              Username
            </label>
            <input
              type="text"
              disabled
              value={`@${user?.username || ''}`}
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1">
              Usernames are unique developer handles and cannot be altered once created.
            </p>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-1.5">
              Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other developers about what you build, languages you love, or projects you maintain."
              className="w-full bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
            />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-1.5">
              GitHub Profile URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/your-username"
              className="w-full bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between border-t-2 border-zinc-100 dark:border-zinc-800">
            <Link
              href={`/users/${user?.username}`}
              className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            >
              ← View Public Profile
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl brutal-btn disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
