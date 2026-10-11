'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  CheckCircle2, 
  Bookmark, 
  Pin, 
  Eye,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export interface DiscussionCardProps {
  id: string;
  title: string;
  slug: string;
  content: string;
  score: number;
  commentsCount: number;
  viewsCount: number;
  pinned?: boolean;
  solved?: boolean;
  createdAt: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  isBookmarked?: boolean;
}

export function DiscussionCard({
  id,
  title,
  slug,
  content,
  score: initialScore,
  commentsCount,
  viewsCount,
  pinned = false,
  solved = false,
  createdAt,
  author,
  tags,
  userVote: initialUserVote,
  isBookmarked: initialBookmarked = false,
}: DiscussionCardProps) {
  const { user, token } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) {
      alert('Please log in to vote on discussions.');
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation VoteDiscussion($id: ID!, $type: VoteType!) {
              voteDiscussion(discussionId: $id, type: $type) {
                score
                userVote
              }
            }
          `,
          variables: { id, type },
        }),
      });

      const json = await res.json();
      if (json.data?.voteDiscussion) {
        setScore(json.data.voteDiscussion.score);
        setUserVote(json.data.voteDiscussion.userVote);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !token) {
      alert('Please log in to bookmark discussions.');
      return;
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation ToggleBookmark($id: ID!) {
              toggleBookmark(discussionId: $id) {
                isBookmarked
              }
            }
          `,
          variables: { id },
        }),
      });

      const json = await res.json();
      if (json.data?.toggleBookmark) {
        setIsBookmarked(json.data.toggleBookmark.isBookmarked);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const snippet = content.replace(/```[\s\S]*?```/g, '[Code snippet]').replace(/[*#>`]/g, '').trim().substring(0, 150);

  return (
    <article className="group bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-5 sm:p-6 brutal-card flex gap-4 sm:gap-5">
      {/* Upvote / Downvote column */}
      <div className="flex flex-col items-center justify-start bg-[#fbf9f5] dark:bg-zinc-800 rounded-xl p-1.5 shrink-0 border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] h-fit">
        <button
          onClick={() => handleVote('UPVOTE')}
          title="Upvote"
          disabled={isVoting}
          className={`p-1 rounded-lg transition-colors ${
            userVote === 'UPVOTE'
              ? 'text-white bg-[#f25774]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-[#f25774] hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <ChevronUp className="h-5 w-5 stroke-[2.5]" />
        </button>

        <span className={`text-xs font-black my-1 ${
          userVote === 'UPVOTE' 
            ? 'text-[#f25774]' 
            : userVote === 'DOWNVOTE' 
            ? 'text-rose-600' 
            : 'text-zinc-900 dark:text-white'
        }`}>
          {score}
        </span>

        <button
          onClick={() => handleVote('DOWNVOTE')}
          title="Downvote"
          disabled={isVoting}
          className={`p-1 rounded-lg transition-colors ${
            userVote === 'DOWNVOTE'
              ? 'text-white bg-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <ChevronDown className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          <Link
            href={`/users/${author.username}`}
            className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#f25774]"
          >
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatarUrl}
                alt={author.displayName}
                className="h-5 w-5 rounded-lg border border-zinc-900 object-cover"
              />
            ) : null}
            <span>{author.displayName}</span>
          </Link>

          <span className="text-zinc-400">•</span>
          <span className="text-zinc-500 font-medium">{formatTimeAgo(createdAt)}</span>

          {pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-900 bg-[#ffb800] px-2.5 py-0.5 rounded-full border border-zinc-900 ml-auto">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}

          {solved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-900 bg-[#86efac] px-2.5 py-0.5 rounded-full border border-zinc-900 ml-auto">
              <CheckCircle2 className="h-3 w-3" />
              Solved
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-snug group-hover:text-[#f25774] transition-colors mb-2">
          <Link href={`/discussions/${slug}`}>{title}</Link>
        </h2>

        {/* Content Snippet */}
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed font-normal">
          {snippet}...
        </p>

        {/* Tags and Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-[#fff4d1] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 hover:bg-[#ffb800] transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3.5 text-xs font-bold text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{viewsCount}</span>
            </span>

            <Link
              href={`/discussions/${slug}#replies`}
              className="flex items-center gap-1 hover:text-[#f25774] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{commentsCount}</span>
            </Link>

            <button
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Save Discussion'}
              className={`p-1 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'text-amber-500 fill-amber-500' 
                  : 'text-zinc-400 hover:text-amber-500'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
