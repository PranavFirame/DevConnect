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
        <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
          <Search className="h-6 w-6 text-[#F45170]" />
          <span>Search Community Discussions</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#697386] mt-1">
          Instant full-text search across discussion titles, code snippets, tags, and authors.
        </p>
      </div>

      {/* Search Form with Filters */}
      <form onSubmit={handleSearchSubmit} className="dev-card p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#697386]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, syntax, libraries..."
            className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
          />
        </div>

        <div className="relative sm:w-48">
          <Hash className="absolute left-3 top-2.5 h-4 w-4 text-[#697386]" />
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Filter by tag..."
            className="w-full bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all"
          />
        </div>

        <button
          type="submit"
          className="btn-primary py-2 px-6 text-sm font-semibold whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Results Count & Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#697386] border-b border-[#E5E7EB] pb-2">
          <span>Found {totalCount} matching results</span>
          {tag && <span className="badge-tag">Tag: #{tag}</span>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          results.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="dev-card text-center py-12 p-8">
            <h3 className="font-bold text-[#17181D] mb-1">
              No matching discussions found
            </h3>
            <p className="text-xs text-[#697386]">
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
