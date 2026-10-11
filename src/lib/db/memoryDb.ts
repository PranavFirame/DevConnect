// In-memory mock database store for seamless local execution without live PostgreSQL
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface MockUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  reputation: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  postCount: number;
  createdAt: Date;
}

export interface MockDiscussion {
  id: string;
  title: string;
  slug: string;
  content: string;
  pinned: boolean;
  solved: boolean;
  score: number;
  upvotesCount: number;
  downvotesCount: number;
  commentsCount: number;
  viewsCount: number;
  authorId: string;
  solvedCommentId?: string | null;
  tagIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockComment {
  id: string;
  content: string;
  score: number;
  upvotesCount: number;
  downvotesCount: number;
  depth: number;
  isAccepted: boolean;
  authorId: string;
  discussionId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockVote {
  id: string;
  userId: string;
  discussionId?: string | null;
  commentId?: string | null;
  type: 'UPVOTE' | 'DOWNVOTE';
  createdAt: Date;
}

export interface MockBookmark {
  id: string;
  userId: string;
  discussionId: string;
  createdAt: Date;
}

export interface MockNotification {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  read: boolean;
  createdAt: Date;
}

export interface MockReport {
  id: string;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reporterId: string;
  discussionId?: string | null;
  commentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'db', 'data-store.json');

class MemoryDb {
  public users: Map<string, MockUser>;
  public tags: Map<string, MockTag>;
  public discussions: Map<string, MockDiscussion>;
  public comments: Map<string, MockComment>;
  public votes: Map<string, MockVote>;
  public bookmarks: Map<string, MockBookmark>;
  public notifications: Map<string, MockNotification>;
  public reports: Map<string, MockReport>;

  private createAutoSaveMap<K, V>(): Map<K, V> {
    const map = new Map<K, V>();
    const originalSet = map.set.bind(map);
    const originalDelete = map.delete.bind(map);
    const originalClear = map.clear.bind(map);

    map.set = (key: K, value: V) => {
      const res = originalSet(key, value);
      this.saveToDisk();
      return res;
    };

    map.delete = (key: K) => {
      const res = originalDelete(key);
      this.saveToDisk();
      return res;
    };

    map.clear = () => {
      originalClear();
      this.saveToDisk();
    };

    return map;
  }

  constructor() {
    this.users = this.createAutoSaveMap<string, MockUser>();
    this.tags = this.createAutoSaveMap<string, MockTag>();
    this.discussions = this.createAutoSaveMap<string, MockDiscussion>();
    this.comments = this.createAutoSaveMap<string, MockComment>();
    this.votes = this.createAutoSaveMap<string, MockVote>();
    this.bookmarks = this.createAutoSaveMap<string, MockBookmark>();
    this.notifications = this.createAutoSaveMap<string, MockNotification>();
    this.reports = this.createAutoSaveMap<string, MockReport>();

    this.seedDefaultData();
    this.loadFromDisk();
  }

  public saveToDisk() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        tags: Array.from(this.tags.entries()),
        discussions: Array.from(this.discussions.entries()),
        comments: Array.from(this.comments.entries()),
        votes: Array.from(this.votes.entries()),
        bookmarks: Array.from(this.bookmarks.entries()),
        notifications: Array.from(this.notifications.entries()),
        reports: Array.from(this.reports.entries()),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store to disk:', err);
    }
  }

