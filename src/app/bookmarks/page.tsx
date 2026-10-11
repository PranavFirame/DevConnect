'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Bookmark } from 'lucide-react';

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
      <div className="max-w-md mx-auto py-16 text-center dev-card p-8">
        <h2 className="text-xl font-bold text-[#17181D] mb-2">Saved Discussions</h2>
        <p className="text-sm text-[#697386] mb-6">
          Sign in to view discussions you have saved for reference.
        </p>
        <Link
          href="/login"
          className="btn-primary px-5 py-2.5 text-sm font-semibold inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-amber-500 fill-amber-500" />
          <span>Your Bookmarked Discussions</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#697386] mt-1">
          Quickly access reference guides, solutions, and code discussions you saved.
        </p>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          bookmarks.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="dev-card text-center py-12 p-8 text-[#697386] text-sm">
            <p>You haven&apos;t saved any discussions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
