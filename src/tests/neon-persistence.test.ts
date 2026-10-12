import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { resolvers } from '@/lib/graphql/resolvers';
import { GraphQLContext } from '@/lib/graphql/context';
import { cache } from '@/lib/cache';

describe('Neon Database Persistence & Resolver Tests', () => {
  let prisma: PrismaClient;
  let testUser: { id: string; email: string; username: string; role: 'USER' | 'ADMIN' };
  let createdDiscussionId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const existing = await prisma.user.findFirst({
      where: { username: 'alexdev' },
    });

    if (existing) {
      testUser = {
        id: existing.id,
        email: existing.email,
        username: existing.username,
        role: existing.role as 'USER' | 'ADMIN',
      };
    } else {
      const created = await prisma.user.create({
        data: {
          email: 'alexdev@devconnect.io',
          username: 'alexdev',
          displayName: 'Alex Rivers',
          role: 'ADMIN',
        },
      });
      testUser = {
        id: created.id,
        email: created.email,
        username: created.username,
        role: created.role as 'USER' | 'ADMIN',
      };
    }
  }, 15000);

  afterAll(async () => {
    if (createdCommentId) {
      await prisma.comment.deleteMany({ where: { id: createdCommentId } });
    }
    if (createdDiscussionId) {
      await prisma.discussion.deleteMany({ where: { id: createdDiscussionId } });
    }
    await prisma.$disconnect();
  }, 15000);

  it('should persist a new discussion directly to Neon PostgreSQL', async () => {
    const ctx: GraphQLContext = {
      currentUser: {
        userId: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role,
      },
      prisma,
      cache,
    };

    const uniqueTitle = `Integration Test Discussion ${Date.now()}`;
    const result = await resolvers.Mutation.createDiscussion(
      null,
      {
        title: uniqueTitle,
        content: 'This discussion is written directly to Neon PostgreSQL to verify persistence.',
        tags: ['vitest', 'neon'],
      },
      ctx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe(uniqueTitle);
    createdDiscussionId = result.id;

    // Verify persistence directly in Neon
    const persisted = await prisma.discussion.findUnique({
      where: { id: result.id },
      include: { author: true, tags: { include: { tag: true } } },
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.title).toBe(uniqueTitle);
    expect(persisted?.author.id).toBe(testUser.id);
    expect(persisted?.tags.some((t) => t.tag.slug === 'neon')).toBe(true);
  }, 20000);

  it('should persist comments to Neon PostgreSQL and update discussion counters', async () => {
    expect(createdDiscussionId).toBeDefined();

    const ctx: GraphQLContext = {
      currentUser: {
        userId: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role,
      },
      prisma,
      cache,
    };

    const commentContent = `Integration Test Reply ${Date.now()}`;
    const result = await resolvers.Mutation.createComment(
      null,
      {
        discussionId: createdDiscussionId,
        content: commentContent,
      },
      ctx
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.content).toBe(commentContent);
    createdCommentId = result.id;

    // Verify persistence in Neon
    const persistedComment = await prisma.comment.findUnique({
      where: { id: result.id },
    });
    const updatedDiscussion = await prisma.discussion.findUnique({
      where: { id: createdDiscussionId },
    });

    expect(persistedComment).not.toBeNull();
    expect(persistedComment?.content).toBe(commentContent);
    expect(updatedDiscussion?.commentsCount).toBeGreaterThanOrEqual(1);
  }, 20000);

  it('should throw an error on database failure and never silently report success', async () => {
    // Intentionally pass broken Prisma methods to simulate database outage
    const brokenPrisma = {
      discussion: {
        findMany: async () => {
          throw new Error('Database connection failed');
        },
        count: async () => {
          throw new Error('Database connection failed');
        },
      },
    } as unknown as PrismaClient;

    const brokenCtx: GraphQLContext = {
      currentUser: null,
      prisma: brokenPrisma,
      cache,
    };

    // Resolver must throw the database error rather than falling back to mock data
    await expect(
      resolvers.Query.discussions(null, { page: 1, limit: 10 }, brokenCtx)
    ).rejects.toThrow('Database connection failed');
  });
});
