'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import ShellChrome from '@/components/layout/shell/ShellChrome';

interface AppFrameProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/', '/login'];

export default function AppFrame({ children }: AppFrameProps): JSX.Element {
  const pathname = usePathname();

  const isPublic = useMemo(() => {
    return PUBLIC_PATHS.some((route) => (route === '/' ? pathname === route : pathname.startsWith(route)));
  }, [pathname]);

  if (isPublic) {
    return <>{children}</>;
  }

  return <ShellChrome>{children}</ShellChrome>;
}
