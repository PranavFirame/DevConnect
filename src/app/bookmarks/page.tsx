'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Bookmark, Sparkles } from 'lucide-react';

export default function BookmarksPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<DiscussionCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `
              query MyBookmarks {
                bookmarks(limit: 20) {
                  id
                  title
                  slug
                  content
                  score
                  commentsCount
                  viewsCount
                  pinned
                  solved
                  createdAt
                  author {
                    username
                    displayName
                    avatarUrl
                  }
                  tags {
                    id
                    name
                    slug
                  }
                  userVote
                  isBookmarked
                }
              }
            `,
          }),
        });

        const json = await res.json();
        if (json.data?.bookmarks) {
          setBookmarks(json.data.bookmarks);
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [token]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
          <h2 className="text-xl font-black mb-2">Saved Discussions</h2>
          <p className="text-xs font-medium text-zinc-500 mb-6">
            Sign in to view discussions you have saved for future reference.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#42ed91] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider brutal-btn"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <Sidebar />

      <div className="flex-1 min-w-0 space-y-6">
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
            <Bookmark className="h-3.5 w-3.5 fill-zinc-900" />
            Reading List
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            Your Bookmarked Discussions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
            Instant access to technical solutions and architecture notes you saved.
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : bookmarks.length > 0 ? (
            bookmarks.map((d) => <DiscussionCard key={d.id} {...d} />)
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">You haven&apos;t saved any discussions yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
