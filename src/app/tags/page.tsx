'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Hash, TrendingUp, MessageSquare } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query TagsCatalog {
                tags(limit: 50) {
                  id
                  name
                  slug
                  description
                  postCount
                }
              }
            `,
          }),
        });

        const json = await res.json();
        if (json.data?.tags) {
          setTags(json.data.tags);
        }
      } catch (err) {
        console.error('Failed to load tags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="h-6 w-6 text-blue-600" />
            <span>Explore Technical Tags</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse through frameworks, languages, databases, and architectural concepts.
          </p>
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter tags..."
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/tags/${t.slug}`}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-2">
                  #{t.name}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {t.description || 'Community discussion topic.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                <span className="flex items-center gap-1 font-medium">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{t.postCount} posts</span>
                </span>
                <span className="text-blue-600 font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
