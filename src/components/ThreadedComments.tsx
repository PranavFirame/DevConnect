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
    <div className="space-y-4">
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
      alert('Report submitted for moderator review. Thank you for keeping DevConnect safe!');
    } catch {
      alert('Failed to submit report.');
    }
  };

  return (
    <div className={`group relative rounded-2xl border-2 border-zinc-900 dark:border-zinc-700 p-5 brutal-card transition-all ${
      comment.isAccepted 
        ? 'bg-[#ffe5dd] dark:bg-zinc-850' 
        : 'bg-white dark:bg-zinc-900'
    } ${comment.depth > 0 ? 'ml-4 sm:ml-8 mt-4' : ''}`}>
      {/* Solution Badge */}
      {comment.isAccepted && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-[#42ed91] border-2 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_#18181b] mb-3">
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          <span>Accepted Solution</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/users/${comment.author.username}`}
            className="flex items-center gap-2 font-black text-zinc-900 dark:text-white hover:text-[#42ed91]"
          >
            {comment.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="h-6 w-6 rounded-lg border border-zinc-900 object-cover"
              />
            ) : null}
            <span>{comment.author.displayName}</span>
          </Link>
          <span>•</span>
          <span className="font-bold">{formatTimeAgo(comment.createdAt)}</span>
        </div>

        {/* Moderation / Solution controls */}
        <div className="flex items-center gap-2">
          {isDiscussionAuthor && onAcceptSolution && (
            <button
              onClick={() => onAcceptSolution(comment.id)}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] transition-transform active:translate-x-0.5 active:translate-y-0.5 ${
                comment.isAccepted
                  ? 'bg-[#42ed91] text-zinc-900'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#42ed91]'
              }`}
            >
              {comment.isAccepted ? 'Unmark Solution' : 'Accept Solution'}
            </button>
          )}

          {(isCommentAuthor || canModerate) && onDeleteComment && (
            <button
              onClick={() => {
                if (confirm('Delete this comment?')) onDeleteComment(comment.id);
              }}
              className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg"
              title="Delete Comment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {user && !isCommentAuthor && (
            <button
              onClick={handleReport}
              className="text-zinc-400 hover:text-amber-500 p-1.5 rounded-lg"
              title="Report Comment"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed mb-4 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* Vote & Reply Actions */}
      <div className="flex items-center gap-3 pt-3 border-t-2 border-zinc-900 dark:border-zinc-800 text-xs">
        <div className="flex items-center bg-[#fbf9f5] dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl p-0.5 shadow-[2px_2px_0px_0px_#18181b]">
          <button
            onClick={() => handleVote('UPVOTE')}
            className={`p-1 rounded-lg transition-colors ${
              userVote === 'UPVOTE'
                ? 'text-white bg-[#42ed91]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-[#42ed91]'
            }`}
          >
            <ChevronUp className="h-4 w-4 stroke-[2.5]" />
          </button>
          <span className="font-black px-2 text-zinc-900 dark:text-white">{score}</span>
          <button
            onClick={() => handleVote('DOWNVOTE')}
            className={`p-1 rounded-lg transition-colors ${
              userVote === 'DOWNVOTE'
                ? 'text-white bg-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
            }`}
          >
            <ChevronDown className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {user && comment.depth < 5 && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#18181b] hover:bg-zinc-100 transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <CornerDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply input field */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="mt-4 pt-3 border-t-2 border-zinc-900 dark:border-zinc-800 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author.displayName}...`}
            className="w-full text-xs font-medium p-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-[#fbf9f5] dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[2px_2px_0px_0px_#18181b] focus:outline-none"
            rows={2}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-800 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="bg-[#42ed91] hover:bg-[#2dd87d] text-zinc-900 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl brutal-btn disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Recursive nested child comments */}
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
