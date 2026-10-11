import { TokenPayload, verifyToken, extractTokenFromHeader, SESSION_COOKIE_NAME } from '@/lib/auth';
import prisma, { isDatabaseAvailable } from '@/lib/db/prisma';
import { cache } from '@/lib/cache';

export interface GraphQLContext {
  currentUser: TokenPayload | null;
  prisma: typeof prisma;
  cache: typeof cache;
  token?: string | null;
  isDbAvailable: () => Promise<boolean>;
}

export async function createContext(request: Request): Promise<GraphQLContext> {
  let token: string | null = null;

  // 1. Check Authorization Header (Bearer token)
  const authHeader = request.headers.get('authorization');
  token = extractTokenFromHeader(authHeader);

  // 2. Check Cookie Header
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
      if (match) {
        token = match.substring(`${SESSION_COOKIE_NAME}=`.length);
      }
    }
  }

  const currentUser = token ? verifyToken(token) : null;

  return {
    currentUser,
    prisma,
    cache,
    token,
    isDbAvailable: isDatabaseAvailable,
  };
}
