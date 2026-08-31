import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-context';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { ThemeProvider } from '@/components/layout/theme-context';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Licitaciones - CSC',
  description:
    'Sistema web de gestión de licitaciones comerciales con Next.js, Supabase, Resend y Vercel Cron Jobs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <Sidebar />
              <div className="min-h-screen flex flex-col w-full">
                {children}
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
