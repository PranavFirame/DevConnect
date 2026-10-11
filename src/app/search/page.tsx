'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Search, Hash, Filter } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-600" />
          <span>Search Community Discussions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Instant full-text search across discussion titles, code snippets, tags, and authors.
        </p>
      </div>

      {/* Search Form with Filters */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, syntax, libraries..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative sm:w-48">
          <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Filter by tag..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results Count & Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>Found {totalCount} matching results</span>
          {tag && <span>Filtered by tag: #{tag}</span>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          results.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No matching discussions found
            </h3>
            <p className="text-xs text-slate-500">
              Try searching with broader terms or check spelling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-xl bg-slate-200 animate-pulse" />}>
      <SearchPageContent />
    </Suspense>
  );
}
