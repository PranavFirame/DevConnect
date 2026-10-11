import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const response = NextResponse.json({ success: true });

    if (token) {
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } else {
      // Logout
      response.cookies.delete(SESSION_COOKIE_NAME);
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to manage session' }, { status: 400 });
  }
}
