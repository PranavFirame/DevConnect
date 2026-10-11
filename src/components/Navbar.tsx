'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  Terminal, 
  Search, 
  Plus, 
  Bookmark, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ChevronDown,
  Settings
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] bg-[#17181D] text-white border-b border-[#2A2E39] shadow-sm">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F45170] rounded-lg">
            <div className="h-9 w-9 rounded-lg bg-[#F45170] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Terminal className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg tracking-tight text-white leading-none">
                  Dev<span className="text-[#F45170]">Connect</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#9CA3AF] tracking-normal leading-none mt-1 hidden sm:inline">
                Community Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-2">
            <Link
              href="/discussions"
              className="text-sm font-medium text-[#D1D5DB] hover:text-white hover:bg-[#252831] px-3 py-1.5 rounded-md transition-colors"
            >
              Discussions
            </Link>
            <Link
              href="/tags"
              className="text-sm font-medium text-[#D1D5DB] hover:text-white hover:bg-[#252831] px-3 py-1.5 rounded-md transition-colors"
            >
              Tags
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md relative items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-[#8C94A6] pointer-events-none" />
          <input
            type="text"
            placeholder="Search discussions, code, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#22252E] hover:bg-[#282C37] focus:bg-[#22252E] border border-[#333744] focus:border-[#F45170] rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-[#8C94A6] focus:outline-none focus:ring-1 focus:ring-[#F45170] transition-all"
          />
        </form>

        {/* Actions & Account Menu */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              {/* Primary Action Button */}
              <Link
                href="/discussions/new"
                className="btn-primary flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>New Post</span>
              </Link>

              {/* Utility Icons */}
              <Link
                href="/bookmarks"
                title="Saved Discussions"
                className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#252831] rounded-lg transition-colors"
              >
                <Bookmark className="h-4 w-4" />
              </Link>

              <Link
                href="/notifications"
                title="Notifications"
                className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#252831] rounded-lg transition-colors relative"
              >
                <Bell className="h-4 w-4" />
              </Link>

              {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                <Link
                  href="/moderation"
                  title="Moderator Dashboard"
                  className="p-2 text-[#FFBD08] hover:bg-[#252831] rounded-lg transition-colors"
                >
                  <ShieldAlert className="h-4 w-4" />
                </Link>
              )}

              {/* User Avatar & Dropdown */}
              <div className="relative pl-1.5 ml-1 border-l border-[#2E3341]" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#252831] transition-colors focus:outline-none"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full border border-[#373C4B] object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-[#2E3341] flex items-center justify-center text-xs font-semibold text-white">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1E2129] border border-[#2E3341] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2 border-b border-[#2E3341]">
                      <p className="font-semibold text-white truncate">{user.displayName}</p>
                      <p className="text-[#9CA3AF] truncate">@{user.username}</p>
                    </div>

                    <Link
                      href={`/users/${user.username}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[#D1D5DB] hover:text-white hover:bg-[#282C37] transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span>Your Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[#D1D5DB] hover:text-white hover:bg-[#282C37] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-[#2E3341] my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-[#282C37] transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#D1D5DB] hover:text-white px-3.5 py-2 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="btn-primary py-1.5 px-3.5 text-xs font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 sm:hidden">
          {user && (
            <Link
              href="/discussions/new"
              className="btn-primary py-1.5 px-2.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post</span>
            </Link>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#D1D5DB] hover:text-white rounded-lg focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-[#2A2E39] bg-[#17181D] px-4 py-4 space-y-3 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8C94A6]" />
            <input
              type="text"
              placeholder="Search discussions, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#22252E] border border-[#333744] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#8C94A6] focus:outline-none"
            />
          </form>

          <div className="flex flex-col space-y-1 pt-1 text-sm">
            <Link
              href="/discussions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 font-medium text-[#D1D5DB] hover:text-white rounded-lg hover:bg-[#22252E]"
            >
              Discussions
            </Link>
            <Link
              href="/tags"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 font-medium text-[#D1D5DB] hover:text-white rounded-lg hover:bg-[#22252E]"
            >
              Tags
            </Link>

            {user ? (
              <>
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-medium text-[#D1D5DB] hover:text-white rounded-lg hover:bg-[#22252E]"
                >
                  Saved Posts
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-medium text-[#D1D5DB] hover:text-white rounded-lg hover:bg-[#22252E]"
                >
                  Notifications
                </Link>
                <Link
                  href={`/users/${user.username}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 font-medium text-[#D1D5DB] hover:text-white rounded-lg hover:bg-[#22252E]"
                >
                  Profile (@{user.username})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-rose-400 font-medium hover:bg-[#22252E] rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-[#2A2E39]">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-[#333744] text-white rounded-lg font-medium text-xs"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-[#F45170] text-white rounded-lg font-medium text-xs"
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
