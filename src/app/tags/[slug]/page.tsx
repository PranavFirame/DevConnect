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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>All Tags</span>
      </Link>

      <div className="dev-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-tag text-xs font-bold py-1 px-3">
            #{tag?.name || slug}
          </span>
          <span className="text-xs text-[#697386]">
            {discussions.length} discussions
          </span>
        </div>
        <p className="text-sm text-[#697386] mt-2">
          {tag?.description || `Explore questions and conversations about #${slug}.`}
        </p>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          discussions.map((d) => <DiscussionCard key={d.id} {...d} />)
        ) : (
          <div className="dev-card text-center py-12 p-8 text-[#697386] text-sm">
            <p>No discussions posted with this tag yet.</p>
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
