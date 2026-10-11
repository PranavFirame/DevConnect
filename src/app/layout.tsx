import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DevConnect — The Developer Community Platform',
  description: 'Where developers connect, discuss architecture, share code, and build together.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F5F6F8] dark:bg-[#0E1015] text-[#17181D] dark:text-[#F3F4F6] antialiased selection:bg-[#F45170] selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-[#E5E7EB] dark:border-[#282C37] bg-white dark:bg-[#16181E] py-6 text-center text-xs text-[#697386]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© 2026 DevConnect. Built for professional developers.</p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <a href="/discussions" className="hover:text-[#F45170] transition-colors">Discussions</a>
                <a href="/tags" className="hover:text-[#F45170] transition-colors">Tags</a>
                <a href="/api/health" target="_blank" className="hover:text-[#F45170] transition-colors flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>API Status</span>
                </a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
