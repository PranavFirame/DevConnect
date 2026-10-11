'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  CornerDownRight, 
  CheckCircle2, 
  Trash2, 
  Flag 
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export interface CommentNode {
  id: string;
  content: string;
  score: number;
  depth: number;
  isAccepted: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  replies: CommentNode[];
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
}

interface ThreadedCommentsProps {
  comments: CommentNode[];
  discussionId: string;
  discussionAuthorId?: string;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  onAcceptSolution?: (commentId: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export function ThreadedComments({
  comments,
  discussionId,
  discussionAuthorId,
  onReplySubmit,
  onAcceptSolution,
  onDeleteComment,
}: ThreadedCommentsProps) {
  return (
    <div className="space-y-3.5">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          discussionId={discussionId}
          discussionAuthorId={discussionAuthorId}
          onReplySubmit={onReplySubmit}
          onAcceptSolution={onAcceptSolution}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  discussionId,
  discussionAuthorId,
  onReplySubmit,
  onAcceptSolution,
  onDeleteComment,
}: {
  comment: CommentNode;
  discussionId: string;
  discussionAuthorId?: string;
  onReplySubmit: (parentId: string, content: string) => Promise<void>;
  onAcceptSolution?: (commentId: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}) {
  const { user, token } = useAuth();
  const [score, setScore] = useState(comment.score);
  const [userVote, setUserVote] = useState(comment.userVote);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDiscussionAuthor = user?.id === discussionAuthorId;
  const isCommentAuthor = user?.id === comment.author.id;
  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!user || !token) {
      alert('Please log in to vote on replies.');
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
            mutation VoteComment($id: ID!, $type: VoteType!) {
              voteComment(commentId: $id, type: $type) {
                score
                userVote
              }
            }
          `,
          variables: { id: comment.id, type },
        }),
      });

      const json = await res.json();
      if (json.data?.voteComment) {
        setScore(json.data.voteComment.score);
        setUserVote(json.data.voteComment.userVote);
      }
    } catch (err) {
      console.error('Comment vote failed:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReplySubmit(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    } catch (err) {
      console.error('Submit reply failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please describe why this comment violates DevConnect guidelines:');
    if (!reason || !reason.trim() || !token) return;

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation ReportContent($commentId: ID, $reason: String!) {
              reportContent(commentId: $commentId, reason: $reason) {
                id
              }
            }
          `,
          variables: { commentId: comment.id, reason: reason.trim() },
        }),
      });
      alert('Report submitted for moderator review.');
    } catch {
      alert('Failed to submit report.');
    }
  };

  return (
    <div className={`dev-card p-4 transition-all ${
      comment.isAccepted 
        ? 'border-emerald-300 dark:border-emerald-800 bg-[#F0FDF4] dark:bg-[#062415]/40' 
        : 'bg-white dark:bg-[#16181E]'
    } ${comment.depth > 0 ? 'ml-4 sm:ml-8 mt-2.5' : ''}`}>
      {/* Accepted Solution indicator */}
      {comment.isAccepted && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2.5">
          <CheckCircle2 className="h-4 w-4" />
          <span>Accepted Solution</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-center justify-between text-xs text-[#697386] dark:text-[#9CA3AF] mb-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/users/${comment.author.username}`}
            className="flex items-center gap-1.5 font-semibold text-[#17181D] dark:text-[#F3F4F6] hover:text-[#F45170]"
          >
            {comment.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="h-5 w-5 rounded-full object-cover border border-[#E5E7EB] dark:border-[#282C37]"
              />
            ) : null}
            <span>{comment.author.displayName}</span>
          </Link>
          <span>•</span>
          <span>{formatTimeAgo(comment.createdAt)}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isDiscussionAuthor && onAcceptSolution && (
            <button
              onClick={() => onAcceptSolution(comment.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                comment.isAccepted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F0F2F5] dark:bg-[#1E2129] text-[#697386] hover:text-emerald-600'
              }`}
            >
              {comment.isAccepted ? 'Unmark Solution' : 'Accept Solution'}
            </button>
          )}

          {(isCommentAuthor || canModerate) && onDeleteComment && (
            <button
              onClick={() => {
                if (confirm('Delete this reply?')) onDeleteComment(comment.id);
              }}
              className="text-[#9CA3AF] hover:text-rose-600 p-1 rounded"
              title="Delete Reply"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {user && !isCommentAuthor && (
            <button
              onClick={handleReport}
              className="text-[#9CA3AF] hover:text-amber-500 p-1 rounded"
              title="Report Reply"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reply Body */}
      <div className="text-xs sm:text-sm text-[#17181D] dark:text-[#F3F4F6] leading-relaxed mb-3 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* Vote & Reply Buttons */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#F0F2F5] dark:border-[#20242D] text-xs">
        <div className="flex items-center gap-1 bg-[#F8F9FA] dark:bg-[#1E2129] rounded-md px-1.5 py-0.5 border border-[#E5E7EB] dark:border-[#282C37]">
          <button
            onClick={() => handleVote('UPVOTE')}
            className={`p-0.5 rounded ${userVote === 'UPVOTE' ? 'text-[#F45170] font-bold' : 'text-[#697386] hover:text-[#F45170]'}`}
          >
            <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
          <span className="font-bold text-[#17181D] dark:text-[#F3F4F6] text-xs px-1">{score}</span>
          <button
            onClick={() => handleVote('DOWNVOTE')}
            className={`p-0.5 rounded ${userVote === 'DOWNVOTE' ? 'text-zinc-900 font-bold' : 'text-[#697386] hover:text-zinc-900'}`}
          >
            <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>

        {user && comment.depth < 5 && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-[#697386] hover:text-[#F45170] font-semibold py-1 px-2 rounded-md hover:bg-[#F0F2F5] dark:hover:bg-[#1E2129] transition-colors"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply Input Box */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#282C37] space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author.displayName}...`}
            className="w-full text-xs p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#282C37] bg-[#F8F9FA] dark:bg-[#1E2129] focus:outline-none focus:border-[#F45170] text-[#17181D] dark:text-white"
            rows={2}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="text-xs px-2.5 py-1 text-[#697386] hover:text-[#17181D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="btn-primary py-1 px-3 text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Nested Replies Tree */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              discussionId={discussionId}
              discussionAuthorId={discussionAuthorId}
              onReplySubmit={onReplySubmit}
              onAcceptSolution={onAcceptSolution}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
