'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import HeaderWrapper from './HeaderWrapper';

interface LayoutWrapperProps {
  children: ReactNode;
}

/**
 * LayoutWrapper component that conditionally renders the Header based on the current route.
 * The Header is shown on all authenticated routes but hidden on public routes (/, /login).
 */
export default function LayoutWrapper({ children }: LayoutWrapperProps): JSX.Element {
  const pathname = usePathname();

  // Public routes that should NOT show the authenticated header
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login');

  return (
    <>
      {!isPublicRoute && <HeaderWrapper />}
      {children}
    </>
  );
}

