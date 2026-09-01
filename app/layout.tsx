import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-context';
import { ThemeProvider } from '@/components/layout/theme-context';
import { AppShell } from '@/components/layout/app-shell';

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
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
