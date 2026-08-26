import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/layout/sidebar-context';
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
    <html lang="es" className="h-full">
      <body className="h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-x-hidden">
        <SidebarProvider>
          <Sidebar />
          <div className="min-h-screen flex flex-col w-full">
            {children}
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
