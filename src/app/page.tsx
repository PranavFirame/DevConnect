'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Sparkles, Flame, HelpCircle, PlusCircle, Filter, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [discussions, setDiscussions] = useState<DiscussionCardProps[]>([]);
  const [popularTags, setPopularTags] = useState([]);
  const [activeTab, setActiveTab] = useState<'newest' | 'popular' | 'unanswered'>('newest');
  const [loading, setLoading] = useState(true);

  const fetchData = async (sort: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query HomeData($sort: String) {
              discussions(limit: 15, sort: $sort) {
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
              tags(limit: 10) {
                id
                name
                slug
                postCount
              }
            }
          `,
          variables: { sort },
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
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  return (
    <div className="flex gap-8">
      {/* Sidebar for Navigation and Popular Tags */}
      <Sidebar popularTags={popularTags} />

      {/* Main Discussion Feed */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Banner hero inspired by FlowFest lively typography and festival feel */}
        <div className="relative overflow-hidden rounded-3xl bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 p-6 sm:p-9 text-zinc-900 dark:text-white shadow-[4px_4px_0px_0px_#18181b]">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-3 shadow-[2px_2px_0px_0px_#18181b]">
              <Sparkles className="h-3.5 w-3.5" />
              Community Festival of Code
            </span>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 leading-tight">
              Where Developers <span className="text-[#42ed91]">Connect</span>, Discuss, and Build Together.
            </h1>

            <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base font-medium leading-relaxed mb-6">
              Drop your code questions, share architecture deep dives, and exchange solutions with developers worldwide.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/discussions/new"
                className="inline-flex items-center gap-2 bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl brutal-btn"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Start a Discussion</span>
              </Link>
              <Link
                href="/tags"
                className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 hover:bg-[#fff4d1] hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors shadow-[2px_2px_0px_0px_#18181b]"
              >
                <span>Browse Topics</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Retro-styled sun graphic backdrop */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-[#ffb800]/20 border-4 border-dashed border-[#ffb800]/40 pointer-events-none flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-[#42ed91]/20 border-2 border-[#42ed91]/40" />
          </div>
        </div>

        {/* Feed Filter Tabs */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('newest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'newest'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-[2px_2px_0px_0px_#42ed91]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 border border-transparent'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Latest</span>
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'popular'
                  ? 'bg-[#42ed91] text-white shadow-[2px_2px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 border border-transparent'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Top Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'unanswered'
                  ? 'bg-[#ffb800] text-zinc-900 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 border border-transparent'
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

        {/* Discussion List */}
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
            <h3 className="font-black text-zinc-900 dark:text-white mb-1">No discussions found</h3>
            <p className="text-xs text-zinc-500 mb-4 font-medium">Be the first developer to start a conversation in this topic.</p>
            <Link
              href="/discussions/new"
              className="inline-flex items-center gap-1.5 bg-[#42ed91] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider brutal-btn"
            >
              Create Discussion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
