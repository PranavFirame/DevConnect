'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Hash, MessageSquare, Sparkles, Flame } from 'lucide-react';

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
    <div className="flex gap-8">
      <Sidebar popularTags={tags.slice(0, 8)} />

      <div className="flex-1 min-w-0 space-y-6">
        {/* Banner header in FlowFest warm peach & neo-brutalist style */}
        <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-7 shadow-[4px_4px_0px_0px_#18181b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffb800] border-2 border-zinc-900 text-zinc-900 mb-2 shadow-[2px_2px_0px_0px_#18181b]">
              <Hash className="h-3.5 w-3.5" />
              Topic Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Explore Technical Tags
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1">
              Browse frameworks, languages, system architecture, and database topics.
            </p>
          </div>

          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tags..."
            className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
          />
        </div>

        {/* Tags Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/tags/${t.slug}`}
                className="group bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-5 brutal-card flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-[#fff4d1] text-zinc-900 border border-zinc-900 mb-2.5">
                    #{t.name}
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                    {t.description || 'Community discussions and developer insights.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 pt-3 border-t-2 border-zinc-100 dark:border-zinc-800 mt-3">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#42ed91]" />
                    <span>{t.postCount} posts</span>
                  </span>
                  <span className="text-[#42ed91] font-black uppercase tracking-wider text-[11px] group-hover:translate-x-1 transition-transform">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
