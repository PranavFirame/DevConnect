import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'devconnect-default-secret-key-change-in-production';
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'devconnect_token';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