  public loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        this.saveToDisk();
        return;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (data.users && Array.isArray(data.users)) {
        this.users.clear();
        data.users.forEach(([k, v]: [string, MockUser]) => {
          this.users.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          });
        });
      }
      if (data.tags && Array.isArray(data.tags)) {
        this.tags.clear();
        data.tags.forEach(([k, v]: [string, MockTag]) => {
          this.tags.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
          });
        });
      }
      if (data.discussions && Array.isArray(data.discussions)) {
        this.discussions.clear();
        data.discussions.forEach(([k, v]: [string, MockDiscussion]) => {
          this.discussions.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          });
        });
      }
      if (data.comments && Array.isArray(data.comments)) {
        this.comments.clear();
        data.comments.forEach(([k, v]: [string, MockComment]) => {
          this.comments.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          });
        });
      }
      if (data.votes && Array.isArray(data.votes)) {
        this.votes.clear();
        data.votes.forEach(([k, v]: [string, MockVote]) => {
          this.votes.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
          });
        });
      }
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        this.bookmarks.clear();
        data.bookmarks.forEach(([k, v]: [string, MockBookmark]) => {
          this.bookmarks.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
          });
        });
      }
      if (data.notifications && Array.isArray(data.notifications)) {
        this.notifications.clear();
        data.notifications.forEach(([k, v]: [string, MockNotification]) => {
          this.notifications.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
          });
        });
      }
      if (data.reports && Array.isArray(data.reports)) {
        this.reports.clear();
        data.reports.forEach(([k, v]: [string, MockReport]) => {
          this.reports.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          });
        });
      }
    } catch (err) {
      console.error('Failed to load store from disk:', err);
    }
  }

  private seedDefaultData() {
    const passwordHash = bcrypt.hashSync('devpass123', 10);

    const admin: MockUser = {
      id: 'usr_admin',
      email: 'admin@devconnect.io',
      username: 'alexdev',
      displayName: 'Alex Rivers',
      passwordHash,
      bio: 'Full-stack architect & open-source contributor.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      githubUrl: 'https://github.com/alexrivers',
      role: 'ADMIN',
      reputation: 285,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const moderator: MockUser = {
      id: 'usr_mod',
      email: 'moderator@devconnect.io',
      username: 'sarah_codes',
      displayName: 'Sarah Chen',
      passwordHash,
      bio: 'Staff Frontend Engineer & React core contributor.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      githubUrl: 'https://github.com/sarahchen',
      role: 'MODERATOR',
      reputation: 195,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const developer: MockUser = {
      id: 'usr_dev',
      email: 'marcus@devconnect.io',
      username: 'marcus_k',
      displayName: 'Marcus Vance',
      passwordHash,
      bio: 'Systems programmer exploring Rust and distributed architectures.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      githubUrl: 'https://github.com/marcusv',
      role: 'USER',
      reputation: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(admin.id, admin);
    this.users.set(moderator.id, moderator);
    this.users.set(developer.id, developer);

    // Tags
    const tagList = [
      { id: 'tag_react', name: 'React', slug: 'react', description: 'The library for web and native UIs', postCount: 1 },
      { id: 'tag_ts', name: 'TypeScript', slug: 'typescript', description: 'JavaScript with syntax for types', postCount: 2 },
      { id: 'tag_next', name: 'Next.js', slug: 'nextjs', description: 'The React Framework for the Web', postCount: 1 },
      { id: 'tag_pg', name: 'PostgreSQL', slug: 'postgresql', description: 'Open-source object-relational database', postCount: 1 },
      { id: 'tag_gql', name: 'GraphQL', slug: 'graphql', description: 'A query language for your API', postCount: 1 },
      { id: 'tag_arch', name: 'Architecture', slug: 'architecture', description: 'Software design patterns and system design', postCount: 1 },
    ];

    tagList.forEach((t) => {
      this.tags.set(t.id, { ...t, createdAt: new Date() });
    });

    // Discussions
    const disc1: MockDiscussion = {
      id: 'disc_1',
      title: 'Architecting Server Components with GraphQL Yoga in Next.js App Router',
      slug: 'architecting-server-components-with-graphql-yoga-in-nextjs-app-router',
      content: `When building high-performance modern web apps, balancing Next.js Server Components with a flexible GraphQL layer can dramatically streamline state management and payload size.

\`\`\`typescript
// GraphQL Yoga Route in Next.js App Router
export async function POST(req: Request) {
  return yoga.handleRequest(req, {});
}
\`\`\`

What are your experiences handling cache invalidation between RSC and client GraphQL queries?`,
      pinned: true,
      solved: true,
      score: 24,
      upvotesCount: 25,
      downvotesCount: 1,
      commentsCount: 2,
      viewsCount: 342,
      authorId: admin.id,
      solvedCommentId: 'cmt_2',
      tagIds: ['tag_next', 'tag_gql', 'tag_ts'],
      createdAt: new Date(Date.now() - 3600000 * 5),
      updatedAt: new Date(Date.now() - 3600000 * 5),
    };

    const disc2: MockDiscussion = {
      id: 'disc_2',
      title: 'PostgreSQL Full-Text Search vs External Search Engines: When to Switch?',
      slug: 'postgresql-full-text-search-vs-external-search-engines',
      content: `Many teams jump directly to Elasticsearch or Algolia before exhausting PostgreSQL's native capabilities. 

With \`tsvector\` and GIN indexes, PostgreSQL easily handles hundreds of thousands of documents with sub-10ms query times.

\`\`\`sql
CREATE INDEX idx_discussions_search ON "Discussion"
USING gin(to_tsvector('english', title || ' ' || content));
\`\`\`

How are you handling typo tolerance and ranking in PostgreSQL?`,
      pinned: false,
      solved: false,
      score: 18,
      upvotesCount: 18,
      downvotesCount: 0,
      commentsCount: 1,
      viewsCount: 215,
      authorId: developer.id,
      tagIds: ['tag_pg', 'tag_arch'],
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 12),
    };

    this.discussions.set(disc1.id, disc1);
    this.discussions.set(disc2.id, disc2);

    // Comments
    const cmt1: MockComment = {
      id: 'cmt_1',
      content: `Great writeup! For cache invalidation between RSC and GraphQL, we've had good success calling Next.js revalidateTag or revalidatePath right inside GraphQL mutations whenever mutations touch modified entities.`,
      score: 8,
      upvotesCount: 8,
      downvotesCount: 0,
      depth: 0,
      isAccepted: false,
      authorId: moderator.id,
      discussionId: disc1.id,
      parentId: null,
      createdAt: new Date(Date.now() - 3600000 * 3),
      updatedAt: new Date(Date.now() - 3600000 * 3),
    };

    const cmt2: MockComment = {
      id: 'cmt_2',
      content: `+1 to this. It keeps the frontend reactive without having to manage heavy client caches like Apollo Client. Standard fetch with Next cache tags does wonders!`,
      score: 5,
      upvotesCount: 5,
      downvotesCount: 0,
      depth: 1,
      isAccepted: true,
      authorId: admin.id,
      discussionId: disc1.id,
      parentId: 'cmt_1',
      createdAt: new Date(Date.now() - 3600000 * 2),
      updatedAt: new Date(Date.now() - 3600000 * 2),
    };

    this.comments.set(cmt1.id, cmt1);
    this.comments.set(cmt2.id, cmt2);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var memoryDbGlobal: MemoryDb | undefined;
}

export const memoryDb = globalThis.memoryDbGlobal ?? new MemoryDb();

if (process.env.NODE_ENV !== 'production') {
  globalThis.memoryDbGlobal = memoryDb;
}

