'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Search, Hash, Sparkles } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [results, setResults] = useState<DiscussionCardProps[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (q: string, t: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query SearchDiscussions($query: String!, $tag: String) {
              search(query: $query, tag: $tag) {
                totalCount
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
            }
          `,
          variables: { query: q, tag: t || undefined },
        }),
      });

      const json = await res.json();
      if (json.data?.search) {
        setResults(json.data.search.discussions);
        setTotalCount(json.data.search.totalCount);
      }
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(query, tag);
  }, [query, tag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, tag);
  };

  return (
    <div className="flex gap-8">
      <Sidebar />

      <div className="flex-1 min-w-0 space-y-6">
        {/* Banner header in FlowFest warm peach & neo-brutalist style */}
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
            <Search className="h-3.5 w-3.5" />
            Fast Search
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            Search Community Discussions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1 mb-5">
            Full-text search across titles, markdown content, tags, and authors.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords, syntax, libraries..."
                className="w-full bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
              />
            </div>

            <div className="relative sm:w-44">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag filter..."
                className="w-full bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl brutal-btn"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Count & Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-500 border-b-2 border-zinc-900 dark:border-zinc-800 pb-2">
            <span>Found {totalCount} discussions</span>
            {tag && <span>Tag filter: #{tag}</span>}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((d) => <DiscussionCard key={d.id} {...d} />)
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
              <h3 className="font-black text-zinc-900 dark:text-white mb-1">
                No matching discussions found
              </h3>
              <p className="text-xs font-medium text-zinc-500">
                Try searching with broader keywords or clear the tag filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl bg-[#f4f0e6] animate-pulse border-2 border-zinc-900" />}>
      <SearchPageContent />
    </Suspense>
  );
}
