export const typeDefs = /* GraphQL */ `
  enum Role {
    USER
    MODERATOR
    ADMIN
  }

  enum VoteType {
    UPVOTE
    DOWNVOTE
  }

  enum ReportStatus {
    PENDING
    REVIEWED
    RESOLVED
    DISMISSED
  }

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    bio: String
    avatarUrl: String
    githubUrl: String
    websiteUrl: String
    role: Role!
    reputation: Int!
    createdAt: String!
    discussionsCount: Int!
    commentsCount: Int!
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    color: String
    postCount: Int!
  }

  type Discussion {
    id: ID!
    title: String!
    slug: String!
    content: String!
    pinned: Boolean!
    solved: Boolean!
    score: Int!
    upvotesCount: Int!
    downvotesCount: Int!
    commentsCount: Int!
    viewsCount: Int!
    createdAt: String!
    updatedAt: String!
    author: User!
    tags: [Tag!]!
    solvedCommentId: String
    solvedComment: Comment
    userVote: VoteType
    isBookmarked: Boolean!
  }

  type Comment {
    id: ID!
    content: String!
    score: Int!
    upvotesCount: Int!
    downvotesCount: Int!
    depth: Int!
    isAccepted: Boolean!
    createdAt: String!
    updatedAt: String!
    discussionId: String!
    author: User!
    parentId: String
    replies: [Comment!]!
    userVote: VoteType
  }

  type DiscussionFeed {
    discussions: [Discussion!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type SearchResult {
    discussions: [Discussion!]!
    totalCount: Int!
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    linkUrl: String
    read: Boolean!
    createdAt: String!
    actor: User
  }

  type Report {
    id: ID!
    reason: String!
    details: String
    status: ReportStatus!
    createdAt: String!
    reporter: User!
    discussion: Discussion
    comment: Comment
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type VoteResult {
    score: Int!
    userVote: VoteType
    upvotesCount: Int!
    downvotesCount: Int!
  }

  type BookmarkResult {
    isBookmarked: Boolean!
  }

  type Query {
    me: User
    user(username: String!): User
    discussions(
      page: Int
      limit: Int
      sort: String
      tag: String
      author: String
    ): DiscussionFeed!
    discussion(slug: String, id: String): Discussion
    comments(discussionId: ID!): [Comment!]!
    search(query: String!, page: Int, limit: Int, tag: String): SearchResult!
    tags(limit: Int): [Tag!]!
    tag(slug: String!): Tag
    bookmarks(page: Int, limit: Int): [Discussion!]!
    notifications(limit: Int): [Notification!]!
    unreadNotificationsCount: Int!
    reports(status: ReportStatus): [Report!]!
  }

  type Mutation {
    register(
      email: String!
      username: String!
      password: String!
      displayName: String!
    ): AuthPayload!

    login(emailOrUsername: String!, password: String!): AuthPayload!

    logout: Boolean!

    createDiscussion(
      title: String!
      content: String!
      tags: [String!]!
    ): Discussion!

    updateDiscussion(
      id: ID!,
      title: String!
      content: String!
      tags: [String!]!
    ): Discussion!

    deleteDiscussion(id: ID!): Boolean!

    createComment(
      discussionId: ID!
      content: String!
      parentId: ID
    ): Comment!

    updateComment(id: ID!, content: String!): Comment!

    deleteComment(id: ID!): Boolean!

    voteDiscussion(discussionId: ID!, type: VoteType!): VoteResult!

    voteComment(commentId: ID!, type: VoteType!): VoteResult!

    toggleBookmark(discussionId: ID!): BookmarkResult!

    acceptSolution(discussionId: ID!, commentId: ID!): Discussion!

    reportContent(
      reason: String!
      details: String
      discussionId: ID
      commentId: ID
    ): Report!

    markNotificationAsRead(id: ID!): Boolean!

    markAllNotificationsAsRead: Boolean!

    updateReportStatus(id: ID!, status: ReportStatus!): Report!
  }
`;
