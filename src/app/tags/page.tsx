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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#17181D] flex items-center gap-2">
            <Hash className="h-6 w-6 text-[#F45170]" />
            <span>Explore Technical Tags</span>
          </h1>
          <p className="text-sm text-[#697386] mt-1">
            Browse through frameworks, languages, databases, and architectural concepts.
          </p>
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter tags..."
          className="bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-sm text-[#17181D] placeholder:text-[#697386] focus:outline-none focus:ring-2 focus:ring-[#F45170]/30 focus:border-[#F45170] transition-all shadow-xs"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/tags/${t.slug}`}
              className="group dev-card p-4.5 hover:border-[#F45170] transition-all flex flex-col justify-between"
            >
              <div>
                <span className="badge-tag mb-2.5 inline-block">
                  #{t.name}
                </span>
                <p className="text-xs text-[#697386] line-clamp-2 leading-relaxed">
                  {t.description || 'Community discussion topic.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#697386] pt-3 border-t border-[#E5E7EB] mt-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t.postCount} posts</span>
                </span>
                <span className="text-[#F45170] font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
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
