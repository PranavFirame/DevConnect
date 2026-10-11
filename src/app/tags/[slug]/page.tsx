'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { DiscussionCard, DiscussionCardProps } from '@/components/DiscussionCard';
import { Hash, ArrowLeft } from 'lucide-react';

interface TagInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount: number;
}

function TagDetailInner({ slug }: { slug: string }) {

  const [tag, setTag] = useState<TagInfo | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTagDiscussions = async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query TagPageData($slug: String!) {
                tag(slug: $slug) {
                  id
                  name
                  slug
                  description
                  postCount
                }
                discussions(tag: $slug, limit: 20) {
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
            variables: { slug },
          }),
        });

        const json = await res.json();
        if (json.data?.tag) setTag(json.data.tag);
        if (json.data?.discussions?.discussions) {
          setDiscussions(json.data.discussions.discussions);
        }
      } catch (err) {
        console.error('Failed to load tag details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTagDiscussions();
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/tags"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] hover:bg-zinc-100 transition-transform active:translate-x-0.5 active:translate-y-0.5"
      >
        <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
        <span>All Tags</span>
      </Link>

      <div className="bg-[#ffe5dd] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_#18181b]">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#42ed91] border-2 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
            #{tag?.name || slug}
          </span>
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            {discussions.length} discussions
          </span>
        </div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-2">
          {tag?.description || `Explore questions and conversations about #${slug}.`}
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#f4f0e6] dark:bg-zinc-800 border-2 border-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          discussions.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border-2 border-zinc-900 rounded-2xl p-8 shadow-[4px_4px_0px_0px_#18181b]">
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No discussions posted with this tag yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <React.Suspense fallback={<div className="h-40 rounded-xl bg-slate-200 animate-pulse" />}>
      <TagDetailInner slug={resolvedParams.slug} />
    </React.Suspense>
  );
}
