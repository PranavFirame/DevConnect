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
    <div className={`group relative rounded-xl border p-4 transition-all ${
      comment.isAccepted 
        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
    } ${comment.depth > 0 ? 'ml-4 sm:ml-8 mt-3' : ''}`}>
      {/* Solution Badge */}
      {comment.isAccepted && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Accepted Solution</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/users/${comment.author.username}`}
            className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            {comment.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : null}
            <span>{comment.author.displayName}</span>
          </Link>
          <span>•</span>
          <span>{formatTimeAgo(comment.createdAt)}</span>
        </div>

        {/* Moderation / Solution controls */}
        <div className="flex items-center gap-2">
          {isDiscussionAuthor && onAcceptSolution && (
            <button
              onClick={() => onAcceptSolution(comment.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                comment.isAccepted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600'
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
              className="text-slate-400 hover:text-rose-600 p-1 rounded"
              title="Delete Comment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {user && !isCommentAuthor && (
            <button
              onClick={handleReport}
              className="text-slate-400 hover:text-amber-500 p-1 rounded"
              title="Report Comment"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-3 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* Vote & Reply Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 rounded px-1.5 py-0.5">
          <button
            onClick={() => handleVote('UPVOTE')}
            className={`p-0.5 rounded ${userVote === 'UPVOTE' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-blue-600'}`}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{score}</span>
          <button
            onClick={() => handleVote('DOWNVOTE')}
            className={`p-0.5 rounded ${userVote === 'DOWNVOTE' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-rose-600'}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {user && comment.depth < 5 && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply input field */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author.displayName}...`}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
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
