
import React from 'react';
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

  // Use mobile-first layout for students
  if (user?.role === 'student') {
    return (
      <MobileStudentLayout>
        {children}
      </MobileStudentLayout>
    );
  }

  // Default desktop layout for other roles
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isOpen ? "ml-64" : "ml-20"
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
