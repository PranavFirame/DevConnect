'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { MessageSquare, Flame, HelpCircle, Filter } from 'lucide-react';

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

      <div className="flex-1 min-w-0 space-y-6">
        {/* Banner header in FlowFest warm peach & neo-brutalist style */}
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
              <MessageSquare className="h-3.5 w-3.5" />
              Community Discussions
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              All Technical Discussions
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
              Explore technical debates, architectural questions, and peer-reviewed code.
            </p>
          </div>

          {selectedTag && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border-2 border-zinc-900 font-bold text-xs shadow-[2px_2px_0px_0px_#18181b]">
              <span>Tag: #{selectedTag}</span>
              <button
                onClick={() => setSelectedTag('')}
                className="hover:text-[#42ed91] font-black text-sm ml-1"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSort('newest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                sort === 'newest'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-[2px_2px_0px_0px_#42ed91]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Newest</span>
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                sort === 'popular'
                  ? 'bg-[#42ed91] text-white shadow-[2px_2px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Top Posts</span>
            </button>
            <button
              onClick={() => setSort('unanswered')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                sort === 'unanswered'
                  ? 'bg-[#ffb800] text-zinc-900 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Unanswered</span>
            </button>
          </div>

          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider hidden sm:inline">
            {discussions.length} Discussions
          </span>
        </div>

        {/* Discussions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((d) => (
              <DiscussionCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No discussions match your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl bg-[#f4f0e6] animate-pulse border-2 border-zinc-900" />}>
      <DiscussionsContent />
    </Suspense>
  );
}
