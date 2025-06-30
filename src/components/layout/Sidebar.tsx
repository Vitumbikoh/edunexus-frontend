import React, { useState } from 'react';
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
  LogOut,
  ChevronLeft,
  Check,
  Upload,
  FileText,
  Award,
  Download,
  ChartPie,
  MessageSquare,
  CreditCard,
  ChevronDown,
  FileText as ReportIcon,
} from 'lucide-react';
import { Button } from "@/components/ui/button";

type SubNavItem = {
  label: string;
  href: string;
  roles: UserRole[];
};

type NavItem = {
  label: string;
  icon: React.ElementType;
  href?: string;
  roles: UserRole[];
  subItems?: SubNavItem[];
};

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['admin', 'teacher', 'student', 'parent'] },
  {
    label: 'Students',
    icon: Users,
    roles: ['admin', 'teacher'],
    subItems: [
      { label: 'View Students', href: '/students/view', roles: ['admin', 'teacher'] },
      { label: 'Add Students', href: '/students/add', roles: ['admin'] },
    ],
  },
  {
    label: 'Teachers',
    icon: User,
    roles: ['admin'],
    subItems: [
      { label: 'View Teachers', href: '/teachers/view', roles: ['admin'] },
      { label: 'Add Teachers', href: '/teachers/add', roles: ['admin'] },
    ],
  },
  {
    label: 'Courses',
    icon: BookOpen,
    roles: ['admin', 'teacher', 'student'],
    subItems: [
      { label: 'View Courses', href: '/courses/view', roles: ['admin', 'teacher', 'student'] },
      { label: 'Add Courses', href: '/courses/add', roles: ['admin'] },
      { label: 'View Exams', href: '/courses/exams', roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'Classes',
    icon: Calendar,
    roles: ['admin', 'teacher', 'student'],
    subItems: [
      { label: 'View Classes', href: '/classes/view', roles: ['admin', 'teacher', 'student'] },
      // { label: 'Add Classes', href: '/classes/add', roles: ['admin'] },
      { label: 'View Schedules', href: '/schedules/view', roles: ['admin', 'teacher', 'student'] },
      // { label: 'Add Schedules', href: '/schedules/add', roles: ['admin'] },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    roles: ['admin', 'parent'],
    subItems: [
      { label: 'View Financial Records', href: '/finance', roles: ['admin', 'parent'] },
      { label: 'View Financial Officers', href: '/finance/officers/view', roles: ['admin'] },
      { label: 'Add Financial Officers', href: '/finance/officers/add', roles: ['admin'] },
    ],
  },
  { label: 'Reports', icon: ReportIcon, href: '/reports', roles: ['admin'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
];

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['teacher'] },
  { label: 'My Students', icon: Users, href: '/my-students', roles: ['teacher'] },
  {
    label: 'My Courses',
    icon: Users,
    roles: ['admin', 'teacher'],
    subItems: [
      { label: 'View Courses', href: '/my-courses', roles: ['admin', 'teacher'] },
      { label: 'Create Exams', href: '/my-courses', roles: ['admin', 'teacher'] },
    ],
  },
  { label: 'My Schedule', icon: Calendar, href: '/my-schedule', roles: ['teacher'] },
  { label: 'Take Attendance', icon: Check, href: '/take-attendance', roles: ['teacher'] },
  { label: 'Learning Materials', icon: Upload, href: '/learning-materials', roles: ['teacher'] },
  { label: 'Submit Grades', icon: FileText, href: '/submit-grades', roles: ['teacher'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['teacher'] },
];

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['student'] },
  { label: 'Assignments', icon: FileText, href: '/assignments', roles: ['student'] },
  { label: 'Grades', icon: Award, href: '/grades', roles: ['student'] },
  { label: 'Schedule', icon: Calendar, href: '/schedule', roles: ['student'] },
  { label: 'Learning Materials', icon: Download, href: '/materials', roles: ['student'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['student'] },
];

const parentNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['parent'] },
  { label: "Children's Performance", icon: ChartPie, href: '/children/performance', roles: ['parent'] },
  { label: 'Attendance', icon: Users, href: '/attendance', roles: ['parent'] },
  { label: 'Finance', icon: DollarSign, href: '/finance', roles: ['parent'] },
  { label: 'Messages', icon: MessageSquare, href: '/messages', roles: ['parent'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['parent'] },
];

const financeNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['finance'] },
  { label: 'Finance Summary', icon: DollarSign, href: '/finance', roles: ['finance'] },
  { label: 'Transactions', icon: CreditCard, href: '/finance/transactions', roles: ['finance'] },
  { label: 'Invoices', icon: FileText, href: '/finance/invoices', roles: ['finance'] },
  { label: 'Reports', icon: ChartPie, href: '/finance/reports', roles: ['finance'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['finance'] },
];

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  if (!user) return null;

  let navItems = adminNavItems;

  if (user.role === 'teacher') {
    navItems = teacherNavItems;
  } else if (user.role === 'student') {
    navItems = studentNavItems;
  } else if (user.role === 'parent') {
    navItems = parentNavItems;
  } else if (user.role === 'finance') {
    navItems = financeNavItems;
  }

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user.role)
  );

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

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
            <div key={item.label}>
              {item.subItems ? (
                <div>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground rounded-md hover:bg-sidebar-accent group transition-colors cursor-pointer",
                      isOpen ? "" : "justify-center"
                    )}
                    onClick={() => isOpen && toggleDropdown(item.label)}
                  >
                    <item.icon className="h-5 w-5" />
                    {isOpen && (
                      <>
                        <span className="ml-3 flex-1">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            openDropdowns.includes(item.label) && "rotate-180"
                          )}
                        />
                      </>
                    )}
                  </div>
                  {isOpen && openDropdowns.includes(item.label) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems
                        .filter(subItem => subItem.roles.includes(user.role))
                        .map((subItem) => (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className="flex items-center px-4 py-2 text-sm text-sidebar-foreground rounded-md hover:bg-sidebar-accent group transition-colors"
                          >
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href!}
                  className={cn(
                    "flex items-center px-4 py-3 text-sidebar-foreground rounded-md hover:bg-sidebar-accent group transition-colors",
                    isOpen ? "" : "justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </Link>
              )}
            </div>
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