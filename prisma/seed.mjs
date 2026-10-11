import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DevConnect database with sample content...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('devpass123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@devconnect.io',
      username: 'alexdev',
      displayName: 'Alex Rivers',
      passwordHash,
      role: 'ADMIN',
      bio: 'Full-stack architect, open-source enthusiast, building systems at scale.',
      githubUrl: 'https://github.com/alexrivers',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      reputation: 285,
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@devconnect.io',
      username: 'sarah_codes',
      displayName: 'Sarah Chen',
      passwordHash,
      role: 'MODERATOR',
      bio: 'Staff Frontend Engineer & React core contributor. Community lead at DevConnect.',
      githubUrl: 'https://github.com/sarahchen',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      reputation: 195,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'marcus@devconnect.io',
      username: 'marcus_k',
      displayName: 'Marcus Vance',
      passwordHash,
      role: 'USER',
      bio: 'Systems programmer exploring Rust, distributed systems, and PostgreSQL optimizations.',
      githubUrl: 'https://github.com/marcusv',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reputation: 80,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'elena@devconnect.io',
      username: 'elena_dev',
      displayName: 'Elena Rostova',
      passwordHash,
      role: 'USER',
      bio: 'Cloud Architect & DevOps advocate. Kubernetes, Terraform, CI/CD pipelines.',
      githubUrl: 'https://github.com/elenarostova',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      reputation: 120,
    },
  });

  // 3. Seed Tags
  const tagsData = [
    { name: 'React', slug: 'react', description: 'The library for web and native user interfaces', color: '#61dafb' },
    { name: 'TypeScript', slug: 'typescript', description: 'JavaScript with syntax for types', color: '#3178c6' },
    { name: 'Next.js', slug: 'nextjs', description: 'The React framework for production web applications', color: '#000000' },
    { name: 'PostgreSQL', slug: 'postgresql', description: 'Powerful, open-source object-relational database', color: '#336791' },
    { name: 'GraphQL', slug: 'graphql', description: 'A query language for your API', color: '#e535ab' },
    { name: 'Node.js', slug: 'nodejs', description: 'JavaScript runtime built on Chrome\'s V8 engine', color: '#68a063' },
    { name: 'Docker', slug: 'docker', description: 'Container platform for building and shipping apps', color: '#2496ed' },
    { name: 'Architecture', slug: 'architecture', description: 'Software design patterns and system design', color: '#f59e0b' },
  ];

  const tagMap = new Map();
  for (const t of tagsData) {
    const record = await prisma.tag.create({
      data: { ...t, postCount: 0 },
    });
    tagMap.set(t.slug, record);
  }

  // 4. Seed Discussions
  const disc1 = await prisma.discussion.create({
    data: {
      title: 'Architecting Server Components with GraphQL Yoga in Next.js App Router',
      slug: 'architecting-server-components-with-graphql-yoga-in-nextjs-app-router-e8a2b',
      content: `When building high-performance modern web apps, balancing Next.js Server Components with a flexible GraphQL layer can dramatically streamline state management and payload size.

### The Problem
Traditional setups often result in waterfall requests or duplicating data queries across React Server Components (RSC) and client interaction boundaries.

\`\`\`typescript
// Example Yoga context in App Router
export async function createContext(req: Request) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  return {
    currentUser: token ? verifyToken(token) : null,
    prisma,
  };
}
\`\`\`

### Key Takeaways
1. Run Yoga directly inside \`src/app/api/graphql/route.ts\`.
2. Extract context dynamically using web-standard \`Request\` headers and cookies.
3. Use dataloaders or Prisma batching to avoid N+1 queries.

What are your experiences handling cache invalidation between RSC and client GraphQL queries?`,
      authorId: admin.id,
      pinned: true,
      score: 24,
      upvotesCount: 25,
      downvotesCount: 1,
      commentsCount: 3,
      viewsCount: 342,
      tags: {
        create: [
          { tagId: tagMap.get('nextjs').id },
          { tagId: tagMap.get('graphql').id },
          { tagId: tagMap.get('typescript').id },
        ],
      },
    },
  });

  const disc2 = await prisma.discussion.create({
    data: {
      title: 'PostgreSQL Full-Text Search vs External Search Engines: When to Switch?',
      slug: 'postgresql-full-text-search-vs-external-search-engines-a91c3',
      content: `Many teams jump directly to Elasticsearch or Algolia before exhausting PostgreSQL's native capabilities. 

With \`tsvector\` and GIN indexes, PostgreSQL easily handles hundreds of thousands of documents with sub-10ms query times.

\`\`\`sql
-- Creating GIN index for search optimization
CREATE INDEX idx_discussions_search ON "Discussion"
USING gin(to_tsvector('english', title || ' ' || content));
\`\`\`

### Performance Considerations
- Under 1 million rows: Postgres Full-Text Search is nearly unbeatable in operational simplicity and transaction consistency.
- Beyond 10 million rows or heavy fuzzy typo tolerance: A dedicated engine like Meilisearch or Elasticsearch begins to shine.

How are you handling typo tolerance and ranking in PostgreSQL?`,
      authorId: user1.id,
      score: 18,
      upvotesCount: 18,
      downvotesCount: 0,
      commentsCount: 2,
      viewsCount: 215,
      tags: {
        create: [
          { tagId: tagMap.get('postgresql').id },
          { tagId: tagMap.get('architecture').id },
        ],
      },
    },
  });

  const disc3 = await prisma.discussion.create({
    data: {
      title: 'Clean Architecture in TypeScript: Boundary Enforcements and Domain Models',
      slug: 'clean-architecture-in-typescript-boundary-enforcements-d47f1',
      content: `Keeping your business domain isolated from database models (Prisma) and presentation layers (React/Next) is critical for long-term maintainability.

Here is a simple structure we've been using:
- \`src/domain\`: Pure business entities and invariants (zero external dependencies).
- \`src/services\`: Orchestration, validation via Zod, use-case logic.
- \`src/lib/db\`: Persistence adapters, Prisma queries.
- \`src/app\`: API route handlers and UI components.

Would love to hear how other teams structure their domain interfaces in full-stack TypeScript!`,
      authorId: moderator.id,
      score: 15,
      upvotesCount: 16,
      downvotesCount: 1,
      commentsCount: 1,
      viewsCount: 180,
      tags: {
        create: [
          { tagId: tagMap.get('typescript').id },
          { tagId: tagMap.get('architecture').id },
        ],
      },
    },
  });

  // Update tag counters
  await prisma.tag.update({ where: { slug: 'nextjs' }, data: { postCount: 1 } });
  await prisma.tag.update({ where: { slug: 'graphql' }, data: { postCount: 1 } });
  await prisma.tag.update({ where: { slug: 'typescript' }, data: { postCount: 2 } });
  await prisma.tag.update({ where: { slug: 'postgresql' }, data: { postCount: 1 } });
  await prisma.tag.update({ where: { slug: 'architecture' }, data: { postCount: 2 } });

  // 5. Seed Comments & Nested Replies
  const comment1 = await prisma.comment.create({
    data: {
      content: `Great writeup! For cache invalidation between RSC and GraphQL, we've had good success calling Next.js \`revalidateTag\` or \`revalidatePath\` right inside GraphQL mutations whenever mutations touch modified entities.`,
      discussionId: disc1.id,
      authorId: sarahChenUser().id,
      score: 8,
      upvotesCount: 8,
      depth: 0,
    },
  });

  // Nested reply to comment1
  const reply1 = await prisma.comment.create({
    data: {
      content: `+1 to this. It keeps the frontend reactive without having to manage heavy client caches like Apollo Client. Standard \`fetch\` with Next cache tags does wonders!`,
      discussionId: disc1.id,
      parentId: comment1.id,
      authorId: admin.id,
      score: 5,
      upvotesCount: 5,
      depth: 1,
      isAccepted: true,
    },
  });

  // Mark reply1 as the accepted solution for disc1
  await prisma.discussion.update({
    where: { id: disc1.id },
    data: {
      solved: true,
      solvedCommentId: reply1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: `Has anyone tested Yoga with WebSocket subscriptions deployed to Vercel or Cloudflare Workers? Since serverless disconnects persistent sockets, what is the best alternative? SSE or external pub/sub?`,
      discussionId: disc1.id,
      authorId: user2.id,
      score: 3,
      upvotesCount: 3,
      depth: 0,
    },
  });

  // Comment for disc2
  await prisma.comment.create({
    data: {
      content: `For typo tolerance in Postgres, the \`pg_trgm\` (trigram) extension is phenomenal! You can combine \`to_tsquery\` with trigram similarity thresholding for instant autocomplete suggestions.`,
      discussionId: disc2.id,
      authorId: moderator.id,
      score: 11,
      upvotesCount: 11,
      depth: 0,
    },
  });

  // 6. Seed Votes & Bookmarks
  await prisma.vote.create({
    data: {
      userId: user1.id,
      discussionId: disc1.id,
      type: 'UPVOTE',
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: user1.id,
      discussionId: disc1.id,
    },
  });

  // 7. Seed Notifications
  await prisma.notification.create({
    data: {
      userId: admin.id,
      actorId: moderator.id,
      type: 'REPLY',
      title: 'New reply to your discussion',
      message: `${moderator.username} replied to "Architecting Server Components with GraphQL Yoga"`,
      linkUrl: `/discussions/${disc1.slug}`,
      read: false,
    },
  });

  console.log('Seeding finished successfully!');

  function sarahChenUser() {
    return moderator;
  }
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
