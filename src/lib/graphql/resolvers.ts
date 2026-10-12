import { GraphQLContext } from './context';
import { hashPassword, comparePassword, signToken } from '@/lib/auth';
import {
  registerSchema,
  loginSchema,
  createDiscussionSchema,
  updateDiscussionSchema,
  createCommentSchema,
  updateCommentSchema,
  reportSchema,
} from '@/lib/validation';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) return null;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.currentUser.userId },
        include: {
          _count: {
            select: { discussions: true, comments: true },
          },
        },
      });

      if (!user) return null;

      return {
        ...user,
        discussionsCount: user._count.discussions,
        commentsCount: user._count.comments,
        createdAt: user.createdAt.toISOString(),
      };
    },

    user: async (_: unknown, { username }: { username: string }, ctx: GraphQLContext) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username },
        include: {
          _count: {
            select: { discussions: true, comments: true },
          },
        },
      });

      if (!user) return null;

      return {
        ...user,
        discussionsCount: user._count.discussions,
        commentsCount: user._count.comments,
        createdAt: user.createdAt.toISOString(),
      };
    },

    discussions: async (
      _: unknown,
      {
        page = 1,
        limit = 10,
        sort = 'newest',
        tag,
        author,
      }: { page?: number; limit?: number; sort?: string; tag?: string; author?: string },
      ctx: GraphQLContext
    ) => {
      const skip = Math.max(0, (page - 1) * limit);
      const take = Math.min(50, Math.max(1, limit));

      const where: Record<string, unknown> = {};
      if (author) {
        where.author = { username: author };
      }
      if (tag) {
        where.tags = {
          some: {
            tag: { slug: tag },
          },
        };
      }

      const orderBy: Record<string, 'asc' | 'desc'>[] = [{ pinned: 'desc' }];
      if (sort === 'popular' || sort === 'top') {
        orderBy.push({ score: 'desc' });
      } else if (sort === 'unanswered') {
        where.solved = false;
        where.commentsCount = 0;
        orderBy.push({ createdAt: 'desc' });
      } else {
        orderBy.push({ createdAt: 'desc' });
      }

      const [discussions, totalCount] = await Promise.all([
        ctx.prisma.discussion.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            author: true,
            tags: { include: { tag: true } },
            solvedComment: { include: { author: true } },
            votes: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
            bookmarks: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
          },
        }),
        ctx.prisma.discussion.count({ where }),
      ]);

      const formatted = discussions.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        tags: d.tags.map((t) => t.tag),
        userVote: d.votes && d.votes.length > 0 ? d.votes[0].type : null,
        isBookmarked: Boolean(d.bookmarks && d.bookmarks.length > 0),
        solvedComment: d.solvedComment
          ? {
              ...d.solvedComment,
              createdAt: d.solvedComment.createdAt.toISOString(),
              updatedAt: d.solvedComment.updatedAt.toISOString(),
            }
          : null,
      }));

      return {
        discussions: formatted,
        totalCount,
        hasMore: skip + take < totalCount,
      };
    },

    discussion: async (
      _: unknown,
      { slug, id }: { slug?: string; id?: string },
      ctx: GraphQLContext
    ) => {
      const d = await ctx.prisma.discussion.findFirst({
        where: slug ? { slug } : { id },
        include: {
          author: true,
          tags: { include: { tag: true } },
          solvedComment: { include: { author: true } },
          votes: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
          bookmarks: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
        },
      });

      if (!d) return null;

      // Increment view count in background
      ctx.prisma.discussion.update({
        where: { id: d.id },
        data: { viewsCount: { increment: 1 } },
      }).catch((err) => console.warn('[Discussion] View increment error:', err));

      return {
        ...d,
        viewsCount: d.viewsCount + 1,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        tags: d.tags.map((t) => t.tag),
        userVote: d.votes && d.votes.length > 0 ? d.votes[0].type : null,
        isBookmarked: Boolean(d.bookmarks && d.bookmarks.length > 0),
        solvedComment: d.solvedComment
          ? {
              ...d.solvedComment,
              createdAt: d.solvedComment.createdAt.toISOString(),
              updatedAt: d.solvedComment.updatedAt.toISOString(),
            }
          : null,
      };
    },

    comments: async (
      _: unknown,
      { discussionId }: { discussionId: string },
      ctx: GraphQLContext
    ) => {
      const allComments = await ctx.prisma.comment.findMany({
        where: { discussionId },
        orderBy: [{ isAccepted: 'desc' }, { score: 'desc' }, { createdAt: 'asc' }],
        include: {
          author: true,
          votes: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
        },
      });

      type CommentItem = (typeof allComments)[0] & {
        replies: CommentItem[];
        userVote: 'UPVOTE' | 'DOWNVOTE' | null;
        createdAtFormatted: string;
        updatedAtFormatted: string;
      };

      const map = new Map<string, CommentItem>();
      const roots: CommentItem[] = [];

      allComments.forEach((c) => {
        map.set(c.id, {
          ...c,
          replies: [],
          userVote: c.votes && c.votes.length > 0 ? c.votes[0].type : null,
          createdAtFormatted: c.createdAt.toISOString(),
          updatedAtFormatted: c.updatedAt.toISOString(),
        });
      });

      map.forEach((item) => {
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId)!.replies.push(item);
        } else {
          roots.push(item);
        }
      });

      return roots.map(function formatNode(node: CommentItem): Record<string, unknown> {
        return {
          ...node,
          createdAt: node.createdAtFormatted,
          updatedAt: node.updatedAtFormatted,
          replies: node.replies.map(formatNode),
        };
      });
    },

    search: async (
      _: unknown,
      {
        query,
        page = 1,
        limit = 10,
        tag,
      }: { query: string; page?: number; limit?: number; tag?: string },
      ctx: GraphQLContext
    ) => {
      const clean = query.trim().toLowerCase();
      const skip = Math.max(0, (page - 1) * limit);
      const take = Math.min(50, Math.max(1, limit));

      const where: Record<string, unknown> = {};
      if (clean) {
        where.OR = [
          { title: { contains: clean, mode: 'insensitive' } },
          { content: { contains: clean, mode: 'insensitive' } },
          { author: { username: { contains: clean, mode: 'insensitive' } } },
          { tags: { some: { tag: { name: { contains: clean, mode: 'insensitive' } } } } },
        ];
      }
      if (tag) {
        where.tags = { some: { tag: { slug: tag } } };
      }

      const [discussions, totalCount] = await Promise.all([
        ctx.prisma.discussion.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
            tags: { include: { tag: true } },
            votes: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
            bookmarks: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
          },
        }),
        ctx.prisma.discussion.count({ where }),
      ]);

      const formatted = discussions.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        tags: d.tags.map((t) => t.tag),
        userVote: d.votes && d.votes.length > 0 ? d.votes[0].type : null,
        isBookmarked: Boolean(d.bookmarks && d.bookmarks.length > 0),
      }));

      return { discussions: formatted, totalCount };
    },

    tags: async (_: unknown, { limit = 30 }: { limit?: number }, ctx: GraphQLContext) => {
      const tags = await ctx.prisma.tag.findMany({
        take: limit,
        orderBy: { postCount: 'desc' },
      });
      return tags;
    },

    tag: async (_: unknown, { slug }: { slug: string }, ctx: GraphQLContext) => {
      const tag = await ctx.prisma.tag.findUnique({ where: { slug } });
      return tag || null;
    },

    bookmarks: async (
      _: unknown,
      { page = 1, limit = 10 }: { page?: number; limit?: number },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const skip = Math.max(0, (page - 1) * limit);
      const saved = await ctx.prisma.bookmark.findMany({
        where: { userId: ctx.currentUser.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          discussion: {
            include: {
              author: true,
              tags: { include: { tag: true } },
              votes: { where: { userId: ctx.currentUser.userId } },
            },
          },
        },
      });

      return saved.map((b) => ({
        ...b.discussion,
        createdAt: b.discussion.createdAt.toISOString(),
        updatedAt: b.discussion.updatedAt.toISOString(),
        tags: b.discussion.tags.map((t) => t.tag),
        userVote: b.discussion.votes.length > 0 ? b.discussion.votes[0].type : null,
        isBookmarked: true,
      }));
    },

    notifications: async (
      _: unknown,
      { limit = 20 }: { limit?: number },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const notifications = await ctx.prisma.notification.findMany({
        where: { userId: ctx.currentUser.userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: true },
      });

      return notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }));
    },

    unreadNotificationsCount: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) return 0;
      return await ctx.prisma.notification.count({
        where: { userId: ctx.currentUser.userId, read: false },
      });
    },

    reports: async (
      _: unknown,
      { status }: { status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser || (ctx.currentUser.role !== 'ADMIN' && ctx.currentUser.role !== 'MODERATOR')) {
        throw new Error('Access denied: Moderator or Admin privileges required');
      }

      const reports = await ctx.prisma.report.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: true,
          discussion: { include: { author: true } },
          comment: { include: { author: true } },
        },
      });

      return reports.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; username: string; password: string; displayName: string },
      ctx: GraphQLContext
    ) => {
      const validated = registerSchema.parse(args);

      const existing = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ email: validated.email }, { username: validated.username }],
        },
      });

      if (existing) {
        if (existing.email === validated.email) throw new Error('Email is already registered');
        throw new Error('Username is already taken');
      }

      const passwordHash = await hashPassword(validated.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: validated.email,
          username: validated.username,
          displayName: validated.displayName,
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${validated.username}`,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      return {
        token,
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          discussionsCount: 0,
          commentsCount: 0,
        },
      };
    },

    login: async (
      _: unknown,
      args: { emailOrUsername: string; password: string },
      ctx: GraphQLContext
    ) => {
      const validated = loginSchema.parse(args);

      const user = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ email: validated.emailOrUsername }, { username: validated.emailOrUsername }],
        },
        include: {
          _count: { select: { discussions: true, comments: true } },
        },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid email/username or password');
      }

      const isValid = await comparePassword(validated.password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email/username or password');
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      return {
        token,
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          discussionsCount: user._count.discussions,
          commentsCount: user._count.comments,
        },
      };
    },

    logout: async () => {
      return true;
    },

    createDiscussion: async (
      _: unknown,
      args: { title: string; content: string; tags: string[] },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = createDiscussionSchema.parse(args);

      const baseSlug = slugify(validated.title);
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${baseSlug}-${randomSuffix}`;

      // Transaction: create tags and discussion atomically
      const result = await ctx.prisma.$transaction(async (tx) => {
        const tagRecords = await Promise.all(
          validated.tags.map(async (t) => {
            const tagSlug = slugify(t);
            return tx.tag.upsert({
              where: { slug: tagSlug },
              update: { postCount: { increment: 1 } },
              create: { name: t, slug: tagSlug, postCount: 1 },
            });
          })
        );

        return await tx.discussion.create({
          data: {
            title: validated.title,
            content: validated.content,
            slug,
            authorId: ctx.currentUser!.userId,
            tags: {
              create: tagRecords.map((t) => ({ tagId: t.id })),
            },
          },
          include: {
            author: true,
            tags: { include: { tag: true } },
          },
        });
      });

      // Invalidate relevant cache tags/keys
      ctx.cache.del('discussions:latest').catch(() => {});

      return {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        tags: result.tags.map((t) => t.tag),
        userVote: null,
        isBookmarked: false,
      };
    },

    updateDiscussion: async (
      _: unknown,
      args: { id: string; title: string; content: string; tags: string[] },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = updateDiscussionSchema.parse(args);

      const existing = await ctx.prisma.discussion.findUnique({ where: { id: validated.id } });
      if (!existing) throw new Error('Discussion not found');
      if (existing.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
        throw new Error('You do not have permission to edit this discussion');
      }

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const tagRecords = await Promise.all(
          validated.tags.map(async (t) => {
            const tagSlug = slugify(t);
            return tx.tag.upsert({
              where: { slug: tagSlug },
              update: {},
              create: { name: t, slug: tagSlug, postCount: 1 },
            });
          })
        );

        await tx.postTag.deleteMany({ where: { discussionId: validated.id } });

        return await tx.discussion.update({
          where: { id: validated.id },
          data: {
            title: validated.title,
            content: validated.content,
            tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
          },
          include: { author: true, tags: { include: { tag: true } } },
        });
      });

      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        tags: updated.tags.map((t) => t.tag),
      };
    },

    deleteDiscussion: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const existing = await ctx.prisma.discussion.findUnique({ where: { id } });
      if (!existing) throw new Error('Discussion not found');
      if (existing.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
        throw new Error('You do not have permission to delete this discussion');
      }

      await ctx.prisma.discussion.delete({ where: { id } });
      return true;
    },

    createComment: async (
      _: unknown,
      args: { discussionId: string; content: string; parentId?: string | null },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = createCommentSchema.parse(args);

      const comment = await ctx.prisma.$transaction(async (tx) => {
        let depth = 0;
        if (validated.parentId) {
          const parent = await tx.comment.findUnique({ where: { id: validated.parentId } });
          if (parent) depth = Math.min(parent.depth + 1, 5);
        }

        const created = await tx.comment.create({
          data: {
            content: validated.content,
            discussionId: validated.discussionId,
            parentId: validated.parentId || null,
            depth,
            authorId: ctx.currentUser!.userId,
          },
          include: { author: true, discussion: true },
        });

        await tx.discussion.update({
          where: { id: validated.discussionId },
          data: { commentsCount: { increment: 1 } },
        });

        return created;
      });

      return {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: [],
        userVote: null,
      };
    },

    updateComment: async (
      _: unknown,
      args: { id: string; content: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = updateCommentSchema.parse(args);

      const existing = await ctx.prisma.comment.findUnique({ where: { id: validated.id } });
      if (!existing) throw new Error('Comment not found');
      if (existing.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
        throw new Error('You do not have permission to edit this comment');
      }

      const updated = await ctx.prisma.comment.update({
        where: { id: validated.id },
        data: { content: validated.content },
        include: { author: true },
      });

      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        replies: [],
      };
    },

    deleteComment: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const existing = await ctx.prisma.comment.findUnique({ where: { id } });
      if (!existing) throw new Error('Comment not found');
      if (existing.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
        throw new Error('You do not have permission to delete this comment');
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.comment.delete({ where: { id } });
        await tx.discussion.update({
          where: { id: existing.discussionId },
          data: { commentsCount: { decrement: 1 } },
        });
      });

      return true;
    },

    voteDiscussion: async (
      _: unknown,
      { discussionId, type }: { discussionId: string; type: 'UPVOTE' | 'DOWNVOTE' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      return await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.vote.findUnique({
          where: {
            userId_discussionId: {
              userId: ctx.currentUser!.userId,
              discussionId,
            },
          },
        });

        let scoreDelta = 0;
        let upvotesDelta = 0;
        let downvotesDelta = 0;
        let newUserVote: 'UPVOTE' | 'DOWNVOTE' | null = type;

        if (existing) {
          if (existing.type === type) {
            await tx.vote.delete({ where: { id: existing.id } });
            scoreDelta = type === 'UPVOTE' ? -1 : 1;
            upvotesDelta = type === 'UPVOTE' ? -1 : 0;
            downvotesDelta = type === 'DOWNVOTE' ? -1 : 0;
            newUserVote = null;
          } else {
            await tx.vote.update({ where: { id: existing.id }, data: { type } });
            scoreDelta = type === 'UPVOTE' ? 2 : -2;
            upvotesDelta = type === 'UPVOTE' ? 1 : -1;
            downvotesDelta = type === 'UPVOTE' ? -1 : 1;
          }
        } else {
          await tx.vote.create({
            data: { userId: ctx.currentUser!.userId, discussionId, type },
          });
          scoreDelta = type === 'UPVOTE' ? 1 : -1;
          upvotesDelta = type === 'UPVOTE' ? 1 : 0;
          downvotesDelta = type === 'DOWNVOTE' ? 1 : 0;
        }

        const updated = await tx.discussion.update({
          where: { id: discussionId },
          data: {
            score: { increment: scoreDelta },
            upvotesCount: { increment: upvotesDelta },
            downvotesCount: { increment: downvotesDelta },
          },
        });

        return {
          score: updated.score,
          userVote: newUserVote,
          upvotesCount: updated.upvotesCount,
          downvotesCount: updated.downvotesCount,
        };
      });
    },

    voteComment: async (
      _: unknown,
      { commentId, type }: { commentId: string; type: 'UPVOTE' | 'DOWNVOTE' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      return await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.vote.findUnique({
          where: {
            userId_commentId: {
              userId: ctx.currentUser!.userId,
              commentId,
            },
          },
        });

        let scoreDelta = 0;
        let upvotesDelta = 0;
        let downvotesDelta = 0;
        let newUserVote: 'UPVOTE' | 'DOWNVOTE' | null = type;

        if (existing) {
          if (existing.type === type) {
            await tx.vote.delete({ where: { id: existing.id } });
            scoreDelta = type === 'UPVOTE' ? -1 : 1;
            upvotesDelta = type === 'UPVOTE' ? -1 : 0;
            downvotesDelta = type === 'DOWNVOTE' ? -1 : 0;
            newUserVote = null;
          } else {
            await tx.vote.update({ where: { id: existing.id }, data: { type } });
            scoreDelta = type === 'UPVOTE' ? 2 : -2;
            upvotesDelta = type === 'UPVOTE' ? 1 : -1;
            downvotesDelta = type === 'UPVOTE' ? -1 : 1;
          }
        } else {
          await tx.vote.create({
            data: { userId: ctx.currentUser!.userId, commentId, type },
          });
          scoreDelta = type === 'UPVOTE' ? 1 : -1;
          upvotesDelta = type === 'UPVOTE' ? 1 : 0;
          downvotesDelta = type === 'DOWNVOTE' ? 1 : 0;
        }

        const updated = await tx.comment.update({
          where: { id: commentId },
          data: {
            score: { increment: scoreDelta },
            upvotesCount: { increment: upvotesDelta },
            downvotesCount: { increment: downvotesDelta },
          },
        });

        return {
          score: updated.score,
          userVote: newUserVote,
          upvotesCount: updated.upvotesCount,
          downvotesCount: updated.downvotesCount,
        };
      });
    },

    toggleBookmark: async (
      _: unknown,
      { discussionId }: { discussionId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const existing = await ctx.prisma.bookmark.findUnique({
        where: {
          userId_discussionId: {
            userId: ctx.currentUser.userId,
            discussionId,
          },
        },
      });

      if (existing) {
        await ctx.prisma.bookmark.delete({ where: { id: existing.id } });
        return { isBookmarked: false };
      } else {
        await ctx.prisma.bookmark.create({
          data: { userId: ctx.currentUser.userId, discussionId },
        });
        return { isBookmarked: true };
      }
    },

    acceptSolution: async (
      _: unknown,
      { discussionId, commentId }: { discussionId: string; commentId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const discussion = await ctx.prisma.discussion.findUnique({ where: { id: discussionId } });
      if (!discussion) throw new Error('Discussion not found');

      if (discussion.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
        throw new Error('Only the discussion author can accept a solution');
      }

      const comment = await ctx.prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) throw new Error('Comment not found');

      return await ctx.prisma.$transaction(async (tx) => {
        const isCurrentlyAccepted = discussion.solvedCommentId === commentId;
        if (isCurrentlyAccepted) {
          await tx.comment.update({ where: { id: commentId }, data: { isAccepted: false } });
          const updated = await tx.discussion.update({
            where: { id: discussionId },
            data: { solved: false, solvedCommentId: null },
            include: { author: true, tags: { include: { tag: true } } },
          });
          return {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            tags: updated.tags.map((t) => t.tag),
          };
        }

        await tx.comment.update({ where: { id: commentId }, data: { isAccepted: true } });
        const updated = await tx.discussion.update({
          where: { id: discussionId },
          data: { solved: true, solvedCommentId: commentId },
          include: { author: true, tags: { include: { tag: true } } },
        });

        return {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          tags: updated.tags.map((t) => t.tag),
        };
      });
    },

    reportContent: async (
      _: unknown,
      args: { reason: string; details?: string | null; discussionId?: string | null; commentId?: string | null },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = reportSchema.parse(args);

      const report = await ctx.prisma.report.create({
        data: {
          reason: validated.reason,
          details: validated.details || null,
          discussionId: validated.discussionId || null,
          commentId: validated.commentId || null,
          reporterId: ctx.currentUser.userId,
        },
        include: { reporter: true },
      });

      return { ...report, createdAt: report.createdAt.toISOString() };
    },

    markNotificationAsRead: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      await ctx.prisma.notification.updateMany({
        where: { id, userId: ctx.currentUser.userId },
        data: { read: true },
      });
      return true;
    },

    markAllNotificationsAsRead: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      await ctx.prisma.notification.updateMany({
        where: { userId: ctx.currentUser.userId, read: false },
        data: { read: true },
      });
      return true;
    },

    updateProfile: async (
      _: unknown,
      args: {
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        githubUrl?: string;
        websiteUrl?: string;
      },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.currentUser.userId },
        data: {
          ...(args.displayName !== undefined ? { displayName: args.displayName } : {}),
          ...(args.bio !== undefined ? { bio: args.bio } : {}),
          ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
          ...(args.githubUrl !== undefined ? { githubUrl: args.githubUrl } : {}),
          ...(args.websiteUrl !== undefined ? { websiteUrl: args.websiteUrl } : {}),
        },
        include: {
          _count: {
            select: { discussions: true, comments: true },
          },
        },
      });

      return {
        ...updated,
        discussionsCount: updated._count.discussions,
        commentsCount: updated._count.comments,
        createdAt: updated.createdAt.toISOString(),
      };
    },

    updateReportStatus: async (
      _: unknown,
      { id, status }: { id: string; status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser || (ctx.currentUser.role !== 'ADMIN' && ctx.currentUser.role !== 'MODERATOR')) {
        throw new Error('Access denied: Moderator or Admin privileges required');
      }

      const updated = await ctx.prisma.report.update({
        where: { id },
        data: { status },
        include: { reporter: true },
      });
      return { ...updated, createdAt: updated.createdAt.toISOString() };
    },
  },

  User: {
    discussionsCount: async (
      parent: { id?: string; discussionsCount?: number; _count?: { discussions: number } },
      _: unknown,
      ctx: GraphQLContext
    ) => {
      if (typeof parent.discussionsCount === 'number') return parent.discussionsCount;
      if (parent._count?.discussions !== undefined) return parent._count.discussions;
      if (parent.id) {
        return await ctx.prisma.discussion.count({ where: { authorId: parent.id } });
      }
      return 0;
    },
    commentsCount: async (
      parent: { id?: string; commentsCount?: number; _count?: { comments: number } },
      _: unknown,
      ctx: GraphQLContext
    ) => {
      if (typeof parent.commentsCount === 'number') return parent.commentsCount;
      if (parent._count?.comments !== undefined) return parent._count.comments;
      if (parent.id) {
        return await ctx.prisma.comment.count({ where: { authorId: parent.id } });
      }
      return 0;
    },
    createdAt: (parent: { createdAt?: Date | string }) => {
      if (!parent.createdAt) return new Date().toISOString();
      if (typeof parent.createdAt === 'string') return parent.createdAt;
      return parent.createdAt.toISOString();
    },
  },
};
