import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    template: '%s | EnglishApp',
    default: 'EnglishApp – Học tiếng Anh hiệu quả',
  },
  description: 'Nền tảng học tiếng Anh trực tuyến với bài học đa dạng, từ vựng phong phú và luyện tập tương tác.',
};

import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${nunito.variable} min-h-screen flex flex-col font-sans antialiased text-[#000000]`}>
        <AuthProvider>
          {/* <Navbar /> */}
          <main className="flex-1">
            {children}
          </main>
          {/* <Footer /> */}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
