import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'DramaForge | AI autonomous short drama production studio',
  description: 'Produce high-quality short dramas autonomously with collaboration of state-of-the-art AI agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", inter.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground relative">
        <AuthProvider>
          {children}
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 shadow-xl backdrop-blur-md select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            Powered with QwenAI
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
