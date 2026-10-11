import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken } from '@/lib/auth';
import { registerSchema, createDiscussionSchema } from '@/lib/validation';

describe('Auth & Security Utilities', () => {
  it('should securely hash and verify passwords using bcrypt', async () => {
    const password = 'SuperSecretDevPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toEqual(password);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('wrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and verify valid JWT tokens', () => {
    const payload = {
      userId: 'user_123',
      email: 'test@devconnect.io',
      username: 'dev_tester',
      role: 'USER' as const,
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.username).toBe(payload.username);
  });

  it('should reject invalid or tampered JWT tokens', () => {
    const invalidToken = 'ey.fake.token';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });
});

describe('Validation Schemas', () => {
  it('should validate valid user registration payload', () => {
    const validData = {
      email: 'alex@example.com',
      username: 'alex_codes',
      password: 'password123',
      displayName: 'Alex Codes',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid username characters or short passwords', () => {
    const invalidData = {
      email: 'invalid-email',
      username: 'bad username with spaces',
      password: '123',
      displayName: 'A',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should enforce discussion title length and tag limits', () => {
    const validPost = {
      title: 'How to optimize Postgres full-text search',
      content: 'Here is detailed markdown content with multiple words and sections.',
      tags: ['postgres', 'performance'],
    };

    const result = createDiscussionSchema.safeParse(validPost);
    expect(result.success).toBe(true);

    const tooManyTags = {
      ...validPost,
      tags: ['1', '2', '3', '4', '5', '6'],
    };
    expect(createDiscussionSchema.safeParse(tooManyTags).success).toBe(false);
  });
});
