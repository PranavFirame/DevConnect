import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DevConnect — Where Developers Connect, Discuss, and Build Together',
  description: 'A modern full-stack developer community platform for sharing discussions, solving technical challenges, and collaborating on code.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
            <p>© 2026 DevConnect — Engineering Community Platform. Open Source & Production Minded.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
