# DevConnect Architecture & Technical Specifications

## 1. System Overview

DevConnect implements a clean three-tiered web architecture optimized for full-stack developer interaction and low latency:

```
[ Next.js 16 App Router Client (React 19) ]
                    │
            HTTP/JSON (GraphQL / REST)
                    │
                    ▼
[ Next.js Route Handler Gateway ]
    ├── /api/graphql ──> [ GraphQL Yoga Engine ]
    │                           ├── Auth Context Extractor (JWT / Cookie)
    │                           ├── Input Validation Layer (Zod)
    │                           └── Resolvers (Queries / Mutations)
    ├── /api/health  ──> [ System Latency & Uptime Monitor ]
    └── /api/auth    ──> [ HTTP-only Cookie Synchronizer ]
                    │
                    ▼
[ Data Access Layer & Caching ]
    ├── Upstash Redis Client ──(Graceful Fallback)──> In-Memory LRU Map
    └── Prisma ORM (v6.19.3 Stable)
                    │
                    ▼
        [ PostgreSQL Database ]
```

## 2. Security Boundaries & Authorization Model

1. **Context Extraction**:
   Every GraphQL request passes through `createContext(request)`. The Bearer token (from `Authorization` header) or the session cookie (`devconnect_token`) is cryptographically verified against `JWT_SECRET`. The payload contains `{ userId, email, username, role }`.

2. **Server-Side Enforcement**:
   No client-supplied user identifiers are trusted. Resolvers verify `ctx.currentUser` on all protected mutations:
   - Creating a post automatically assigns `authorId: ctx.currentUser.userId`.
   - Editing/Deleting checks `existing.authorId === ctx.currentUser.userId || ctx.currentUser.role === 'ADMIN'`.
   - Moderation queries and report status updates require `role === 'MODERATOR' || role === 'ADMIN'`.

3. **Input Sanitization**:
   All mutation inputs are passed through strict Zod schemas (`registerSchema`, `createDiscussionSchema`, `createCommentSchema`). Output rendering strips raw script tags and encodes dangerous characters to prevent Stored XSS attacks.

4. **Vote Invariants**:
   Votes on discussions and comments are modeled as unique composite indexes `@@unique([userId, discussionId])` and `@@unique([userId, commentId])`. Duplicate votes are prevented at both the application resolver and database engine layers.

## 3. Discussion & Comment Threading Engine

- **Tree Reconstruction**: Comments are stored with flat parent-child pointers (`parentId` referencing `Comment.id`).
- **Resolver Aggregation**: Resolvers retrieve flat comment lists for a discussion and assemble a recursive tree with zero recursion overhead on the database.
- **Depth Limiting**: The system enforces a maximum comment depth of 5 levels to avoid layout degeneration on mobile devices.

## 4. Caching & Resilience Strategy

- Read-heavy entities such as popular tags (`tags(limit: Int)`) are cached for 300 seconds.
- The cache layer is designed with polymorphic fallback: when `UPSTASH_REDIS_REST_URL` is omitted, the `MemoryCache` class provides in-process key-value storage with TTL expiry.
