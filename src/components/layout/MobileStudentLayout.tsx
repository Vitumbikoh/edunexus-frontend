import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  User, 
  BookOpen, 
  Calendar,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
// Removed title dropdown to avoid duplicate hamburgers on mobile
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type MobileStudentLayoutProps = {
  children: React.ReactNode;
};

const studentNavItems = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    description: 'Overview and progress'
  },
  {
    label: 'My Courses',
    icon: BookOpen,
    href: '/student/courses',
    description: 'Enrolled subjects'
  },
  {
    label: 'Schedule',
    icon: Calendar,
    href: '/student/schedule',
    description: 'Class timetable'
  },
  {
    label: 'My Grades',
    icon: BarChart3,
    href: '/grades',
    description: 'Exam results and performance'
  },
  {
    label: 'Assignments',
    icon: BookOpen,
    href: '/student/assignments',
    description: 'Homework and tasks'
  },
  {
    label: 'Materials',
    icon: BookOpen,
    href: '/student/materials',
    description: 'Course resources'
  },
  {
    label: 'Profile',
    icon: User,
    href: '/profile',
    description: 'My information'
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Preferences'
  }
];

export default function MobileStudentLayout({ children }: MobileStudentLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'ST';
  };

  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    const currentItem = studentNavItems.find(item => item.href === currentPath);
    return currentItem?.label || 'Dashboard';
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    window.setTimeout(() => navigate(path), 120);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-card mobile-student-layout">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Menu Button & Title */}
          <div className="flex items-center space-x-3">
            {/* Back button removed per request */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 h-[100dvh] overflow-hidden" aria-describedby="student-menu-desc">
                <div className="flex flex-col h-full min-h-0">
                  {/* Accessible title/description for screen readers */}
                  <SheetHeader className="sr-only">
                    <SheetTitle>Student Menu</SheetTitle>
                    <SheetDescription id="student-menu-desc">
                      Navigation drawer with student links and profile actions.
                    </SheetDescription>
                  </SheetHeader>
                  {/* Profile Section */}
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getInitials(user?.firstName, user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email?.split('@')[0] || 'Student'
                          }
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            Student
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4">
                    <nav className="space-y-3 px-4 mobile-student-nav">
                      {studentNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.href);
                        
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={(event) => {
                              event.preventDefault();
                              handleNavigation(item.href);
                            }}
                            className={cn(
                              "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium",
                              isActive
                                ? "bg-blue-100 text-blue-700 dark:bg-transparent dark:border dark:border-border dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            <Icon className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.description}
                              </div>
                            </div>
                            {isActive && (
                              <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                      <ThemeToggle />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Simple title (dropdown removed per request) */}
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {getCurrentPageTitle()}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/settings?tab=notifications')}
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge could go here */}
            </Button>
            <Avatar
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-blue-500 text-white text-xs">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Top tab row removed per request; quick pages available via title dropdown */}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <PullToRefresh
          onRefresh={async () => {
            // Refresh current page data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            window.location.reload();
          }}
            offsetTop={72}
            showText={false}
            showIndicator={false}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </PullToRefresh>
      </main>

      {/* Bottom Navigation for Quick Access */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-card border-t border-gray-200 dark:border-border xl:hidden">
        <div className="grid grid-cols-4 gap-2 py-3">
          {studentNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(item.href);
                }}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 text-xs",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden behind bottom nav */}
      <div className="h-16 xl:hidden" />
    </div>
  );
}