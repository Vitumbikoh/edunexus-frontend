
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileStudentLayout from './MobileStudentLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Set initial on mount
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Students: keep the current mobile layout on phones only.
  if (user?.role === 'student' && isMobile) {
    return (
      <MobileStudentLayout>
        {children}
      </MobileStudentLayout>
    );
  }

  // Non-student roles: use an overlay sidebar layout on phones only.
  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-3">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  // Default desktop layout for other roles
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isOpen ? "ml-56" : "ml-20"
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
