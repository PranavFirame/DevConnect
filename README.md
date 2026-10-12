# DevConnect — Full-Stack Developer Community Platform

> **Where Developers Connect, Discuss, and Build Together.**

DevConnect is a modern, production-grade developer community platform designed for software engineers to publish technical discussions, ask architectural questions, share code snippets with live syntax highlighting, engage in threaded conversations, bookmark valuable solutions, and discover knowledge through fast search.

---

## 🌟 Key Features

- **🔐 Authentication & User Accounts**
  - Email & username sign-in with password hashing via `bcryptjs`.
  - Stateless JWT authentication signed on the server and verified via request context / HTTP-only cookies.
  - Role-based authorization (`USER`, `MODERATOR`, `ADMIN`).
  - Developer profiles with avatar upload / robotic avatar generator, bio, and portfolio links.

- **💬 Discussion System**
  - Create, view, edit, and delete rich technical posts.
  - Markdown editor with live preview, syntax highlighting, word/char counts, and formatting toolbar.
  - Tagging system with tag catalogs and filtered feeds.
  - Post sorting: **Latest**, **Top Discussions (Popular)**, and **Unanswered**.

- **🧵 Recursive Threaded Comments**
  - Multi-level nested replies with depth bounds (up to 5 levels) to prevent infinite UI nesting.
  - Discussion authors can mark replies as the **Accepted Solution**.
  - Upvote and downvote system with dynamic score calculation and duplicate-vote prevention.

- **⚡ GraphQL API (GraphQL Yoga)**
  - Schema-driven endpoint at `/api/graphql` integrated into Next.js App Router Route Handler.
  - Unmasked, user-friendly validation errors (`GraphQLError`) for client safety and clarity.
  - Modular schema, type definitions, resolvers, context creation, and Zod validation.

- **🔍 Search & Discovery**
  - Full-text search across titles, discussion bodies, author handles, and tags.
  - Dedicated search interface with debounced queries and tag filter pills.
  - Tag exploration catalog showing post counts and topic descriptions.

- **🛡️ Community Moderation & Notifications**
  - Real-time in-app activity notifications for replies and accepted answers.
  - Content reporting workflow with a protected moderation center (`/moderation`) for moderators and admins.

- **⚡ Resilient Caching with Upstash Redis**
  - Upstash Redis caching via REST API for popular tags and read-heavy queries.
  - Safe, non-blocking cache layer: failures never cause application data loss.

- **🩺 Health Check Endpoint**
  - Accessible at `/api/health`, reporting live Neon PostgreSQL database connectivity (`SELECT 1`), Upstash Redis status, latency, memory RSS, and uptime.

---

## 🛠️ Technology Stack & Cloud Infrastructure

