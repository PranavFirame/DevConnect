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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>All Tags</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-md text-sm font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            #{tag?.name || slug}
          </span>
          <span className="text-xs text-slate-400">
            {discussions.length} discussions
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {tag?.description || `Explore questions and conversations about #${slug}.`}
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          discussions.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <p className="text-sm text-slate-500">No discussions posted with this tag yet.</p>
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
