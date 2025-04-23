
import React from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  User,
  Home,
  Users,
  BookOpen,
  Calendar,
  Settings,
  DollarSign,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  Check,
  Upload,
  FileText,
  Award,
  Download,
  ChartPie,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
};

// Admin navigation items
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'Students', icon: Users, href: '/students', roles: ['admin', 'teacher'] },
  { label: 'Teachers', icon: User, href: '/teachers', roles: ['admin'] },
  { label: 'Subjects', icon: BookOpen, href: '/subjects', roles: ['admin', 'teacher', 'student'] },
  { label: 'Schedule', icon: Calendar, href: '/schedule', roles: ['admin', 'teacher', 'student'] },
  { label: 'Finance', icon: DollarSign, href: '/finance', roles: ['admin', 'parent'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
];

// Teacher navigation items
const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['teacher'] },
  { label: 'My Students', icon: Users, href: '/my-students', roles: ['teacher'] },
  { label: 'My Subjects', icon: BookOpen, href: '/my-subjects', roles: ['teacher'] },
  { label: 'My Schedule', icon: Calendar, href: '/my-schedule', roles: ['teacher'] },
  { label: 'Take Attendance', icon: Check, href: '/take-attendance', roles: ['teacher'] },
  { label: 'Learning Materials', icon: Upload, href: '/learning-materials', roles: ['teacher'] },
  { label: 'Submit Grades', icon: FileText, href: '/submit-grades', roles: ['teacher'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['teacher'] },
];

// Student navigation items
const studentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['student'] },
  { label: 'Assignments', icon: FileText, href: '/assignments', roles: ['student'] },
  { label: 'Grades', icon: Award, href: '/grades', roles: ['student'] },
  { label: 'Schedule', icon: Calendar, href: '/schedule', roles: ['student'] },
  { label: 'Learning Materials', icon: Download, href: '/materials', roles: ['student'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['student'] },
];

// Parent navigation items
const parentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['parent'] },
  { label: "Children's Performance", icon: ChartPie, href: '/children/performance', roles: ['parent'] },
  { label: 'Attendance', icon: Users, href: '/attendance', roles: ['parent'] },
  { label: 'Finance', icon: DollarSign, href: '/finance', roles: ['parent'] },
  { label: 'Messages', icon: MessageSquare, href: '/messages', roles: ['parent'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['parent'] },
];

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const { user, logout } = useAuth();
  
  if (!user) return null;

  // Choose navigation items based on user role
  let navItems = adminNavItems;
  
  if (user.role === 'teacher') {
    navItems = teacherNavItems;
  } else if (user.role === 'student') {
    navItems = studentNavItems;
  } else if (user.role === 'parent') {
    navItems = parentNavItems;
  }
  
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className={cn(
      "h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-40 transition-all duration-300",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className={cn("flex items-center", isOpen ? "justify-start" : "justify-center w-full")}>
          <div className="rounded-full bg-sms-primary w-10 h-10 flex items-center justify-center">
            <span className="text-white font-bold">SM</span>
          </div>
          {isOpen && <span className="ml-3 font-bold text-lg">SchoolPortal</span>}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle}
          className={cn("p-0", isOpen ? "" : "hidden")}
        >
          <ChevronLeft size={20} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sidebar-foreground rounded-md hover:bg-sidebar-accent group transition-colors",
                isOpen ? "" : "justify-center"
              )}
            >
              <item.icon className="h-5 w-5" />
              {isOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div 
          className={cn(
            "flex items-center cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent p-2 rounded-md",
            isOpen ? "" : "justify-center"
          )}
          onClick={logout}
        >
          <LogOut size={20} />
          {isOpen && <span className="ml-2">Logout</span>}
        </div>
      </div>
    </div>
  );
}
