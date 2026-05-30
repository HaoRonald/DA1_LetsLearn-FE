import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    template: "%s | Let's learn",
    default: "Let's learn – Nền tảng hỗ trợ học tập thông minh",
  },
  description: "Nền tảng hỗ trợ học tập trực tuyến với bài học đa dạng, bài tập phong phú và học tập tương tác.",
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
