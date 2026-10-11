# DevConnect — Full-Stack Developer Community Platform

> **Where Developers Connect, Discuss, and Build Together.**

DevConnect is a full-stack, production-minded developer community platform designed for software engineers to publish technical discussions, ask architectural questions, share code snippets with live syntax highlighting, engage in threaded conversations, bookmark valuable solutions, and discover knowledge through fast search.

---

## 🌟 Key Features

- **🔐 Authentication & User Accounts**
  - Email & password registration with `bcryptjs` password hashing (10 salt rounds).
  - Stateless JWT authentication signed on the server and verified via request context / HTTP-only cookies.
  - Role-based authorization (`USER`, `MODERATOR`, `ADMIN`).
  - Developer profiles with avatar seed, GitHub link, biographical details, and reputation tracking.

- **💬 Discussion System**
  - Create, view, edit, and delete rich technical posts.
  - Markdown editor with live preview, syntax highlighting, word/char counts, and formatting toolbar.
  - Tagging system with tag catalogs and filtered feeds.
  - Post sorting: **Latest**, **Top Discussions (Popular)**, and **Unanswered**.
  - Server-side authorization checks on all operations.

- **🧵 Recursive Threaded Comments**
  - Multi-level nested replies with depth bounds (up to 5 levels) to prevent infinite UI nesting.
  - Discussion authors can mark replies as the **Accepted Solution**.
  - Upvote and downvote system with dynamic score calculation and duplicate-vote prevention.

- **⚡ GraphQL API (GraphQL Yoga)**
  - Schema-driven endpoint at `/api/graphql` integrated into Next.js App Router Route Handler.
  - Modular schema, type definitions, resolvers, context creation, and Zod validation.
  - Server-side authorization extracting user identity from Bearer token or cookie headers.

- **🔍 Search & Discovery**
  - Full-text search across titles, discussion bodies, author handles, and tags.
  - Dedicated search interface with debounced queries and tag filter pills.
  - Tag exploration catalog showing post counts and topic descriptions.

- **🛡️ Community Moderation & Notifications**
  - Real-time in-app activity notifications for replies and accepted answers.
  - Content reporting workflow with a protected moderation center (`/moderation`) for moderators and admins.

- **🚀 Optional Upstash Redis Caching & Resilient Fallback**
  - Seamless caching for popular tags and read-heavy queries.
  - **Zero-downtime fallback**: If Upstash credentials are not set, DevConnect automatically runs an in-memory cache with zero errors.

- **🩺 Health Check Endpoint**
  - Accessible at `/api/health`, reporting database connectivity, latency, memory RSS, and uptime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Icons** | Lucide Icons (`lucide-react`) |
| **API** | GraphQL Yoga 5, GraphQL 17 |
| **Database & ORM** | PostgreSQL, Prisma ORM 6.19 (Stable) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Cookies |
| **Validation** | Zod |
| **Caching** | `@upstash/redis` with in-memory fallback |
| **Testing** | Vitest 5 |

---

## 📁 Project Architecture & Directory Layout

