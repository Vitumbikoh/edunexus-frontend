
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isOpen ? "ml-64" : "ml-20"
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
