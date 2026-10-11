'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  Terminal, 
  Search, 
  PlusCircle, 
  Bookmark, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  User as UserIcon 
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-900 dark:border-zinc-700 bg-[#fbf9f5]/95 dark:bg-[#121316]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-[#f25774] flex items-center justify-center text-white border-2 border-zinc-900 dark:border-zinc-100 shadow-[2px_2px_0px_0px_#18181b] group-hover:-rotate-3 transition-transform">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-white leading-none">
              Dev<span className="text-[#f25774]">Connect</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5">
              Community Hub
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search discussions, code, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 shadow-[2px_2px_0px_0px_#18181b] focus:outline-none focus:ring-0 focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
          />
        </form>

        {/* Navigation Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/discussions"
            className="text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-[#f25774] px-3 py-2 rounded-lg transition-colors"
          >
            Discussions
          </Link>
          <Link
            href="/tags"
            className="text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-[#f25774] px-3 py-2 rounded-lg transition-colors"
          >
            Tags
          </Link>

          {user ? (
            <>
              <Link
                href="/discussions/new"
                className="flex items-center gap-1.5 bg-[#f25774] hover:bg-[#e03e5c] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl brutal-btn"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Post</span>
              </Link>

              <Link
                href="/bookmarks"
                title="Saved Discussions"
                className="p-2.5 text-zinc-800 dark:text-zinc-200 hover:text-[#f25774] rounded-xl border-2 border-transparent hover:border-zinc-900 transition-colors"
              >
                <Bookmark className="h-5 w-5" />
              </Link>

              <Link
                href="/notifications"
                title="Notifications"
                className="p-2.5 text-zinc-800 dark:text-zinc-200 hover:text-[#f25774] rounded-xl border-2 border-transparent hover:border-zinc-900 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
              </Link>

              {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                <Link
                  href="/moderation"
                  title="Moderator Dashboard"
                  className="p-2.5 text-amber-600 bg-amber-100 rounded-xl border-2 border-zinc-900 transition-colors"
                >
                  <ShieldAlert className="h-5 w-5" />
                </Link>
              )}

              {/* User Avatar & Menu */}
              <div className="flex items-center gap-2 pl-2 border-l-2 border-zinc-300 dark:border-zinc-700">
                <Link
                  href={`/users/${user.username}`}
                  className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#f25774]"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-9 w-9 rounded-xl border-2 border-zinc-900 object-cover shadow-[2px_2px_0px_0px_#18181b]"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-[#ffb800] border-2 border-zinc-900 flex items-center justify-center font-bold">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  <span className="hidden lg:inline">@{user.username}</span>
                </Link>

                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="p-2 text-zinc-500 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 hover:text-[#f25774] px-4 py-2.5 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-xs font-black uppercase tracking-wider bg-[#f25774] hover:bg-[#e03e5c] text-white px-4 py-2.5 rounded-xl brutal-btn"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-zinc-900 bg-[#fbf9f5] dark:bg-[#121316] px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            <Link
              href="/discussions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 font-bold text-zinc-900 dark:text-white"
            >
              Discussions
            </Link>
            <Link
              href="/tags"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 font-bold text-zinc-900 dark:text-white"
            >
              Tags
            </Link>
            {user ? (
              <>
                <Link
                  href="/discussions/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 text-[#f25774] font-bold"
                >
                  Create Discussion
                </Link>
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-bold text-zinc-900 dark:text-white"
                >
                  Bookmarks
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-bold text-zinc-900 dark:text-white"
                >
                  Notifications
                </Link>
                <Link
                  href={`/users/${user.username}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-bold text-zinc-900 dark:text-white"
                >
                  Profile (@{user.username})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-rose-600 font-bold"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 border-2 border-zinc-900 rounded-lg font-bold"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-[#f25774] text-white rounded-lg font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