```
DevConnect/
├── prisma/
│   ├── schema.prisma        # Database schema (User, Discussion, Comment, Tag, Vote, etc.)
│   └── seed.mjs             # Development database seed script
├── scripts/
│   └── benchmark.mjs        # Query latency and response size benchmark script
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/session/route.ts  # Cookie sync endpoint
│   │   │   ├── graphql/route.ts       # GraphQL Yoga route handler
│   │   │   └── health/route.ts        # System status & DB latency monitor
│   │   ├── bookmarks/page.tsx         # User saved posts
│   │   ├── discussions/
│   │   │   ├── page.tsx               # Filterable discussion catalog
│   │   │   ├── new/page.tsx           # Markdown post creator
│   │   │   └── [slug]/page.tsx        # Detail view & threaded replies
│   │   ├── moderation/page.tsx        # Protected moderator dashboard
│   │   ├── notifications/page.tsx     # Activity notifications tray
│   │   ├── search/page.tsx            # Full-text search interface
│   │   ├── settings/page.tsx          # Account & profile settings
│   │   ├── tags/                      # Tag exploration & tag detail
│   │   ├── users/[username]/page.tsx  # Developer public profile
│   │   ├── layout.tsx                 # Root layout with navbar & providers
│   │   └── page.tsx                   # Community home & discussion feed
│   ├── components/          # Reusable UI components
│   │   ├── DiscussionCard.tsx
│   │   ├── MarkdownEditor.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ThreadedComments.tsx
│   ├── lib/
│   │   ├── auth/            # Password hashing, JWT signing & AuthContext
│   │   ├── cache/           # Upstash Redis & in-memory cache adapter
│   │   ├── db/              # Prisma singleton client
│   │   ├── graphql/         # GraphQL schema, context & resolvers
│   │   ├── validation/      # Zod input schemas
│   │   └── utils.ts         # Utility functions
│   └── tests/               # Vitest unit & integration test suites
├── .env.example             # Documented environment variables
├── package.json             # NPM package scripts and dependencies
├── tsconfig.json            # Strict TypeScript configuration
└── vitest.config.ts         # Vitest configuration
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS (Verified on `v22.23.2`)
- **npm**: v10 or v11 (Verified on `11.7.0`)
- **PostgreSQL**: Local PostgreSQL server, Docker container, or free cloud database (Neon.tech / Supabase / Railway).

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/DevConnect.git
cd DevConnect
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devconnect?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
SESSION_COOKIE_NAME="devconnect_token"

# Optional (Leave blank to use internal memory cache)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 4. Database Initialization & Seeding
Push the schema to your PostgreSQL database and run the seed script:

```bash
# Push Prisma schema to your PostgreSQL database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Populate realistic test discussions, tags, and sample users
npm run prisma:seed
```

#### Seed Demo Credentials (Development Only)
| Role | Username | Email | Password |
|---|---|---|---|
| **Admin** | `alexdev` | `admin@devconnect.io` | `devpass123` |
| **Moderator** | `sarah_codes` | `moderator@devconnect.io` | `devpass123` |
| **Developer** | `marcus_k` | `marcus@devconnect.io` | `devpass123` |
| **Developer** | `elena_dev` | `elena@devconnect.io` | `devpass123` |

### 5. Running the Application
Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the test suite with Vitest:

```bash
npm run test
```

Run a production compilation build:

```bash
npm run build
```

Run the performance and GraphQL query latency benchmark:

```bash
npm run benchmark
```

---

## 📡 GraphQL Yoga API Examples

The GraphQL playground and endpoint is active at `/api/graphql`.

### 1. Fetch Discussions Feed
```graphql
query GetDiscussions {
  discussions(limit: 10, sort: "newest") {
    totalCount
    discussions {
      id
      title
      slug
      score
      commentsCount
      author {
        username
        displayName
      }
      tags {
        name
        slug
      }
    }
  }
}
```

### 2. Create Discussion
```graphql
mutation CreatePost {
  createDiscussion(
    title: "How to use Prisma with Server Components"
    content: "Detailed content explaining patterns..."
    tags: ["nextjs", "postgresql", "prisma"]
  ) {
    id
    slug
    createdAt
  }
}
```

### 3. Vote on Discussion
```graphql
mutation Upvote {
  voteDiscussion(discussionId: "DISC_ID_HERE", type: UPVOTE) {
    score
    userVote
  }
}
```

---

## 🚢 Free-Tier Deployment Guide (Vercel + Neon)

DevConnect is architected to run completely free using popular hosting and database providers:

1. **Database (Neon.tech)**:
   - Create a free project at [Neon](https://neon.tech) (0.5 GiB free storage, 1 compute branch).
   - Copy the Pooled Connection String (`postgresql://...`).
2. **Hosting (Vercel Hobby Tier)**:
   - Connect your GitHub repository to [Vercel](https://vercel.com).
   - In Environment Variables, set:
     - `DATABASE_URL` = your Neon pooled connection string.
     - `JWT_SECRET` = random 64-character secret.
     - `NEXT_PUBLIC_APP_URL` = your Vercel deployment URL (e.g. `https://devconnect.vercel.app`).
   - Run `npx prisma db push` before first deployment or add a build command: `npx prisma generate && next build`.
3. **Optional Redis (Upstash Free Tier)**:
   - Create a free Redis database on [Upstash](https://upstash.com).
   - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel.

---

## 📄 License
MIT License. Built for the modern developer community.
