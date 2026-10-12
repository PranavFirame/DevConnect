import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importDataStore() {
  const dataPath = path.join(process.cwd(), 'src', 'lib', 'db', 'data-store.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No data-store.json found. Nothing to import.');
    return;
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse data-store.json:', err);
    return;
  }

  console.log('--- Starting Idempotent Data Store Import into Neon ---');

  let importedUsers = 0;
  let importedTags = 0;
  let importedDiscussions = 0;
  let importedComments = 0;

  // 1. Tags
  const tagIdMap = new Map(); // oldId -> newId or slug
  if (data.tags && Array.isArray(data.tags)) {
    for (const [tagId, tagObj] of data.tags) {
      if (!tagObj.name || !tagObj.slug) continue;
      const existing = await prisma.tag.findUnique({
        where: { slug: tagObj.slug },
      });
      if (!existing) {
        const created = await prisma.tag.create({
          data: {
            name: tagObj.name,
            slug: tagObj.slug,
            description: tagObj.description || `Discussions about #${tagObj.name}`,
            color: tagObj.color || '#0284c7',
            postCount: tagObj.postCount || 0,
            createdAt: new Date(tagObj.createdAt || Date.now()),
          },
        });
        tagIdMap.set(tagId, created.id);
        importedTags++;
      } else {
        tagIdMap.set(tagId, existing.id);
      }
    }
  }

  // 2. Users (match by email or username, never duplicate)
  const userIdMap = new Map(); // oldId -> newId
  if (data.users && Array.isArray(data.users)) {
    for (const [userId, userObj] of data.users) {
      if (!userObj.email || !userObj.username) continue;
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: userObj.email }, { username: userObj.username }],
        },
      });

      if (!existing) {
        const created = await prisma.user.create({
          data: {
            email: userObj.email,
            username: userObj.username,
            displayName: userObj.displayName || userObj.username,
            passwordHash: userObj.passwordHash,
            bio: userObj.bio,
            avatarUrl: userObj.avatarUrl,
            githubUrl: userObj.githubUrl,
            websiteUrl: userObj.websiteUrl,
            role: userObj.role || 'USER',
            reputation: userObj.reputation || 0,
            createdAt: new Date(userObj.createdAt || Date.now()),
            updatedAt: new Date(userObj.updatedAt || Date.now()),
          },
        });
        userIdMap.set(userId, created.id);
        importedUsers++;
      } else {
        userIdMap.set(userId, existing.id);
      }
    }
  }

  // 3. Discussions (match by title or slug, never duplicate)
  const discussionIdMap = new Map();
  if (data.discussions && Array.isArray(data.discussions)) {
    for (const [discId, discObj] of data.discussions) {
      if (!discObj.title || !discObj.content) continue;

      const existing = await prisma.discussion.findFirst({
        where: {
          OR: [
            { slug: discObj.slug },
            { title: discObj.title },
          ],
        },
      });

      if (!existing) {
        // Find author
        let authorId = userIdMap.get(discObj.authorId);
        if (!authorId) {
          // fallback to first admin or first user
          const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
          authorId = defaultUser?.id;
        }

        if (!authorId) {
          console.warn(`Skipping discussion "${discObj.title}" because no valid author exists.`);
          continue;
        }

        // Map tagIds to database tagIds
        const validTagIds = (discObj.tagIds || [])
          .map((id) => tagIdMap.get(id))
          .filter(Boolean);

        const created = await prisma.discussion.create({
          data: {
            title: discObj.title,
            slug: discObj.slug,
            content: discObj.content,
            pinned: Boolean(discObj.pinned),
            solved: Boolean(discObj.solved),
            score: discObj.score || 0,
            upvotesCount: discObj.upvotesCount || 0,
            downvotesCount: discObj.downvotesCount || 0,
            commentsCount: discObj.commentsCount || 0,
            viewsCount: discObj.viewsCount || 0,
            authorId,
            createdAt: new Date(discObj.createdAt || Date.now()),
            updatedAt: new Date(discObj.updatedAt || Date.now()),
            tags: {
              create: validTagIds.map((tId) => ({ tagId: tId })),
            },
          },
        });

        discussionIdMap.set(discId, created.id);
        importedDiscussions++;
      } else {
        discussionIdMap.set(discId, existing.id);
      }
    }
  }

  // 4. Comments
  if (data.comments && Array.isArray(data.comments)) {
    for (const [cmtId, cmtObj] of data.comments) {
      if (!cmtObj.content) continue;
      const dbDiscussionId = discussionIdMap.get(cmtObj.discussionId);
      if (!dbDiscussionId) continue;

      const existing = await prisma.comment.findFirst({
        where: {
          discussionId: dbDiscussionId,
          content: cmtObj.content,
        },
      });

      if (!existing) {
        let authorId = userIdMap.get(cmtObj.authorId);
        if (!authorId) {
          const defaultUser = await prisma.user.findFirst();
          authorId = defaultUser?.id;
        }
        if (!authorId) continue;

        await prisma.comment.create({
          data: {
            content: cmtObj.content,
            score: cmtObj.score || 0,
            upvotesCount: cmtObj.upvotesCount || 0,
            downvotesCount: cmtObj.downvotesCount || 0,
            depth: cmtObj.depth || 0,
            isAccepted: Boolean(cmtObj.isAccepted),
            authorId,
            discussionId: dbDiscussionId,
            createdAt: new Date(cmtObj.createdAt || Date.now()),
            updatedAt: new Date(cmtObj.updatedAt || Date.now()),
          },
        });
        importedComments++;
      }
    }
  }

  console.log('--- Import Summary ---');
  console.log(`Users imported: ${importedUsers}`);
  console.log(`Tags imported: ${importedTags}`);
  console.log(`Discussions imported: ${importedDiscussions}`);
  console.log(`Comments imported: ${importedComments}`);
  console.log('Data import finished successfully without duplication.');
}

importDataStore()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
