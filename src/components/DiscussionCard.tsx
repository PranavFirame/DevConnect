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
  Eye
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

  const snippet = content.replace(/```[\s\S]*?```/g, '[Code snippet]').replace(/[*#>`]/g, '').trim().substring(0, 160);

  return (
    <article className="dev-card p-4 sm:p-5 flex gap-3.5 sm:gap-4.5 group">
      {/* Vote Column */}
      <div className="flex flex-col items-center justify-start bg-[#F8F9FA] dark:bg-[#1E2129] rounded-xl p-1 shrink-0 h-fit border border-[#E5E7EB] dark:border-[#282C37]">
        <button
          onClick={() => handleVote('UPVOTE')}
          title="Upvote"
          disabled={isVoting}
          className={`p-1 rounded-md transition-colors ${
            userVote === 'UPVOTE'
              ? 'text-[#F45170] bg-[#FFEAEF] dark:bg-[#2D1820]'
              : 'text-[#697386] hover:text-[#F45170] hover:bg-[#ECEFF3] dark:hover:bg-[#282C37]'
          }`}
        >
          <ChevronUp className="h-4 w-4 stroke-[2.5]" />
        </button>

        <span className={`text-xs font-bold my-1 ${
          userVote === 'UPVOTE' 
            ? 'text-[#F45170]' 
            : userVote === 'DOWNVOTE' 
            ? 'text-rose-600' 
            : 'text-[#17181D] dark:text-[#F3F4F6]'
        }`}>
          {score}
        </span>

        <button
          onClick={() => handleVote('DOWNVOTE')}
          title="Downvote"
          disabled={isVoting}
          className={`p-1 rounded-md transition-colors ${
            userVote === 'DOWNVOTE'
              ? 'text-zinc-900 bg-zinc-200 dark:bg-zinc-700'
              : 'text-[#697386] hover:text-zinc-900 hover:bg-[#ECEFF3] dark:hover:bg-[#282C37]'
          }`}
        >
          <ChevronDown className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
          <Link
            href={`/users/${author.username}`}
            className="flex items-center gap-1.5 font-semibold text-[#17181D] dark:text-[#F3F4F6] hover:text-[#F45170] transition-colors"
          >
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatarUrl}
                alt={author.displayName}
                className="h-5 w-5 rounded-full border border-[#E5E7EB] dark:border-[#282C37] object-cover"
              />
            ) : null}
            <span>{author.displayName}</span>
          </Link>

          <span className="text-[#9CA3AF]">•</span>
          <span className="text-[#697386] dark:text-[#9CA3AF]">{formatTimeAgo(createdAt)}</span>

          {pinned && (
            <span className="badge-pinned ml-auto">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}

          {solved && (
            <span className="badge-solved ml-auto">
              <CheckCircle2 className="h-3 w-3" />
              Solved
            </span>
          )}
        </div>

        {/* Discussion Title */}
        <h2 className="text-base sm:text-[1.0625rem] font-bold text-[#17181D] dark:text-white leading-snug group-hover:text-[#F45170] transition-colors mb-2">
          <Link href={`/discussions/${slug}`}>{title}</Link>
        </h2>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-[#697386] dark:text-[#9CA3AF] line-clamp-2 mb-3.5 leading-relaxed font-normal">
          {snippet}...
        </p>

        {/* Tags and Footer Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#F0F2F5] dark:border-[#20242D]">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="badge-tag"
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[#697386] dark:text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{viewsCount}</span>
            </span>

            <Link
              href={`/discussions/${slug}#replies`}
              className="flex items-center gap-1.5 hover:text-[#F45170] transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{commentsCount}</span>
            </Link>

            <button
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Save Discussion'}
              className={`p-1 rounded-md transition-colors ${
                isBookmarked 
                  ? 'text-[#FFBD08] fill-[#FFBD08]' 
                  : 'text-[#9CA3AF] hover:text-[#FFBD08]'
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
