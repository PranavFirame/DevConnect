import { GraphQLContext } from './context';
import { hashPassword, comparePassword, signToken } from '@/lib/auth';
import { memoryDb, MockUser, MockDiscussion, MockComment, MockTag } from '@/lib/db/memoryDb';
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

      try {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.currentUser.userId },
          include: {
            _count: {
              select: { discussions: true, comments: true },
            },
          },
        });
        if (user) {
          return {
            ...user,
            discussionsCount: user._count.discussions,
            commentsCount: user._count.comments,
            createdAt: user.createdAt.toISOString(),
          };
        }
      } catch {
        // Fallback to memoryDb
      }

      const memUser = memoryDb.users.get(ctx.currentUser.userId);
      if (!memUser) return null;

      const userDiscussions = Array.from(memoryDb.discussions.values()).filter(
        (d) => d.authorId === memUser.id
      ).length;
      const userComments = Array.from(memoryDb.comments.values()).filter(
        (c) => c.authorId === memUser.id
      ).length;

      return {
        ...memUser,
        discussionsCount: userDiscussions,
        commentsCount: userComments,
        createdAt: memUser.createdAt.toISOString(),
      };
    },

    user: async (_: unknown, { username }: { username: string }, ctx: GraphQLContext) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { username },
          include: {
            _count: {
              select: { discussions: true, comments: true },
            },
          },
        });
        if (user) {
          return {
            ...user,
            discussionsCount: user._count.discussions,
            commentsCount: user._count.comments,
            createdAt: user.createdAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }

      const memUser = Array.from(memoryDb.users.values()).find((u) => u.username === username);
      if (!memUser) return null;

      const userDiscussions = Array.from(memoryDb.discussions.values()).filter(
        (d) => d.authorId === memUser.id
      ).length;
      const userComments = Array.from(memoryDb.comments.values()).filter(
        (c) => c.authorId === memUser.id
      ).length;

      return {
        ...memUser,
        discussionsCount: userDiscussions,
        commentsCount: userComments,
        createdAt: memUser.createdAt.toISOString(),
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
      try {
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
      } catch {
        // Fallback to in-memory store
        let all = Array.from(memoryDb.discussions.values());

        if (author) {
          const userObj = Array.from(memoryDb.users.values()).find((u) => u.username === author);
          all = all.filter((d) => d.authorId === userObj?.id);
        }

        if (tag) {
          const tagObj = Array.from(memoryDb.tags.values()).find((t) => t.slug === tag);
          all = all.filter((d) => tagObj && d.tagIds.includes(tagObj.id));
        }

        if (sort === 'popular' || sort === 'top') {
          all.sort((a, b) => b.score - a.score);
        } else if (sort === 'unanswered') {
          all = all.filter((d) => !d.solved && d.commentsCount === 0);
          all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else {
          all.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.getTime() - a.createdAt.getTime());
        }

        const skip = Math.max(0, (page - 1) * limit);
        const take = Math.min(50, Math.max(1, limit));
        const paged = all.slice(skip, skip + take);

        const formatted = paged.map((d) => {
          const authorUser = memoryDb.users.get(d.authorId)!;
          const discussionTags = d.tagIds
            .map((id) => memoryDb.tags.get(id))
            .filter((t): t is MockTag => Boolean(t));

          const userVoteObj = ctx.currentUser
            ? Array.from(memoryDb.votes.values()).find(
                (v) => v.userId === ctx.currentUser?.userId && v.discussionId === d.id
              )
            : null;

          const isBookmarked = ctx.currentUser
            ? Array.from(memoryDb.bookmarks.values()).some(
                (b) => b.userId === ctx.currentUser?.userId && b.discussionId === d.id
              )
            : false;

          return {
            ...d,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
            author: authorUser,
            tags: discussionTags,
            userVote: userVoteObj ? userVoteObj.type : null,
            isBookmarked,
            solvedComment: null,
          };
        });

        return {
          discussions: formatted,
          totalCount: all.length,
          hasMore: skip + take < all.length,
        };
      }
    },

    discussion: async (
      _: unknown,
      { slug, id }: { slug?: string; id?: string },
      ctx: GraphQLContext
    ) => {
      try {
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
        if (d) {
          return {
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
          };
        }
      } catch {
        // Fallback
      }

      const d = Array.from(memoryDb.discussions.values()).find(
        (item) => (slug && item.slug === slug) || (id && item.id === id)
      );
      if (!d) return null;

      d.viewsCount += 1;
      const authorUser = memoryDb.users.get(d.authorId)!;
      const tags = d.tagIds
        .map((tId) => memoryDb.tags.get(tId))
        .filter((t): t is MockTag => Boolean(t));

      const userVoteObj = ctx.currentUser
        ? Array.from(memoryDb.votes.values()).find(
            (v) => v.userId === ctx.currentUser?.userId && v.discussionId === d.id
          )
        : null;

      const isBookmarked = ctx.currentUser
        ? Array.from(memoryDb.bookmarks.values()).some(
            (b) => b.userId === ctx.currentUser?.userId && b.discussionId === d.id
          )
        : false;

      return {
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        author: authorUser,
        tags,
        userVote: userVoteObj ? userVoteObj.type : null,
        isBookmarked,
        solvedComment: null,
      };
    },

    comments: async (
      _: unknown,
      { discussionId }: { discussionId: string },
      ctx: GraphQLContext
    ) => {
      try {
        const allComments = await ctx.prisma.comment.findMany({
          where: { discussionId },
          orderBy: [{ isAccepted: 'desc' }, { score: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: true,
            votes: ctx.currentUser ? { where: { userId: ctx.currentUser.userId } } : false,
          },
        });

        if (allComments.length > 0) {
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
        }
      } catch {
        // Fallback
      }

      const memComments = Array.from(memoryDb.comments.values()).filter(
        (c) => c.discussionId === discussionId
      );

      type MemNode = MockComment & {
        author: MockUser;
        replies: MemNode[];
        userVote: 'UPVOTE' | 'DOWNVOTE' | null;
      };

      const map = new Map<string, MemNode>();
      const roots: MemNode[] = [];

      memComments.forEach((c) => {
        const author = memoryDb.users.get(c.authorId)!;
        const userVoteObj = ctx.currentUser
          ? Array.from(memoryDb.votes.values()).find(
              (v) => v.userId === ctx.currentUser?.userId && v.commentId === c.id
            )
          : null;

        map.set(c.id, {
          ...c,
          author,
          replies: [],
          userVote: userVoteObj ? userVoteObj.type : null,
        });
      });

      map.forEach((item) => {
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId)!.replies.push(item);
        } else {
          roots.push(item);
        }
      });

      return roots.map(function formatNode(node: MemNode): Record<string, unknown> {
        return {
          ...node,
          createdAt: node.createdAt.toISOString(),
          updatedAt: node.updatedAt.toISOString(),
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

      try {
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
      } catch {
        // Fallback
        const all = Array.from(memoryDb.discussions.values()).filter((d) => {
          const matchQuery =
            !clean ||
            d.title.toLowerCase().includes(clean) ||
            d.content.toLowerCase().includes(clean);
          return matchQuery;
        });

        const formatted = all.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
          author: memoryDb.users.get(d.authorId)!,
          tags: d.tagIds.map((id) => memoryDb.tags.get(id)).filter(Boolean),
          userVote: null,
          isBookmarked: false,
        }));

        return { discussions: formatted, totalCount: all.length };
      }
    },

    tags: async (_: unknown, { limit = 30 }: { limit?: number }, ctx: GraphQLContext) => {
      try {
        const tags = await ctx.prisma.tag.findMany({
          take: limit,
          orderBy: { postCount: 'desc' },
        });
        if (tags.length > 0) return tags;
      } catch {
        // Fallback
      }

      return Array.from(memoryDb.tags.values()).slice(0, limit);
    },

    tag: async (_: unknown, { slug }: { slug: string }, ctx: GraphQLContext) => {
      try {
        const tag = await ctx.prisma.tag.findUnique({ where: { slug } });
        if (tag) return tag;
      } catch {
        // Fallback
      }

      return Array.from(memoryDb.tags.values()).find((t) => t.slug === slug) || null;
    },

    bookmarks: async (
      _: unknown,
      { page = 1, limit = 10 }: { page?: number; limit?: number },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
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
      } catch {
        // Fallback
        const myBookmarks = Array.from(memoryDb.bookmarks.values()).filter(
          (b) => b.userId === ctx.currentUser?.userId
        );

        return myBookmarks
          .map((b) => {
            const d = memoryDb.discussions.get(b.discussionId);
            if (!d) return null;
            return {
              ...d,
              createdAt: d.createdAt.toISOString(),
              updatedAt: d.updatedAt.toISOString(),
              author: memoryDb.users.get(d.authorId)!,
              tags: d.tagIds.map((id) => memoryDb.tags.get(id)).filter(Boolean),
              userVote: null,
              isBookmarked: true,
            };
          })
          .filter(Boolean);
      }
    },

    notifications: async (
      _: unknown,
      { limit = 20 }: { limit?: number },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
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
      } catch {
        // Fallback
        const userNotifs = Array.from(memoryDb.notifications.values())
          .filter((n) => n.userId === ctx.currentUser?.userId)
          .slice(0, limit);

        return userNotifs.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
          actor: n.actorId ? memoryDb.users.get(n.actorId) : null,
        }));
      }
    },

    unreadNotificationsCount: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) return 0;
      try {
        return await ctx.prisma.notification.count({
          where: { userId: ctx.currentUser.userId, read: false },
        });
      } catch {
        return Array.from(memoryDb.notifications.values()).filter(
          (n) => n.userId === ctx.currentUser?.userId && !n.read
        ).length;
      }
    },

    reports: async (
      _: unknown,
      { status }: { status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser || (ctx.currentUser.role !== 'ADMIN' && ctx.currentUser.role !== 'MODERATOR')) {
        throw new Error('Access denied: Moderator or Admin privileges required');
      }

      try {
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
      } catch {
        // Fallback
        return Array.from(memoryDb.reports.values()).map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          reporter: memoryDb.users.get(r.reporterId)!,
          discussion: r.discussionId ? memoryDb.discussions.get(r.discussionId) : null,
          comment: r.commentId ? memoryDb.comments.get(r.commentId) : null,
        }));
      }
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; username: string; password: string; displayName: string },
      ctx: GraphQLContext
    ) => {
      const validated = registerSchema.parse(args);

      // Try PostgreSQL first
      try {
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
      } catch (dbErr: unknown) {
        const msg = (dbErr as Error).message;
        if (msg === 'Email is already registered' || msg === 'Username is already taken') {
          throw dbErr;
        }

        // Graceful fallback to memoryDb when PostgreSQL is not running
        const existingMem = Array.from(memoryDb.users.values()).find(
          (u) => u.email === validated.email || u.username === validated.username
        );
        if (existingMem) {
          if (existingMem.email === validated.email) throw new Error('Email is already registered');
          throw new Error('Username is already taken');
        }

        const passwordHash = await hashPassword(validated.password);
        const newUserId = `usr_${Date.now()}`;
        const newUser: MockUser = {
          id: newUserId,
          email: validated.email,
          username: validated.username,
          displayName: validated.displayName,
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${validated.username}`,
          role: 'USER',
          reputation: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        memoryDb.users.set(newUser.id, newUser);

        const token = signToken({
          userId: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        });

        return {
          token,
          user: {
            ...newUser,
            createdAt: newUser.createdAt.toISOString(),
            discussionsCount: 0,
            commentsCount: 0,
          },
        };
      }
    },

    login: async (
      _: unknown,
      args: { emailOrUsername: string; password: string },
      ctx: GraphQLContext
    ) => {
      const validated = loginSchema.parse(args);

      // Try PostgreSQL first
      try {
        const user = await ctx.prisma.user.findFirst({
          where: {
            OR: [{ email: validated.emailOrUsername }, { username: validated.emailOrUsername }],
          },
          include: {
            _count: { select: { discussions: true, comments: true } },
          },
        });

        if (user && user.passwordHash) {
          const isValid = await comparePassword(validated.password, user.passwordHash);
          if (isValid) {
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
          }
        }
      } catch {
        // Fallback to memoryDb
      }

      // MemoryDb check
      const memUser = Array.from(memoryDb.users.values()).find(
        (u) =>
          u.email === validated.emailOrUsername || u.username === validated.emailOrUsername
      );

      if (!memUser) {
        throw new Error('Invalid email/username or password');
      }

      const isValid = await comparePassword(validated.password, memUser.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email/username or password');
      }

      const token = signToken({
        userId: memUser.id,
        email: memUser.email,
        username: memUser.username,
        role: memUser.role,
      });

      const discussionsCount = Array.from(memoryDb.discussions.values()).filter(
        (d) => d.authorId === memUser.id
      ).length;
      const commentsCount = Array.from(memoryDb.comments.values()).filter(
        (c) => c.authorId === memUser.id
      ).length;

      return {
        token,
        user: {
          ...memUser,
          createdAt: memUser.createdAt.toISOString(),
          discussionsCount,
          commentsCount,
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

      try {
        const tagRecords = await Promise.all(
          validated.tags.map(async (t) => {
            const tagSlug = slugify(t);
            return ctx.prisma.tag.upsert({
              where: { slug: tagSlug },
              update: { postCount: { increment: 1 } },
              create: { name: t, slug: tagSlug, postCount: 1 },
            });
          })
        );

        const discussion = await ctx.prisma.discussion.create({
          data: {
            title: validated.title,
            content: validated.content,
            slug,
            authorId: ctx.currentUser.userId,
            tags: {
              create: tagRecords.map((t) => ({ tagId: t.id })),
            },
          },
          include: {
            author: true,
            tags: { include: { tag: true } },
          },
        });

        return {
          ...discussion,
          createdAt: discussion.createdAt.toISOString(),
          updatedAt: discussion.updatedAt.toISOString(),
          tags: discussion.tags.map((t) => t.tag),
          userVote: null,
          isBookmarked: false,
        };
      } catch {
        // Fallback to memoryDb
        const tagIds: string[] = [];
        validated.tags.forEach((name) => {
          const tSlug = slugify(name);
          let existingTag = Array.from(memoryDb.tags.values()).find((t) => t.slug === tSlug);
          if (!existingTag) {
            existingTag = {
              id: `tag_${Date.now()}_${Math.random()}`,
              name,
              slug: tSlug,
              description: `Discussions about #${name}`,
              postCount: 1,
              createdAt: new Date(),
            };
            memoryDb.tags.set(existingTag.id, existingTag);
          } else {
            existingTag.postCount += 1;
          }
          tagIds.push(existingTag.id);
        });

        const newPost: MockDiscussion = {
          id: `disc_${Date.now()}`,
          title: validated.title,
          content: validated.content,
          slug,
          pinned: false,
          solved: false,
          score: 1,
          upvotesCount: 1,
          downvotesCount: 0,
          commentsCount: 0,
          viewsCount: 1,
          authorId: ctx.currentUser.userId,
          tagIds,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        memoryDb.discussions.set(newPost.id, newPost);
        const author = memoryDb.users.get(ctx.currentUser.userId)!;
        const postTags = tagIds.map((id) => memoryDb.tags.get(id)).filter(Boolean);

        return {
          ...newPost,
          createdAt: newPost.createdAt.toISOString(),
          updatedAt: newPost.updatedAt.toISOString(),
          author,
          tags: postTags,
          userVote: null,
          isBookmarked: false,
        };
      }
    },

    updateDiscussion: async (
      _: unknown,
      args: { id: string; title: string; content: string; tags: string[] },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = updateDiscussionSchema.parse(args);

      try {
        const existing = await ctx.prisma.discussion.findUnique({ where: { id: validated.id } });
        if (!existing) throw new Error('Discussion not found');
        if (existing.authorId !== ctx.currentUser.userId && ctx.currentUser.role !== 'ADMIN') {
          throw new Error('You do not have permission to edit this discussion');
        }

        const tagRecords = await Promise.all(
          validated.tags.map(async (t) => {
            const tagSlug = slugify(t);
            return ctx.prisma.tag.upsert({
              where: { slug: tagSlug },
              update: {},
              create: { name: t, slug: tagSlug, postCount: 1 },
            });
          })
        );

        await ctx.prisma.postTag.deleteMany({ where: { discussionId: validated.id } });

        const updated = await ctx.prisma.discussion.update({
          where: { id: validated.id },
          data: {
            title: validated.title,
            content: validated.content,
            tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
          },
          include: { author: true, tags: { include: { tag: true } } },
        });

        return {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          tags: updated.tags.map((t) => t.tag),
        };
      } catch {
        // Fallback
        const d = memoryDb.discussions.get(validated.id);
        if (!d) throw new Error('Discussion not found');
        d.title = validated.title;
        d.content = validated.content;
        d.updatedAt = new Date();

        return {
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
          author: memoryDb.users.get(d.authorId)!,
          tags: d.tagIds.map((id) => memoryDb.tags.get(id)).filter(Boolean),
        };
      }
    },

    deleteDiscussion: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
        await ctx.prisma.discussion.delete({ where: { id } });
        return true;
      } catch {
        memoryDb.discussions.delete(id);
        return true;
      }
    },

    createComment: async (
      _: unknown,
      args: { discussionId: string; content: string; parentId?: string | null },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = createCommentSchema.parse(args);

      try {
        let depth = 0;
        if (validated.parentId) {
          const parent = await ctx.prisma.comment.findUnique({ where: { id: validated.parentId } });
          if (parent) depth = Math.min(parent.depth + 1, 5);
        }

        const comment = await ctx.prisma.comment.create({
          data: {
            content: validated.content,
            discussionId: validated.discussionId,
            parentId: validated.parentId || null,
            depth,
            authorId: ctx.currentUser.userId,
          },
          include: { author: true, discussion: true },
        });

        await ctx.prisma.discussion.update({
          where: { id: validated.discussionId },
          data: { commentsCount: { increment: 1 } },
        });

        return {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          replies: [],
          userVote: null,
        };
      } catch {
        // Fallback
        const newCmt: MockComment = {
          id: `cmt_${Date.now()}`,
          content: validated.content,
          score: 1,
          upvotesCount: 1,
          downvotesCount: 0,
          depth: validated.parentId ? 1 : 0,
          isAccepted: false,
          authorId: ctx.currentUser.userId,
          discussionId: validated.discussionId,
          parentId: validated.parentId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        memoryDb.comments.set(newCmt.id, newCmt);
        const post = memoryDb.discussions.get(validated.discussionId);
        if (post) post.commentsCount += 1;

        return {
          ...newCmt,
          createdAt: newCmt.createdAt.toISOString(),
          updatedAt: newCmt.updatedAt.toISOString(),
          author: memoryDb.users.get(ctx.currentUser.userId)!,
          replies: [],
          userVote: null,
        };
      }
    },

    updateComment: async (
      _: unknown,
      args: { id: string; content: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = updateCommentSchema.parse(args);

      try {
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
      } catch {
        const c = memoryDb.comments.get(validated.id);
        if (!c) throw new Error('Comment not found');
        c.content = validated.content;
        c.updatedAt = new Date();

        return {
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          author: memoryDb.users.get(c.authorId)!,
          replies: [],
        };
      }
    },

    deleteComment: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
        await ctx.prisma.comment.delete({ where: { id } });
        return true;
      } catch {
        memoryDb.comments.delete(id);
        return true;
      }
    },

    voteDiscussion: async (
      _: unknown,
      { discussionId, type }: { discussionId: string; type: 'UPVOTE' | 'DOWNVOTE' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
        const existing = await ctx.prisma.vote.findUnique({
          where: {
            userId_discussionId: {
              userId: ctx.currentUser.userId,
              discussionId,
            },
          },
        });

        let scoreDelta = 0;
        let newUserVote: 'UPVOTE' | 'DOWNVOTE' | null = type;

        if (existing) {
          if (existing.type === type) {
            await ctx.prisma.vote.delete({ where: { id: existing.id } });
            scoreDelta = type === 'UPVOTE' ? -1 : 1;
            newUserVote = null;
          } else {
            await ctx.prisma.vote.update({ where: { id: existing.id }, data: { type } });
            scoreDelta = type === 'UPVOTE' ? 2 : -2;
          }
        } else {
          await ctx.prisma.vote.create({
            data: { userId: ctx.currentUser.userId, discussionId, type },
          });
          scoreDelta = type === 'UPVOTE' ? 1 : -1;
        }

        const updated = await ctx.prisma.discussion.update({
          where: { id: discussionId },
          data: { score: { increment: scoreDelta } },
        });

        return {
          score: updated.score,
          userVote: newUserVote,
          upvotesCount: updated.upvotesCount,
          downvotesCount: updated.downvotesCount,
        };
      } catch {
        // Fallback
        const d = memoryDb.discussions.get(discussionId);
        if (!d) throw new Error('Discussion not found');

        const key = `vote_${ctx.currentUser.userId}_${discussionId}`;
        const existing = memoryDb.votes.get(key);

        if (existing) {
          if (existing.type === type) {
            memoryDb.votes.delete(key);
            d.score += type === 'UPVOTE' ? -1 : 1;
            return { score: d.score, userVote: null, upvotesCount: d.upvotesCount, downvotesCount: d.downvotesCount };
          } else {
            existing.type = type;
            d.score += type === 'UPVOTE' ? 2 : -2;
            return { score: d.score, userVote: type, upvotesCount: d.upvotesCount, downvotesCount: d.downvotesCount };
          }
        } else {
          memoryDb.votes.set(key, {
            id: key,
            userId: ctx.currentUser.userId,
            discussionId,
            type,
            createdAt: new Date(),
          });
          d.score += type === 'UPVOTE' ? 1 : -1;
          return { score: d.score, userVote: type, upvotesCount: d.upvotesCount, downvotesCount: d.downvotesCount };
        }
      }
    },

    voteComment: async (
      _: unknown,
      { commentId, type }: { commentId: string; type: 'UPVOTE' | 'DOWNVOTE' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
        const existing = await ctx.prisma.vote.findUnique({
          where: {
            userId_commentId: {
              userId: ctx.currentUser.userId,
              commentId,
            },
          },
        });

        let scoreDelta = 0;
        let newUserVote: 'UPVOTE' | 'DOWNVOTE' | null = type;

        if (existing) {
          if (existing.type === type) {
            await ctx.prisma.vote.delete({ where: { id: existing.id } });
            scoreDelta = type === 'UPVOTE' ? -1 : 1;
            newUserVote = null;
          } else {
            await ctx.prisma.vote.update({ where: { id: existing.id }, data: { type } });
            scoreDelta = type === 'UPVOTE' ? 2 : -2;
          }
        } else {
          await ctx.prisma.vote.create({
            data: { userId: ctx.currentUser.userId, commentId, type },
          });
          scoreDelta = type === 'UPVOTE' ? 1 : -1;
        }

        const updated = await ctx.prisma.comment.update({
          where: { id: commentId },
          data: { score: { increment: scoreDelta } },
        });

        return {
          score: updated.score,
          userVote: newUserVote,
          upvotesCount: updated.upvotesCount,
          downvotesCount: updated.downvotesCount,
        };
      } catch {
        const c = memoryDb.comments.get(commentId);
        if (!c) throw new Error('Comment not found');

        const key = `vote_c_${ctx.currentUser.userId}_${commentId}`;
        const existing = memoryDb.votes.get(key);

        if (existing) {
          if (existing.type === type) {
            memoryDb.votes.delete(key);
            c.score += type === 'UPVOTE' ? -1 : 1;
            return { score: c.score, userVote: null, upvotesCount: c.upvotesCount, downvotesCount: c.downvotesCount };
          } else {
            existing.type = type;
            c.score += type === 'UPVOTE' ? 2 : -2;
            return { score: c.score, userVote: type, upvotesCount: c.upvotesCount, downvotesCount: c.downvotesCount };
          }
        } else {
          memoryDb.votes.set(key, {
            id: key,
            userId: ctx.currentUser.userId,
            commentId,
            type,
            createdAt: new Date(),
          });
          c.score += type === 'UPVOTE' ? 1 : -1;
          return { score: c.score, userVote: type, upvotesCount: c.upvotesCount, downvotesCount: c.downvotesCount };
        }
      }
    },

    toggleBookmark: async (
      _: unknown,
      { discussionId }: { discussionId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
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
      } catch {
        const key = `bm_${ctx.currentUser.userId}_${discussionId}`;
        if (memoryDb.bookmarks.has(key)) {
          memoryDb.bookmarks.delete(key);
          return { isBookmarked: false };
        } else {
          memoryDb.bookmarks.set(key, {
            id: key,
            userId: ctx.currentUser.userId,
            discussionId,
            createdAt: new Date(),
          });
          return { isBookmarked: true };
        }
      }
    },

    acceptSolution: async (
      _: unknown,
      { discussionId, commentId }: { discussionId: string; commentId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');

      try {
        const discussion = await ctx.prisma.discussion.findUnique({ where: { id: discussionId } });
        if (!discussion) throw new Error('Discussion not found');

        const comment = await ctx.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) throw new Error('Comment not found');

        const isCurrentlyAccepted = discussion.solvedCommentId === commentId;
        if (isCurrentlyAccepted) {
          await ctx.prisma.comment.update({ where: { id: commentId }, data: { isAccepted: false } });
          const updated = await ctx.prisma.discussion.update({
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

        await ctx.prisma.comment.update({ where: { id: commentId }, data: { isAccepted: true } });
        const updated = await ctx.prisma.discussion.update({
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
      } catch {
        const d = memoryDb.discussions.get(discussionId);
        const c = memoryDb.comments.get(commentId);
        if (!d || !c) throw new Error('Not found');

        c.isAccepted = !c.isAccepted;
        d.solved = c.isAccepted;
        d.solvedCommentId = c.isAccepted ? commentId : null;

        return {
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
          author: memoryDb.users.get(d.authorId)!,
          tags: d.tagIds.map((id) => memoryDb.tags.get(id)).filter(Boolean),
        };
      }
    },

    reportContent: async (
      _: unknown,
      args: { reason: string; details?: string | null; discussionId?: string | null; commentId?: string | null },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      const validated = reportSchema.parse(args);

      try {
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
      } catch {
        const rep = {
          id: `rep_${Date.now()}`,
          reason: validated.reason,
          details: validated.details || null,
          status: 'PENDING' as const,
          reporterId: ctx.currentUser.userId,
          discussionId: validated.discussionId || null,
          commentId: validated.commentId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryDb.reports.set(rep.id, rep);
        return { ...rep, createdAt: rep.createdAt.toISOString() };
      }
    },

    markNotificationAsRead: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      try {
        await ctx.prisma.notification.updateMany({
          where: { id, userId: ctx.currentUser.userId },
          data: { read: true },
        });
      } catch {
        const n = memoryDb.notifications.get(id);
        if (n && n.userId === ctx.currentUser.userId) n.read = true;
      }
      return true;
    },

    markAllNotificationsAsRead: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw new Error('Authentication required');
      try {
        await ctx.prisma.notification.updateMany({
          where: { userId: ctx.currentUser.userId, read: false },
          data: { read: true },
        });
      } catch {
        Array.from(memoryDb.notifications.values())
          .filter((n) => n.userId === ctx.currentUser?.userId)
          .forEach((n) => (n.read = true));
      }
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

      try {
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
      } catch {
        // MemoryDb Fallback
        const user = memoryDb.users.get(ctx.currentUser.userId);
        if (!user) throw new Error('User not found');

        if (args.displayName !== undefined) user.displayName = args.displayName;
        if (args.bio !== undefined) user.bio = args.bio;
        if (args.avatarUrl !== undefined) user.avatarUrl = args.avatarUrl;
        if (args.githubUrl !== undefined) user.githubUrl = args.githubUrl;
        if (args.websiteUrl !== undefined) user.websiteUrl = args.websiteUrl;
        user.updatedAt = new Date();

        const discussionsCount = Array.from(memoryDb.discussions.values()).filter(
          (d) => d.authorId === user.id
        ).length;
        const commentsCount = Array.from(memoryDb.comments.values()).filter(
          (c) => c.authorId === user.id
        ).length;

        return {
          ...user,
          discussionsCount,
          commentsCount,
          createdAt: user.createdAt.toISOString(),
        };
      }
    },

    updateReportStatus: async (
      _: unknown,
      { id, status }: { id: string; status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
      ctx: GraphQLContext
    ) => {
      if (!ctx.currentUser || (ctx.currentUser.role !== 'ADMIN' && ctx.currentUser.role !== 'MODERATOR')) {
        throw new Error('Access denied');
      }

      try {
        const updated = await ctx.prisma.report.update({
          where: { id },
          data: { status },
          include: { reporter: true },
        });
        return { ...updated, createdAt: updated.createdAt.toISOString() };
      } catch {
        const r = memoryDb.reports.get(id);
        if (r) r.status = status;
        return {
          ...r,
          createdAt: new Date().toISOString(),
          reporter: memoryDb.users.get(ctx.currentUser.userId)!,
        };
      }
    },
  },
};
