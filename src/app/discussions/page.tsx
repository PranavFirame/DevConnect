'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { MessageSquare, Filter } from 'lucide-react';

function DiscussionsContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') || '';

  const [discussions, setDiscussions] = useState<DiscussionCardProps[]>([]);
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sort, setSort] = useState<'newest' | 'popular' | 'unanswered'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query DiscussionsFeed($sort: String, $tag: String) {
                discussions(limit: 20, sort: $sort, tag: $tag) {
                  discussions {
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
                tags(limit: 15) {
                  id
                  name
                  slug
                  postCount
                }
              }
            `,
            variables: { sort, tag: selectedTag || undefined },
          }),
        });

        const json = await res.json();
        if (json.data?.discussions?.discussions) {
          setDiscussions(json.data.discussions.discussions);
        }
        if (json.data?.tags) {
          setPopularTags(json.data.tags);
        }
      } catch (err) {
        console.error('Failed to load discussions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, [sort, selectedTag]);

  return (
    <div className="flex gap-8">
      <Sidebar popularTags={popularTags} />

      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <span>All Discussions</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Explore technical debates, architecture reviews, and questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedTag && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <span>Tag: #{selectedTag}</span>
                <button
                  onClick={() => setSelectedTag('')}
                  className="hover:text-blue-900 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setSort('newest')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sort === 'newest'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sort === 'popular'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setSort('unanswered')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sort === 'unanswered'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Unanswered
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((d) => (
              <DiscussionCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <p className="text-sm text-slate-500">No discussions match your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-xl bg-slate-200 animate-pulse" />}>
      <DiscussionsContent />
    </Suspense>
  );
}
