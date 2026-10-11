'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Plus, Filter, Flame, HelpCircle, ArrowRight, Code2, Users } from 'lucide-react';

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
    <div className="flex gap-7 lg:gap-8 items-start">
      {/* Left Sidebar */}
      <Sidebar popularTags={popularTags} />

      {/* Main Column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Balanced, Professional Hero Section */}
        <section className="dev-card p-6 sm:p-8 bg-gradient-to-r from-white via-white to-[#FDF4F6] dark:from-[#16181E] dark:via-[#16181E] dark:to-[#1E171B] border border-[#E5E7EB] dark:border-[#282C37] relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#F45170] bg-[#FFEAEF] dark:bg-[#2D1820] mb-3.5">
              THE DEVELOPER COMMUNITY
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold text-[#17181D] dark:text-white tracking-tight leading-tight mb-2.5">
              Where developers <span className="text-[#F45170]">connect</span>, discuss, and build together.
            </h1>

            <p className="text-sm text-[#697386] dark:text-[#9CA3AF] leading-relaxed mb-6 font-normal">
              Share code, discuss architecture, and find practical solutions with developers around the world.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/discussions/new"
                className="btn-primary py-2 px-4.5 text-xs font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Start a Discussion</span>
              </Link>
              <Link
                href="/tags"
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                <span>Explore Topics</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#697386]" />
              </Link>
            </div>
          </div>

          {/* Purposeful subtle technical decoration */}
          <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#FCD5DE]/60 dark:border-[#38202A] items-center justify-center pointer-events-none opacity-80">
            <div className="w-32 h-32 rounded-full border border-[#FCD5DE] dark:border-[#38202A] flex items-center justify-center">
              <Code2 className="h-10 w-10 text-[#F45170]/40 stroke-[1.5]" />
            </div>
          </div>
        </section>

        {/* Clean Feed Toolbar */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#282C37] pb-3">
          <div className="flex items-center gap-1 bg-[#EBECEF] dark:bg-[#1E2129] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'newest'
                  ? 'bg-white dark:bg-[#16181E] text-[#17181D] dark:text-white shadow-xs'
                  : 'text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D]'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Latest</span>
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'popular'
                  ? 'bg-white dark:bg-[#16181E] text-[#17181D] dark:text-white shadow-xs'
                  : 'text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D]'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-[#F45170]" />
              <span>Top Posts</span>
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'unanswered'
                  ? 'bg-white dark:bg-[#16181E] text-[#17181D] dark:text-white shadow-xs'
                  : 'text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D]'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Unanswered</span>
            </button>
          </div>

          <span className="text-xs font-medium text-[#697386] dark:text-[#9CA3AF] hidden sm:inline">
            {discussions.length} discussions
          </span>
        </div>

        {/* Discussion Cards Feed */}
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white dark:bg-[#16181E] border border-[#E5E7EB] dark:border-[#282C37] animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          <div className="space-y-3.5">
            {discussions.map((d) => (
              <DiscussionCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 dev-card p-8">
            <h3 className="font-bold text-[#17181D] dark:text-white mb-1 text-sm">No discussions yet</h3>
            <p className="text-xs text-[#697386] dark:text-[#9CA3AF] mb-4">Start the conversation and share an insight or question.</p>
            <Link
              href="/discussions/new"
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              Start a Discussion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