| Layer | Technology | Service Provider / Link |
|---|---|---|
| **Frontend & API** | Next.js 16 (App Router), React 19, Tailwind CSS v4 | [Vercel](https://vercel.com) |
| **API Layer** | GraphQL Yoga 5, GraphQL 17 | Next.js Route Handlers |
| **Primary Database** | Serverless PostgreSQL | [Neon](https://console.neon.tech/) |
| **ORM & Migrations**| Prisma ORM 6.19 (with Connection Pooling & Direct URL) | `@prisma/client` |
| **Cache Layer** | Serverless Redis (REST API) | [Upstash Redis](https://console.upstash.com/redis) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Cookies | Custom auth |
| **Validation** | Zod | Runtime validation |
| **Testing** | Vitest 5 | Integration & Unit Tests |

---

## 📁 Project Architecture & Directory Layout

```
DevConnect/
├── prisma/
│   ├── schema.prisma        # Database schema (User, Discussion, Comment, Tag, Vote, etc.)
│   ├── migrations/          # Baselined database migrations (0_init)
│   └── seed.mjs             # Development database seed script
├── scripts/
│   ├── benchmark.mjs        # Query latency and response size benchmark script
│   └── import-datastore.mjs # Idempotent data migration utility from JSON to Neon
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/session/route.ts  # Cookie sync endpoint
│   │   │   ├── graphql/route.ts       # GraphQL Yoga route handler
│   │   │   └── health/route.ts        # Live Neon & Redis health monitor
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
│   │   ├── cache/           # Upstash Redis client with resilient fallback
│   │   ├── db/              # Standard Next.js singleton PrismaClient
│   │   ├── graphql/         # GraphQL schema, context & resolvers
│   │   ├── validation/      # Zod input schemas
│   │   └── utils.ts         # Utility functions
│   └── tests/               # Vitest test suite (Auth & Neon PostgreSQL integration)
├── .env.example             # Documented environment variables
├── package.json             # NPM package scripts and dependencies
├── tsconfig.json            # Strict TypeScript configuration
└── vitest.config.ts         # Vitest configuration
```

---

## ☁️ Cloud Infrastructure & Deployment

### 1. Primary Database: [Neon PostgreSQL](https://console.neon.tech/)
Neon provides serverless PostgreSQL with connection pooling:
- **Runtime Pooled Connection (`DATABASE_URL`)**: Uses pgBouncer pooler (`-pooler` hostname) to handle serverless connection bursts from Vercel.
- **Migration Direct Connection (`DIRECT_URL`)**: Direct connection to Neon compute without the pooler, required for `prisma migrate deploy`.

### 2. Cache: [Upstash Redis](https://console.upstash.com/redis)
Upstash provides serverless Redis with low latency and REST API access:
- Uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Redis is used strictly for caching read-heavy endpoints (such as top tags and discussions); all mutations and persistent data reside directly in Neon.

### 3. Hosting & Serverless Compute: [Vercel](https://vercel.com)
The frontend and GraphQL API are deployed on Vercel:
- Automated builds run `prisma generate && prisma migrate deploy && next build`.
- Ephemeral serverless functions connect directly to Neon via the singleton Prisma client.

---

## 🔑 Environment Variables Configuration

Set these environment variables locally in your `.env` file and in the **Vercel Dashboard** under **Project Settings → Environment Variables**:

| Variable | Description | Example / Format |
|---|---|---|
| `DATABASE_URL` | Neon **Pooled** connection string (pgBouncer) | `postgresql://neondb_owner:***@ep-***-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Neon **Direct** connection string (non-pooler) | `postgresql://neondb_owner:***@ep-***.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for signing session tokens | `your-secure-jwt-secret-key-32-chars-or-more` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://***.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST access token | `AX...` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `https://your-domain.vercel.app` (or `http://localhost:3000`) |

> **Note for Vercel**: Ensure `DATABASE_URL` and `DIRECT_URL` are enabled across all three environments (**Production**, **Preview**, and **Development**).

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/PranavFirame/DevConnect.git
cd DevConnect
npm install --legacy-peer-deps
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Neon and Upstash credentials:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client & Run Migrations
```bash
# Generate the Prisma client
npm run prisma:generate

# Apply pending migrations
npm run prisma:migrate
```

### 4. (Optional) Import Legacy Mock Data or Seed
```bash
# Idempotently migrate mock records from data-store.json into Neon
npm run import:datastore

# Or seed sample test users and discussions
npm run prisma:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification

Run the automated test suite (including Neon PostgreSQL persistence tests):
```bash
npm run test
```

Run a production build check:
```bash
npm run build
```

Run query latency benchmarks:
```bash
npm run benchmark
```

---

## 📡 GraphQL API Reference

The GraphQL endpoint is available at `/api/graphql`.

### Example: Query Discussions
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

### Example: Create Discussion
```graphql
mutation CreatePost {
  createDiscussion(
    title: "Best practices for Serverless PostgreSQL with Prisma"
    content: "Detailed post on connection pooling and migrations..."
    tags: ["nextjs", "postgresql", "neon", "prisma"]
  ) {
    id
    slug
    createdAt
  }
}
```

---

## 📄 License
MIT License. Built for the modern developer community.
