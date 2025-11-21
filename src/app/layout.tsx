import type { Metadata } from 'next';
import '../global.css';
import { ReactNode } from 'react';
import AppFrame from '@/components/layout/AppFrame';

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: 'Aska CMS',
  description: 'Content Management System for the Aska Monorepo.',
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

