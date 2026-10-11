import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, hyphens, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(1, 'Please enter your password'),
});

export const createDiscussionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  content: z.string().min(10, 'Discussion content must be at least 10 characters'),
  tags: z.array(z.string().min(1).max(30)).min(1, 'Add at least one tag').max(5, 'Maximum of 5 tags allowed'),
});

export const updateDiscussionSchema = z.object({
  id: z.string(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  content: z.string().min(10, 'Discussion content must be at least 10 characters'),
  tags: z.array(z.string()).min(1).max(5),
});

export const createCommentSchema = z.object({
  discussionId: z.string(),
  content: z.string().min(2, 'Reply must be at least 2 characters').max(10000),
  parentId: z.string().optional().nullable(),
});

export const updateCommentSchema = z.object({
  id: z.string(),
  content: z.string().min(2, 'Reply must be at least 2 characters').max(10000),
});

export const reportSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  details: z.string().optional().nullable(),
  discussionId: z.string().optional().nullable(),
  commentId: z.string().optional().nullable(),
});
